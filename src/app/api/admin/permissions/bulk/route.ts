import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthFromRequest } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema للعمليات المجمعة
const bulkDeleteSchema = z.object({
  permissionIds: z.array(z.string()).min(1, 'يجب تحديد صلاحية واحدة على الأقل')
});

const bulkCreateSchema = z.object({
  permissions: z.array(z.object({
    module: z.string().min(1, 'اسم الوحدة مطلوب'),
    action: z.string().min(1, 'اسم العملية مطلوب'),
    description: z.string().optional()
  })).min(1, 'يجب إضافة صلاحية واحدة على الأقل')
});

// DELETE - حذف صلاحيات متعددة
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

    // TODO: التحقق من صلاحية حذف الصلاحيات

    const body = await request.json();
    const validatedData = bulkDeleteSchema.parse(body);

    // التحقق من وجود الصلاحيات
    const existingPermissions = await prisma.permission.findMany({
      where: {
        id: { in: validatedData.permissionIds }
      },
      select: {
        id: true,
        module: true,
        action: true,
        _count: {
          select: {
            groupPermissions: true,
            userPermissions: true
          }
        }
      }
    });

    if (existingPermissions.length !== validatedData.permissionIds.length) {
      return NextResponse.json(
        { error: 'بعض الصلاحيات المحددة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من الصلاحيات المستخدمة
    const usedPermissions = existingPermissions.filter(
      p => p._count.groupPermissions > 0 || p._count.userPermissions > 0
    );

    if (usedPermissions.length > 0) {
      return NextResponse.json({
        error: 'لا يمكن حذف الصلاحيات المستخدمة',
        usedPermissions: usedPermissions.map(p => ({
          id: p.id,
          module: p.module,
          action: p.action,
          groupCount: p._count.groupPermissions,
          userCount: p._count.userPermissions
        }))
      }, { status: 400 });
    }

    // حذف الصلاحيات
    const result = await prisma.permission.deleteMany({
      where: {
        id: { in: validatedData.permissionIds }
      }
    });

    return NextResponse.json({
      message: `تم حذف ${result.count} صلاحية بنجاح`,
      deletedCount: result.count
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    console.error('خطأ في حذف الصلاحيات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الصلاحيات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء صلاحيات متعددة
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const authUser = await verifyAuthFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // TODO: التحقق من صلاحية إنشاء الصلاحيات

    const body = await request.json();
    const validatedData = bulkCreateSchema.parse(body);

    // التحقق من الصلاحيات المكررة في الطلب
    const permissionKeys = validatedData.permissions.map(p => `${p.module}:${p.action}`);
    const uniqueKeys = new Set(permissionKeys);
    if (uniqueKeys.size !== permissionKeys.length) {
      return NextResponse.json(
        { error: 'يوجد صلاحيات مكررة في الطلب' },
        { status: 400 }
      );
    }

    // التحقق من الصلاحيات الموجودة مسبقاً
    const existingPermissions = await prisma.permission.findMany({
      where: {
        OR: validatedData.permissions.map(p => ({
          AND: [
            { module: p.module },
            { action: p.action }
          ]
        }))
      },
      select: {
        module: true,
        action: true
      }
    });

    if (existingPermissions.length > 0) {
      return NextResponse.json({
        error: 'بعض الصلاحيات موجودة مسبقاً',
        existingPermissions: existingPermissions.map(p => `${p.module}:${p.action}`)
      }, { status: 400 });
    }

    // إنشاء الصلاحيات
    const createdPermissions = await prisma.permission.createMany({
      data: validatedData.permissions.map(p => ({
        module: p.module,
        action: p.action,
        description: p.description || null
      }))
    });

    // جلب الصلاحيات المنشأة للإرجاع
    const newPermissions = await prisma.permission.findMany({
      where: {
        OR: validatedData.permissions.map(p => ({
          AND: [
            { module: p.module },
            { action: p.action }
          ]
        }))
      },
      orderBy: { module: 'asc' }
    });

    return NextResponse.json({
      message: `تم إنشاء ${createdPermissions.count} صلاحية بنجاح`,
      permissions: newPermissions,
      createdCount: createdPermissions.count
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    console.error('خطأ في إنشاء الصلاحيات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الصلاحيات' },
      { status: 500 }
    );
  }
}