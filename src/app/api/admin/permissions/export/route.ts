import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthFromRequest } from '@/lib/auth';
import { verifyPermissionFromRequest } from '@/lib/permissions';

const prisma = new PrismaClient();

// Type definitions for the export functionality
interface GroupInfo {
  id: string;
  name: string;
}

interface UserInfo {
  id: string;
  fullName: string | null;
  email: string | null;
}

interface GroupPermissionWithGroup {
  group: GroupInfo;
}

interface UserPermissionWithUser {
  user: UserInfo;
}

interface PermissionWithUsage {
  id: string;
  module: string;
  action: string;
  description: string | null;
  _count?: {
    groupPermissions: number;
    userPermissions: number;
  };
  groupPermissions?: GroupPermissionWithGroup[];
  userPermissions?: UserPermissionWithUser[];
}

// GET - تصدير الصلاحيات
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

    // التحقق من صلاحية تصدير الصلاحيات
    const hasPermission = await verifyPermissionFromRequest(request, 'permissions', 'read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لتصدير الصلاحيات' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const includeUsage = searchParams.get('includeUsage') === 'true';
    const modules = searchParams.get('modules')?.split(',') || [];

    // بناء الاستعلام
    const whereClause = modules.length > 0 ? {
      module: { in: modules }
    } : {};

    // جلب الصلاحيات
    const permissions = await prisma.permission.findMany({
      where: whereClause,
      ...(includeUsage && {
        include: {
          _count: {
            select: {
              groupPermissions: true,
              userPermissions: true
            }
          },
          groupPermissions: {
            include: {
              group: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          userPermissions: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      }),
      orderBy: [
        { module: 'asc' },
        { action: 'asc' }
      ]
    }) as PermissionWithUsage[];

    // إعداد البيانات للتصدير
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalPermissions: permissions.length,
        modules: [...new Set(permissions.map(p => p.module))],
        includeUsage,
        version: '1.0'
      },
      permissions: permissions.map(permission => {
        const basePermission = {
          id: permission.id,
          module: permission.module,
          action: permission.action,
          description: permission.description
        };

        if (includeUsage && '_count' in permission) {
          return {
            ...basePermission,
            usage: {
              groupCount: permission._count?.groupPermissions || 0,
              userCount: permission._count?.userPermissions || 0,
              groups: permission.groupPermissions?.map((gp: GroupPermissionWithGroup) => gp.group) || [],
              users: permission.userPermissions?.map((up: UserPermissionWithUser) => up.user) || []
            }
          };
        }

        return basePermission;
      })
    };

    if (format === 'csv') {
      // تحويل إلى CSV
      const csvHeaders = ['ID', 'Module', 'Action', 'Description'];
      if (includeUsage) {
        csvHeaders.push('Group Count', 'User Count');
      }

      const csvRows = permissions.map(permission => {
        const row = [
          permission.id,
          permission.module,
          permission.action,
          permission.description || ''
        ];

        if (includeUsage && '_count' in permission) {
          row.push(
            (permission._count?.groupPermissions || 0).toString(),
            (permission._count?.userPermissions || 0).toString()
          );
        }

        return row;
      });

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="permissions-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // إرجاع JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="permissions-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    console.error('خطأ في تصدير الصلاحيات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تصدير الصلاحيات' },
      { status: 500 }
    );
  }
}