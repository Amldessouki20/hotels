import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthFromRequest } from '@/lib/auth';
import { checkPermissionFromRequest } from '@/lib/permissions';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema للعمليات المجمعة
const bulkDeleteSchema = z.object({
  groupIds: z.array(z.string()).min(1, 'يجب تحديد مجموعة واحدة على الأقل')
});

const bulkUpdateStatusSchema = z.object({
  groupIds: z.array(z.string()).min(1, 'يجب تحديد مجموعة واحدة على الأقل'),
  isActive: z.boolean()
});

const bulkAssignPermissionsSchema = z.object({
  groupIds: z.array(z.string()).min(1, 'يجب تحديد مجموعة واحدة على الأقل'),
  permissionIds: z.array(z.string()).min(1, 'يجب تحديد صلاحية واحدة على الأقل'),
  action: z.enum(['add', 'remove', 'replace'])
});

// DELETE - حذف مجموعات متعددة
export async function DELETE(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const authUser = await verifyAuthFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صلاحية حذف المجموعات
    const hasPermission = await checkPermissionFromRequest(request, 'user_groups', 'delete');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لحذف المجموعات' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = bulkDeleteSchema.parse(body);

    // التحقق من وجود المجموعات
    const existingGroups = await prisma.userGroup.findMany({
      where: {
        id: { in: validatedData.groupIds }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (existingGroups.length !== validatedData.groupIds.length) {
      return NextResponse.json(
        { error: 'بعض المجموعات المحددة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من المجموعات التي تحتوي على مستخدمين
    const groupsWithUsers = existingGroups.filter(g => g._count.users > 0);

    if (groupsWithUsers.length > 0) {
      return NextResponse.json({
        error: 'لا يمكن حذف المجموعات التي تحتوي على مستخدمين',
        groupsWithUsers: groupsWithUsers.map(g => ({
          id: g.id,
          name: g.name,
          userCount: g._count.users
        }))
      }, { status: 400 });
    }

    // حذف المجموعات مع صلاحياتها
    const result = await prisma.$transaction(async (tx) => {
      // حذف صلاحيات المجموعات أولاً
      await tx.groupPermission.deleteMany({
        where: {
          groupId: { in: validatedData.groupIds }
        }
      });

      // حذف المجموعات
      const deletedGroups = await tx.userGroup.deleteMany({
        where: {
          id: { in: validatedData.groupIds }
        }
      });

      return deletedGroups;
    });

    return NextResponse.json({
      message: `تم حذف ${result.count} مجموعة بنجاح`,
      deletedCount: result.count
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    console.error('خطأ في حذف المجموعات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المجموعات' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث حالة مجموعات متعددة
export async function PATCH(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const authUser = await verifyAuthFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صلاحية تحديث المجموعات
    const hasPermission = await checkPermissionFromRequest(request, 'user_groups', 'update');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لتحديث المجموعات' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    if (operation === 'status') {
      const validatedData = bulkUpdateStatusSchema.parse(body);

      // التحقق من وجود المجموعات
      const existingGroups = await prisma.userGroup.findMany({
        where: {
          id: { in: validatedData.groupIds }
        },
        select: { id: true }
      });

      if (existingGroups.length !== validatedData.groupIds.length) {
        return NextResponse.json(
          { error: 'بعض المجموعات المحددة غير موجودة' },
          { status: 404 }
        );
      }

      // تحديث حالة المجموعات
      const result = await prisma.userGroup.updateMany({
        where: {
          id: { in: validatedData.groupIds }
        },
        data: {
          isActive: validatedData.isActive
        }
      });

      return NextResponse.json({
        message: `تم تحديث حالة ${result.count} مجموعة بنجاح`,
        updatedCount: result.count,
        newStatus: validatedData.isActive ? 'نشطة' : 'غير نشطة'
      });
    }

    if (operation === 'permissions') {
      const validatedData = bulkAssignPermissionsSchema.parse(body);

      // التحقق من وجود المجموعات والصلاحيات
      const [existingGroups, existingPermissions] = await Promise.all([
        prisma.userGroup.findMany({
          where: { id: { in: validatedData.groupIds } },
          select: { id: true }
        }),
        prisma.permission.findMany({
          where: { id: { in: validatedData.permissionIds } },
          select: { id: true }
        })
      ]);

      if (existingGroups.length !== validatedData.groupIds.length) {
        return NextResponse.json(
          { error: 'بعض المجموعات المحددة غير موجودة' },
          { status: 404 }
        );
      }

      if (existingPermissions.length !== validatedData.permissionIds.length) {
        return NextResponse.json(
          { error: 'بعض الصلاحيات المحددة غير موجودة' },
          { status: 404 }
        );
      }

      // تنفيذ العملية حسب النوع
      const result = await prisma.$transaction(async (tx) => {
        let affectedCount = 0;

        for (const groupId of validatedData.groupIds) {
          if (validatedData.action === 'replace') {
            // حذف جميع الصلاحيات الحالية
            await tx.groupPermission.deleteMany({
              where: { groupId }
            });
            
            // إضافة الصلاحيات الجديدة
            await tx.groupPermission.createMany({
              data: validatedData.permissionIds.map(permissionId => ({
                groupId,
                permissionId
              })),
              skipDuplicates: true
            });
            affectedCount++;
          } else if (validatedData.action === 'add') {
            // إضافة الصلاحيات الجديدة
            await tx.groupPermission.createMany({
              data: validatedData.permissionIds.map(permissionId => ({
                groupId,
                permissionId
              })),
              skipDuplicates: true
            });
            affectedCount++;
          } else if (validatedData.action === 'remove') {
            // حذف الصلاحيات المحددة
            const deleted = await tx.groupPermission.deleteMany({
              where: {
                groupId,
                permissionId: { in: validatedData.permissionIds }
              }
            });
            if (deleted.count > 0) affectedCount++;
          }
        }

        return { affectedCount };
      });

      const actionText = {
        add: 'إضافة',
        remove: 'حذف',
        replace: 'استبدال'
      }[validatedData.action];

      return NextResponse.json({
        message: `تم ${actionText} الصلاحيات لـ ${result.affectedCount} مجموعة بنجاح`,
        affectedCount: result.affectedCount,
        action: validatedData.action
      });
    }

    return NextResponse.json(
      { error: 'عملية غير مدعومة' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    console.error('خطأ في تحديث المجموعات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المجموعات' },
      { status: 500 }
    );
  }
}