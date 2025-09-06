import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

// Define specific types for better type safety
type UserPermissionWithDetails = {
  permission: {
    id: string;
    module: string;
    action: string;
    description: string | null;
  };
};

// Base user select type for conditional fields
type BaseUserSelect = {
  id: true;
  username: true;
  email: true;
  fullName: true;
  phone: true;
  isActive: true;
  passwordExpired: true;
  passwordNeverExpires: true;
  salary: true;
  maxDiscountRate: true;
  createdAt: true;
  lastPasswordChange: true;
  group: {
    select: {
      id: true;
      name: true;
      description: true;
    };
  };
};

// Type for user with all possible relations
type UserWithAllRelations = Prisma.UserGetPayload<{
  select: BaseUserSelect & {
    userPermissions: {
      select: {
        permission: {
          select: {
            id: true;
            module: true;
            action: true;
            description: true;
          };
        };
      };
    };
    _count: {
      select: {
        userPermissions: true;
        createdBookings: true;
      };
    };
  };
}>;

// Type for user with minimal relations
type UserWithMinimalRelations = Prisma.UserGetPayload<{
  select: BaseUserSelect;
}>;

// Union type for actual query results
type UserWithRelations = UserWithAllRelations | UserWithMinimalRelations;

type ExportUserData = {
  id: string;
  username: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  isActive: boolean;
  passwordExpired: boolean;
  passwordNeverExpires: boolean;
  salary: Prisma.Decimal | null;
  maxDiscountRate: number | null;
  createdAt: Date;
  lastPasswordChange: Date | null;
  group: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  permissions?: {
    id: string;
    module: string;
    action: string;
    description: string | null;
  }[];
  stats?: {
    userPermissions: number;
    createdBookings: number;
  };
};

const prisma = new PrismaClient();

// GET - Export users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const userIds = searchParams.get('userIds')?.split(',').filter(Boolean);
    const includePermissions = searchParams.get('includePermissions') === 'true';
    const includeStats = searchParams.get('includeStats') === 'true';
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const groupId = searchParams.get('groupId');

    // Build where clause
    const whereClause: {
      id?: { in: string[] };
      isActive?: boolean;
      groupId?: string;
    } = {};
    
    if (userIds && userIds.length > 0) {
      whereClause.id = { in: userIds };
    }
    
    if (activeOnly) {
      whereClause.isActive = true;
    }
    
    if (groupId) {
      whereClause.groupId = groupId;
    }

    // Fetch users with related data
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
        passwordExpired: true,
        passwordNeverExpires: true,
        salary: true,
        maxDiscountRate: true,
        createdAt: true,
        lastPasswordChange: true,
        group: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        ...(includePermissions && {
          userPermissions: {
            select: {
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
        ...(includeStats && {
          _count: {
            select: {
              userPermissions: true,
              createdBookings: true
            }
          }
        })
      },
      orderBy: { createdAt: 'desc' }
    });

    // Prepare export data
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalUsers: users.length,
        includePermissions,
        includeStats,
        activeOnly,
        groupId,
        version: '1.0'
      },
      users: users.map((user: UserWithRelations) => {
        const baseUser: ExportUserData = {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          isActive: user.isActive,
          passwordExpired: user.passwordExpired,
          passwordNeverExpires: user.passwordNeverExpires,
          salary: user.salary,
          maxDiscountRate: user.maxDiscountRate,
          createdAt: user.createdAt,
          lastPasswordChange: user.lastPasswordChange,
          group: user.group
        };

        if (includePermissions && 'userPermissions' in user && user.userPermissions) {
          baseUser.permissions = user.userPermissions.map((up) => up.permission);
        }

        if (includeStats && '_count' in user && user._count) {
          baseUser.stats = user._count;
        }

        return baseUser;
      })
    };

    if (format === 'csv') {
      // Convert to CSV
      const csvHeaders = [
        'ID',
        'اسم المستخدم',
        'البريد الإلكتروني',
        'الاسم الكامل',
        'الهاتف',
        'نشط',
        'كلمة المرور منتهية',
        'كلمة المرور لا تنتهي',
        'الراتب',
        'أقصى نسبة خصم',
        'تاريخ الإنشاء',
        'آخر تغيير كلمة مرور',
        'المجموعة',
        'وصف المجموعة'
      ];

      if (includeStats) {
        csvHeaders.push('عدد الصلاحيات', 'عدد الحجوزات');
      }

      const csvRows = users.map(user => {
        const row = [
          user.id,
          user.username,
          user.email || '',
          user.fullName || '',
          user.phone || '',
          user.isActive ? 'نعم' : 'لا',
          user.passwordExpired ? 'نعم' : 'لا',
          user.passwordNeverExpires ? 'نعم' : 'لا',
          user.salary || '',
          user.maxDiscountRate || '',
          user.createdAt.toISOString().split('T')[0],
          user.lastPasswordChange ? user.lastPasswordChange.toISOString().split('T')[0] : '',
          user.group.name,
          user.group.description || ''
        ];

        if (includeStats && '_count' in user) {
          row.push(
            user._count.userPermissions.toString(),
            user._count.createdBookings.toString()
          );
        }

        return row;
      });

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON format
    return NextResponse.json(exportData);

  } catch (error) {
    console.error('خطأ في تصدير المستخدمين:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تصدير المستخدمين' },
      { status: 500 }
    );
  }
}