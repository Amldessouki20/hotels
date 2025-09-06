import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - جلب صلاحيات مجموعة معينة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // التحقق من وجود المجموعة
    const group = await prisma.userGroup.findUnique({
      where: { id }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    // جلب صلاحيات المجموعة
    const groupPermissions = await prisma.groupPermission.findMany({
      where: { 
        groupId: id,
        isAllowed: true
      },
      include: {
        permission: {
          select: {
            id: true,
            module: true,
            action: true,
            description: true
          }
        }
      },
      orderBy: [
        { permission: { module: 'asc' } },
        { permission: { action: 'asc' } }
      ]
    });

    // تنسيق البيانات للإرجاع
    const formattedPermissions = groupPermissions.map(gp => ({
      id: gp.id,
      permissionId: gp.permissionId,
      isAllowed: gp.isAllowed,
      permission: gp.permission
    }));

    return NextResponse.json(formattedPermissions);
  } catch (error) {
    console.error('خطأ في جلب صلاحيات المجموعة:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب صلاحيات المجموعة' },
      { status: 500 }
    );
  }
}