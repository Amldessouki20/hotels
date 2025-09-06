import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthFromRequest } from '@/lib/auth';
import { checkPermissionFromRequest } from '@/lib/permissions';

const prisma = new PrismaClient();

// GET - جلب إحصائيات مفصلة للمجموعات
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

    // التحقق من صلاحية الوصول لإدارة المجموعات
    const hasPermission = await checkPermissionFromRequest(request, 'user_groups', 'read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية للوصول لإحصائيات المجموعات' },
        { status: 403 }
      );
    }

    // جلب الإحصائيات
    const stats = await prisma.$transaction(async (tx) => {
      // إحصائيات عامة
      const totalGroups = await tx.userGroup.count();
      const activeGroups = await tx.userGroup.count({
        where: { isActive: true }
      });
      const inactiveGroups = totalGroups - activeGroups;

      // إحصائيات المستخدمين
      const totalUsers = await tx.user.count();
      const usersWithGroups = await tx.user.count({
        where: { 
          groupId: { 
            not: null as any 
          } 
        }
      });
      const usersWithoutGroups = totalUsers - usersWithGroups;

      // إحصائيات الصلاحيات
      const totalPermissions = await tx.permission.count();
      const usedPermissions = await tx.groupPermission.groupBy({
        by: ['permissionId'],
        _count: { permissionId: true }
      });
      const uniqueUsedPermissions = usedPermissions.length;
      const unusedPermissions = totalPermissions - uniqueUsedPermissions;

      // أكثر المجموعات استخداماً (بعدد المستخدمين)
      const topGroupsByUsers = await tx.userGroup.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { users: true }
          }
        },
        orderBy: {
          users: { _count: 'desc' }
        },
        take: 5
      });

      // أكثر المجموعات بعدد الصلاحيات
      const topGroupsByPermissions = await tx.userGroup.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { groupPermissions: true }
          }
        },
        orderBy: {
          groupPermissions: { _count: 'desc' }
        },
        take: 5
      });

      // توزيع المستخدمين حسب المجموعات
      const userDistribution = await tx.userGroup.findMany({
        select: {
          id: true,
          name: true,
          isActive: true,
          _count: {
            select: { users: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      // أكثر الصلاحيات استخداماً في المجموعات
      const topPermissions = await tx.groupPermission.groupBy({
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
          id: { in: topPermissions.map(p => p.permissionId) }
        },
        select: {
          id: true,
          module: true,
          action: true,
          description: true
        }
      });

      // دمج البيانات
      const topPermissionsWithDetails = topPermissions.map(tp => {
        const permission = topPermissionDetails.find(p => p.id === tp.permissionId);
        return {
          permission,
          usageCount: tp._count.permissionId
        };
      });

      // إحصائيات النشاط الأخيرة (آخر 30 يوم)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = {
        newGroups: await tx.userGroup.count({
          where: {
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        newUsers: await tx.user.count({
          where: {
            createdAt: { gte: thirtyDaysAgo }
          }
        })
      };

      return {
        overview: {
          totalGroups,
          activeGroups,
          inactiveGroups,
          totalUsers,
          usersWithGroups,
          usersWithoutGroups,
          totalPermissions,
          usedPermissions: uniqueUsedPermissions,
          unusedPermissions
        },
        topGroups: {
          byUsers: topGroupsByUsers,
          byPermissions: topGroupsByPermissions
        },
        userDistribution,
        topPermissions: topPermissionsWithDetails,
        recentActivity
      };
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('خطأ في جلب إحصائيات المجموعات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإحصائيات' },
      { status: 500 }
    );
  }
}