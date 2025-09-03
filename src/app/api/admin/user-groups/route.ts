import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema للتحقق من صحة البيانات
const createUserGroupSchema = z.object({
  name: z.string().min(1, 'اسم المجموعة مطلوب').max(100, 'اسم المجموعة طويل جداً'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  selectedPermissions: z.array(z.string()).default([])
});

// GET - جلب جميع المجموعات
export async function GET() {
  try {
    const groups = await prisma.userGroup.findMany({
      include: {
        _count: {
          select: {
            users: true,
            groupPermissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('خطأ في جلب المجموعات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المجموعات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء مجموعة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUserGroupSchema.parse(body);

    // التحقق من عدم وجود مجموعة بنفس الاسم
    const existingGroup = await prisma.userGroup.findUnique({
      where: { name: validatedData.name }
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: 'يوجد مجموعة بهذا الاسم بالفعل' },
        { status: 400 }
      );
    }

    // إنشاء المجموعة مع الصلاحيات
    const group = await prisma.userGroup.create({
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

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('خطأ في إنشاء المجموعة:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المجموعة' },
      { status: 500 }
    );
  }
}