import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { verifyAuthFromRequest } from '@/lib/auth';
import { verifyPermissionFromRequest } from '@/lib/permissions';
import { MODULES, ACTIONS } from '@/lib/permissions';

// Types for better type safety
type UserGroupWithRelations = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    users: number;
    groupPermissions: number;
  };
  users?: {
    id: string;
    username?: string;
    fullName: string | null;
    email: string | null;
    isActive: boolean;
  }[];
  groupPermissions?: {
    id: string;
    groupId: string;
    permissionId: string;
    isAllowed: boolean;
    permission: {
      id: string;
      module: string;
      action: string;
      description: string;
    };
  }[];
};

type ExportGroupData = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  membersCount: number;
  permissionsCount: number;
  createdAt: string;
  updatedAt: string;
  members?: {
    id: string;
    username?: string;
    fullName: string;
    email: string;
    isActive: boolean;
  }[];
  permissions?: {
    id: string;
    description: string;
    module: string;
    action: string;
  }[];
};

const prisma = new PrismaClient();

// Validation schema for POST export request
const exportSchema = z.object({
  groupIds: z.array(z.string()).optional(),
  format: z.enum(['json', 'csv']).default('csv'),
  includeMembers: z.boolean().default(false),
  includePermissions: z.boolean().default(false),
  activeOnly: z.boolean().optional(),
});

// GET - تصدير المجموعات
export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const authResult = await verifyAuthFromRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // TODO: التحقق من صلاحية تصدير المجموعات

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const includePermissions = searchParams.get('includePermissions') === 'true';
    const includeUsers = searchParams.get('includeUsers') === 'true';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // بناء الاستعلام
    const whereClause = activeOnly ? { isActive: true } : {};

    // جلب المجموعات
    const groups = await prisma.userGroup.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            users: true,
            groupPermissions: true
          }
        },
        ...(includePermissions && {
          groupPermissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  module: true,
                  action: true,
                  description: true
                }
              }
            }
          }
        }),
        ...(includeUsers && {
          users: {
            select: {
              id: true,
              fullName: true,
              email: true,
              isActive: true
            }
          }
        })
      },
      orderBy: { name: 'asc' }
    });

    // إعداد البيانات للتصدير
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalGroups: groups.length,
        includePermissions,
        includeUsers,
        activeOnly,
        version: '1.0'
      },
      groups: groups.map(group => {
        const baseGroup = {
          id: group.id,
          name: group.name,
          description: group.description,
          isActive: group.isActive,
          createdAt: group.createdAt,
          stats: {
            userCount: group._count.users,
            permissionCount: group._count.groupPermissions
          }
        };

        const result: typeof baseGroup & {
          permissions?: typeof group.groupPermissions extends Array<infer T> ? T extends { permission: infer P } ? P[] : never : never;
          users?: typeof group.users;
        } = { ...baseGroup };

        if (includePermissions && group.groupPermissions) {
          (result as any).permissions = group.groupPermissions.map((gp: any) => gp.permission);
        }

        if (includeUsers && group.users) {
          (result as any).users = group.users;
        }

        return result;
      })
    };

    if (format === 'csv') {
      // تحويل إلى CSV
      const csvHeaders = [
        'ID', 'Name', 'Description', 'Active', 'User Count', 
        'Permission Count', 'Created At'
      ];

      if (includePermissions) {
        csvHeaders.push('Permissions');
      }
      if (includeUsers) {
        csvHeaders.push('Users');
      }

      const csvRows = groups.map(group => {
        const row = [
          group.id,
          group.name,
          group.description || '',
          group.isActive ? 'Yes' : 'No',
          group._count.users.toString(),
          group._count.groupPermissions.toString(),
          group.createdAt.toISOString()
        ];

        if (includePermissions && 'groupPermissions' in group && group.groupPermissions) {
          const permissions = group.groupPermissions
            .map((gp: any) => `${gp.permission.module}:${gp.permission.action}`)
            .join('; ');
          row.push(permissions);
        } else if (includePermissions) {
          row.push('');
        }

        if (includeUsers && 'users' in group) {
          const users = group.users
            .map(u => `${u.fullName} (${u.email})`)
            .join('; ');
          row.push(users);
        }

        return row;
      });

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="user-groups-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // إرجاع JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-groups-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    console.error('خطأ في تصدير المجموعات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تصدير المجموعات' },
      { status: 500 }
    );
  }
}

// POST - تصدير مجموعات محددة (للعمليات المجمعة)
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await verifyPermissionFromRequest(
      request,
      MODULES.GROUPS,
      ACTIONS.EXPORT
    );

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.message || 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = exportSchema.parse(body);

    // بناء شروط الاستعلام
    const whereConditions: {
      id?: { in: string[] };
      isActive?: boolean;
    } = {};

    if (validatedData.groupIds && validatedData.groupIds.length > 0) {
      whereConditions.id = {
        in: validatedData.groupIds
      };
    }

    if (validatedData.activeOnly !== undefined) {
      whereConditions.isActive = validatedData.activeOnly;
    }

    // جلب مجموعات المستخدمين
    const userGroups = await prisma.userGroup.findMany({
      where: whereConditions,
      include: {
        users: validatedData.includeMembers ? {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            isActive: true,
          }
        } : false,
        groupPermissions: validatedData.includePermissions ? {
          include: {
            permission: {
              select: {
                id: true,
                description: true,
                module: true,
                action: true,
              }
            }
          }
        } : false,
        _count: {
          select: {
            users: true,
            groupPermissions: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // تحويل البيانات للتصدير
    const exportData: ExportGroupData[] = userGroups.map((group: any) => {
      const baseData: ExportGroupData = {
        id: group.id,
        name: group.name,
        description: group.description || '',
        isActive: group.isActive,
        membersCount: group._count?.users || 0,
        permissionsCount: group._count?.groupPermissions || 0,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
      };

      if (validatedData.includeMembers && group.users) {
        baseData.members = group.users.map((user: any) => ({
          id: user.id,
          username: user.username || '',
          fullName: user.fullName || '',
          email: user.email || '',
          isActive: user.isActive,
        }));
      }

      if (validatedData.includePermissions && group.groupPermissions) {
        baseData.permissions = group.groupPermissions.map((gp: any) => ({
          id: gp.permission.id,
          description: gp.permission.description,
          module: gp.permission.module,
          action: gp.permission.action,
        }));
      }

      return baseData;
    });

    if (validatedData.format === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData,
        total: exportData.length,
        exportedAt: new Date().toISOString(),
      });
    }

    // إنتاج CSV
    const csvHeaders = [
      'ID',
      'Name',
      'Description',
      'Active',
      'Members Count',
      'Permissions Count',
      'Created At',
      'Updated At'
    ];

    if (validatedData.includeMembers) {
      csvHeaders.push('Members');
    }

    if (validatedData.includePermissions) {
      csvHeaders.push('Permissions');
    }

    const csvRows = exportData.map(group => {
      const row = [
        group.id,
        `"${group.name}"`,
        `"${group.description}"`,
        group.isActive ? 'Yes' : 'No',
        group.membersCount.toString(),
        group.permissionsCount.toString(),
        group.createdAt,
        group.updatedAt
      ];

      if (validatedData.includeMembers) {
        const members = group.members || [];
        const membersList = members.map(m => `${m.fullName} (${m.username || m.email})`).join('; ');
        row.push(`"${membersList}"`);
      }

      if (validatedData.includePermissions) {
        const permissions = group.permissions || [];
        const permissionsList = permissions.map(p => `${p.description} (${p.module}.${p.action})`).join('; ');
        row.push(`"${permissionsList}"`);
      }

      return row.join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="user-groups-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('خطأ في تصدير مجموعات المستخدمين:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات طلب غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}