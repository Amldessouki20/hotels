import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema للتحقق من صحة البيانات عند التعديل
const updatePermissionSchema = z.object({
  module: z.string()
    .min(1, 'اسم الوحدة مطلوب')
    .max(50, 'اسم الوحدة طويل جداً')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'اسم الوحدة يجب أن يبدأ بحرف ويحتوي على أحرف وأرقام و _ فقط')
    .optional(),
  action: z.string()
    .min(1, 'اسم العملية مطلوب')
    .max(50, 'اسم العملية طويل جداً')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'اسم العملية يجب أن يبدأ بحرف ويحتوي على أحرف وأرقام و _ فقط')
    .optional(),
  description: z.string().max(500, 'الوصف طويل جداً').optional()
});

// GET - جلب صلاحية واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permission = await prisma.permission.findUnique({
      where: { id: params.id },
      include: {
        groupPermissions: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        },
        userPermissions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            groupPermissions: true,
            userPermissions: true
          }
        }
      }
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'الصلاحية غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(permission);
  } catch (error) {
    console.error('خطأ في جلب الصلاحية:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الصلاحية' },
      { status: 500 }
    );
  }
}

// PUT - تعديل صلاحية
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updatePermissionSchema.parse(body);

    // التحقق من وجود الصلاحية
    const existingPermission = await prisma.permission.findUnique({
      where: { id: params.id }
    });

    if (!existingPermission) {
      return NextResponse.json(
        { error: 'الصلاحية غير موجودة' },
        { status: 404 }
      );
    }

    // إذا تم تغيير الوحدة أو العملية، تحقق من عدم وجود تضارب
    if (validatedData.module || validatedData.action) {
      const newModule = validatedData.module || existingPermission.module;
      const newAction = validatedData.action || existingPermission.action;
      
      // تحقق من عدم وجود صلاحية أخرى بنفس الوحدة والعملية
      const conflictingPermission = await prisma.permission.findFirst({
        where: {
          AND: [
            { module: newModule },
            { action: newAction },
            { id: { not: params.id } }
          ]
        }
      });

      if (conflictingPermission) {
        return NextResponse.json(
          { 
            error: `الصلاحية ${newModule}.${newAction} موجودة بالفعل` 
          },
          { status: 400 }
        );
      }
    }

    // تعديل الصلاحية
    const updatedPermission = await prisma.permission.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        _count: {
          select: {
            groupPermissions: true,
            userPermissions: true
          }
        }
      }
    });

    return NextResponse.json(updatedPermission);
  } catch (error) {
    console.error('خطأ في تعديل الصلاحية:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في تعديل الصلاحية' },
      { status: 500 }
    );
  }
}

// DELETE - حذف صلاحية
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من وجود الصلاحية
    const permission = await prisma.permission.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            groupPermissions: true,
            userPermissions: true
          }
        }
      }
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'الصلاحية غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من عدم استخدام الصلاحية
    const totalUsage = permission._count.groupPermissions + permission._count.userPermissions;
    if (totalUsage > 0) {
      return NextResponse.json(
        { 
          error: `لا يمكن حذف الصلاحية لأنها مستخدمة في ${permission._count.groupPermissions} مجموعة و ${permission._count.userPermissions} مستخدم`,
          usage: {
            groupPermissions: permission._count.groupPermissions,
            userPermissions: permission._count.userPermissions
          }
        },
        { status: 400 }
      );
    }

    // حذف الصلاحية
    await prisma.permission.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'تم حذف الصلاحية بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('خطأ في حذف الصلاحية:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الصلاحية' },
      { status: 500 }
    );
  }
}