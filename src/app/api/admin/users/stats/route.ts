import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthFromRequest } from '@/lib/auth';
import { checkPermissionFromRequest } from '@/lib/permissions';

const prisma = new PrismaClient();

// GET - جلب إحصائيات مفصلة للمستخدمين
export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const authUser = await verifyAuthFromRequest(request);
  if (!authUser) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صلاحية الوصول لإحصائيات المستخدمين
    const hasPermission = await checkPermissionFromRequest(request, 'users', 'read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية للوصول لإحصائيات المستخدمين' },
        { status: 403 }
      );
    }

    // جلب الإحصائيات
    const stats = await prisma.$transaction(async (tx) => {
      // إحصائيات عامة
      const totalUsers = await tx.user.count();
      const activeUsers = await tx.user.count({
        where: { isActive: true }
      });
      const inactiveUsers = totalUsers - activeUsers;

      // إحصائيات المجموعات
      const usersWithGroups = await tx.user.count({
        where: { 
          groupId: { 
            not: null as any 
          } 
        }
      });
      const usersWithoutGroups = totalUsers - usersWithGroups;

      // إحصائيات الصلاحيات المباشرة
      const usersWithDirectPermissions = await tx.user.count({
        where: {
          userPermissions: {
            some: {}
          }
        }
      });

      // توزيع المستخدمين حسب المجموعات
      const usersByGroup = await tx.userGroup.findMany({
        select: {
          id: true,
          name: true,
          isActive: true,
          _count: {
            select: { users: true }
          }
        },
        orderBy: {
          users: { _count: 'desc' }
        }
      });

      // أكثر المستخدمين بصلاحيات مباشرة
      const usersWithMostDirectPermissions = await tx.user.findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          _count: {
            select: { userPermissions: true }
          }
        },
        where: {
          userPermissions: {
            some: {}
          }
        },
        orderBy: {
          userPermissions: { _count: 'desc' }
        },
        take: 10
      });

      // إحصائيات النشاط الأخيرة (آخر 30 يوم)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = {
        newUsers: await tx.user.count({
          where: {
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        recentlyActiveUsers: await tx.user.count({
          where: {
            createdAt: { gte: thirtyDaysAgo }
          }
        })
      };

      // إحصائيات تسجيل الدخول
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const loginStats = {
        lastWeek: await tx.user.count({
          where: {
            createdAt: { gte: sevenDaysAgo }
          }
        }),
        lastMonth: await tx.user.count({
          where: {
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        neverLoggedIn: await tx.user.count({
          where: {
            createdAt: { lte: thirtyDaysAgo }
          }
        })
      };

      // أكثر الصلاحيات المباشرة استخداماً
      const topDirectPermissions = await tx.userPermission.groupBy({
        by: ['permissionId'],
        _count: { permissionId: true },
        orderBy: {
          _count: { permissionId: 'desc' }
        },
        take: 10
      });

      // جلب تفاصيل الصلاحيات الأكثر استخداماً
      const topPermissionDetails = await tx.permission.findMany({
        where: {
          id: { in: topDirectPermissions.map(p => p.permissionId) }
        },
        select: {
          id: true,
          module: true,
          action: true,
          description: true
        }
      });

      // دمج البيانات
      const topDirectPermissionsWithDetails = topDirectPermissions.map(tp => {
        const permission = topPermissionDetails.find(p => p.id === tp.permissionId);
        return {
          permission,
          usageCount: tp._count.permissionId
        };
      });

      // إحصائيات المجموعات
      const groupStats = await tx.user.groupBy({
        by: ['groupId'],
        _count: { groupId: true },
        orderBy: {
          _count: { groupId: 'desc' }
        }
      });

      // توزيع المستخدمين حسب تاريخ الإنشاء (آخر 12 شهر)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const userGrowth = await tx.user.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        where: {
          createdAt: { gte: twelveMonthsAgo }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // تجميع النمو الشهري
      const monthlyGrowth = userGrowth.reduce((acc, user) => {
        const month = user.createdAt.toISOString().substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + user._count.id;
        return acc;
      }, {} as Record<string, number>);

      return {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          usersWithGroups,
          usersWithoutGroups,
          usersWithDirectPermissions
        },
        groupDistribution: usersByGroup,
        topUsersWithDirectPermissions: usersWithMostDirectPermissions,
        topDirectPermissions: topDirectPermissionsWithDetails,
        loginActivity: loginStats,
        recentActivity,
        groupStats: groupStats,
        growth: {
          monthly: monthlyGrowth,
          total: Object.values(monthlyGrowth).reduce((sum, count) => sum + count, 0)
        }
      };
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('خطأ في جلب إحصائيات المستخدمين:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإحصائيات' },
      { status: 500 }
    );
  }
}