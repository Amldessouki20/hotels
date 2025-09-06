import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for bulk operations
const bulkActionSchema = z.object({
  userIds: z.array(z.string()).min(1, 'يجب تحديد مستخدم واحد على الأقل'),
  action: z.enum(['activate', 'deactivate']).optional()
});

const bulkDeleteSchema = z.object({
  userIds: z.array(z.string()).min(1, 'يجب تحديد مستخدم واحد على الأقل')
});

// PATCH - Bulk update users (activate/deactivate)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds, action } = bulkActionSchema.parse(body);

    if (!action) {
      return NextResponse.json(
        { error: 'يجب تحديد نوع العملية' },
        { status: 400 }
      );
    }

    const isActive = action === 'activate';

    // Update users in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if users exist
      const existingUsers = await tx.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true }
      });

      if (existingUsers.length !== userIds.length) {
        const foundIds = existingUsers.map(u => u.id);
        const missingIds = userIds.filter(id => !foundIds.includes(id));
        throw new Error(`المستخدمون التاليون غير موجودون: ${missingIds.join(', ')}`);
      }

      // Update users
      const updatedUsers = await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { 
          isActive
        }
      });

      return {
        count: updatedUsers.count,
        action: isActive ? 'تفعيل' : 'إلغاء تفعيل',
        users: existingUsers
      };
    });

    return NextResponse.json({
      success: true,
      message: `تم ${result.action} ${result.count} مستخدم بنجاح`,
      data: {
        updatedCount: result.count,
        action: result.action,
        users: result.users
      }
    });

  } catch (error) {
    console.error('خطأ في العملية المجمعة للمستخدمين:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete users
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds } = bulkDeleteSchema.parse(body);

    // Delete users in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if users exist and get their info
      const existingUsers = await tx.user.findMany({
        where: { id: { in: userIds } },
        select: { 
          id: true, 
          username: true,
          group: {
            select: {
              name: true
            }
          }
        }
      });

      if (existingUsers.length !== userIds.length) {
        const foundIds = existingUsers.map(u => u.id);
        const missingIds = userIds.filter(id => !foundIds.includes(id));
        throw new Error(`المستخدمون التاليون غير موجودون: ${missingIds.join(', ')}`);
      }

      // Note: System user check removed as isSystemGroup property doesn't exist in UserGroup model

      // Delete user permissions first
      await tx.userPermission.deleteMany({
        where: { userId: { in: userIds } }
      });

      // Delete users
      const deletedUsers = await tx.user.deleteMany({
        where: { id: { in: userIds } }
      });

      return {
        count: deletedUsers.count,
        users: existingUsers
      };
    });

    return NextResponse.json({
      success: true,
      message: `تم حذف ${result.count} مستخدم بنجاح`,
      data: {
        deletedCount: result.count,
        users: result.users
      }
    });

  } catch (error) {
    console.error('خطأ في حذف المستخدمين:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}