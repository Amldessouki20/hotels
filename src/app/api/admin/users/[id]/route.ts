import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthFromRequest } from '@/lib/auth';
import { checkPermissionFromRequest } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Schema للتحقق من صحة البيانات للتحديث
const updateUserSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل').optional(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional(),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  groupId: z.string().optional(),
  salary: z.number().optional(),
  maxDiscountRate: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  passwordNeverExpires: z.boolean().optional()
});

// GET - جلب مستخدم محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من المصادقة
    const authUser = await verifyAuthFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صلاحية الوصول لإدارة المستخدمين
    const hasPermission = await checkPermissionFromRequest(request, 'users', 'read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لعرض المستخدمين' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // جلب المستخدم مع معلومات المجموعة والصلاحيات
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true
          }
        },
        userPermissions: {
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
        },
        _count: {
          select: {
            createdBookings: true,
            updatedBookings: true,
            createdHotels: true,
            createdRooms: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // إزالة كلمة المرور من النتيجة
    const { password, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });

  } catch (error) {
    console.error('خطأ في جلب المستخدم:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المستخدم' },
      { status: 500 }
    );
  }
}

// PUT - تحديث مستخدم
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من المصادقة
    const authUser = await verifyAuthFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صلاحية الوصول لإدارة المستخدمين
    const hasPermission = await checkPermissionFromRequest(request, 'users', 'update');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لتحديث المستخدمين' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من عدم تضارب اسم المستخدم أو البريد الإلكتروني
    if (validatedData.username || validatedData.email) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(validatedData.username ? [{ username: validatedData.username }] : []),
                ...(validatedData.email ? [{ email: validatedData.email }] : [])
              ]
            }
          ]
        }
      });

      if (conflictUser) {
        return NextResponse.json(
          { error: 'اسم المستخدم أو البريد الإلكتروني موجود بالفعل' },
          { status: 400 }
        );
      }
    }

    // التحقق من وجود المجموعة إذا تم تحديدها
    if (validatedData.groupId) {
      const group = await prisma.userGroup.findUnique({
        where: { id: validatedData.groupId }
      });

      if (!group) {
        return NextResponse.json(
          { error: 'المجموعة المحددة غير موجودة' },
          { status: 400 }
        );
      }
    }

    // إعداد البيانات للتحديث
    const updateData: any = { ...validatedData };

    // تشفير كلمة المرور إذا تم تحديدها
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12);
      updateData.lastPasswordChange = new Date();
    }

    // تحديث المستخدم
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    // إزالة كلمة المرور من النتيجة
    const { password, ...safeUser } = updatedUser;

    return NextResponse.json({
      message: 'تم تحديث المستخدم بنجاح',
      user: safeUser
    });

  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المستخدم' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مستخدم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من المصادقة
    const authUser = await verifyAuthFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صلاحية الوصول لإدارة المستخدمين
    const hasPermission = await checkPermissionFromRequest(request, 'users', 'delete');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لحذف المستخدمين' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            createdBookings: true,
            updatedBookings: true,
            createdHotels: true,
            createdRooms: true
          }
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // منع حذف المستخدم الحالي
    if (authUser.id === userId) {
      return NextResponse.json(
        { error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 400 }
      );
    }

    // التحقق من وجود بيانات مرتبطة
    const hasRelatedData = 
      existingUser._count.createdBookings > 0 ||
      existingUser._count.updatedBookings > 0 ||
      existingUser._count.createdHotels > 0 ||
      existingUser._count.createdRooms > 0;

    if (hasRelatedData) {
      // إلغاء تفعيل المستخدم بدلاً من حذفه
      const deactivatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
        select: {
          id: true,
          username: true,
          fullName: true,
          isActive: true
        }
      });

      return NextResponse.json({
        message: 'تم إلغاء تفعيل المستخدم بدلاً من حذفه لوجود بيانات مرتبطة',
        user: deactivatedUser,
        action: 'deactivated'
      });
    }

    // حذف المستخدم إذا لم توجد بيانات مرتبطة
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      message: 'تم حذف المستخدم بنجاح',
      action: 'deleted'
    });

  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المستخدم' },
      { status: 500 }
    );
  }
}

// منع الطرق الأخرى
export async function POST() {
  return NextResponse.json(
    { error: 'الطريقة غير مدعومة' },
    { status: 405 }
  );
}