import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema للتحقق من صحة البيانات
const updateUserGroupSchema = z.object({
  name: z.string().min(1, 'اسم المجموعة مطلوب').max(100, 'اسم المجموعة طويل جداً'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  selectedPermissions: z.array(z.string()).default([])
});

// GET - جلب مجموعة واحدة مع تفاصيلها
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const group = await prisma.userGroup.findUnique({
        where: { id },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            isActive: true
          }
        },
        groupPermissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true,
            groupPermissions: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('خطأ في جلب المجموعة:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المجموعة' },
      { status: 500 }
    );
  }
}

// PUT - تحديث مجموعة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const validatedData = updateUserGroupSchema.parse(body);

    // التحقق من وجود المجموعة
    const existingGroup = await prisma.userGroup.findUnique({
        where: { id }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من عدم وجود مجموعة أخرى بنفس الاسم
    if (validatedData.name !== existingGroup.name) {
      const duplicateGroup = await prisma.userGroup.findUnique({
        where: { name: validatedData.name }
      });

      if (duplicateGroup) {
        return NextResponse.json(
          { error: 'يوجد مجموعة بهذا الاسم بالفعل' },
          { status: 400 }
        );
      }
    }

    // تحديث المجموعة مع الصلاحيات
    const updatedGroup = await prisma.$transaction(async (tx) => {
      // حذف الصلاحيات الحالية
      await tx.groupPermission.deleteMany({
        where: { groupId: id }
      });

      // تحديث المجموعة وإضافة الصلاحيات الجديدة
      return await tx.userGroup.update({
        where: { id },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          isActive: validatedData.isActive,
          groupPermissions: {
            create: validatedData.selectedPermissions.map(permissionId => ({
              permissionId,
              isAllowed: true
            }))
          }
        },
        include: {
          _count: {
            select: {
              users: true,
              groupPermissions: true
            }
          }
        }
      });
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('خطأ في تحديث المجموعة:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المجموعة' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مجموعة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // التحقق من وجود المجموعة
    const group = await prisma.userGroup.findUnique({
        where: { id },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من عدم وجود مستخدمين في المجموعة
    if (group._count.users > 0) {
      return NextResponse.json(
        { 
          error: `لا يمكن حذف المجموعة لأنها تحتوي على ${group._count.users} مستخدم. يرجى نقل المستخدمين إلى مجموعة أخرى أولاً.` 
        },
        { status: 400 }
      );
    }

    // حذف المجموعة (سيتم حذف الصلاحيات تلقائياً بسبب onDelete: Cascade)
    await prisma.userGroup.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'تم حذف المجموعة بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف المجموعة:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المجموعة' },
      { status: 500 }
    );
  }
}