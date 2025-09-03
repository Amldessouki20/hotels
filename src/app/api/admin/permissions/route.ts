import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema للتحقق من صحة البيانات - مرن بالكامل
const createPermissionSchema = z.object({
  module: z.string()
    .min(1, 'اسم الوحدة مطلوب')
    .max(50, 'اسم الوحدة طويل جداً')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'اسم الوحدة يجب أن يبدأ بحرف ويحتوي على أحرف وأرقام و _ فقط'),
  action: z.string()
    .min(1, 'اسم العملية مطلوب')
    .max(50, 'اسم العملية طويل جداً')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'اسم العملية يجب أن يبدأ بحرف ويحتوي على أحرف وأرقام و _ فقط'),
  description: z.string().max(500, 'الوصف طويل جداً').optional()
});

// GET - جلب جميع الصلاحيات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module');
    const action = searchParams.get('action');
    const search = searchParams.get('search');

    // بناء شروط البحث
    const where: any = {};
    
    if (module) {
      where.module = module;
    }
    
    if (action) {
      where.action = action;
    }
    
    if (search) {
      where.OR = [
        { module: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const permissions = await prisma.permission.findMany({
      where,
      include: {
        _count: {
          select: {
            groupPermissions: true,
            userPermissions: true
          }
        }
      },
      orderBy: [
        { module: 'asc' },
        { action: 'asc' }
      ]
    });

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('خطأ في جلب الصلاحيات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الصلاحيات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء صلاحية جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPermissionSchema.parse(body);

    // التحقق من عدم وجود صلاحية بنفس الوحدة والعملية
    const existingPermission = await prisma.permission.findUnique({
      where: {
        module_action: {
          module: validatedData.module,
          action: validatedData.action
        }
      }
    });

    if (existingPermission) {
      return NextResponse.json(
        { 
          error: `الصلاحية ${validatedData.module}.${validatedData.action} موجودة بالفعل` 
        },
        { status: 400 }
      );
    }

    // إنشاء الصلاحية الجديدة
    const permission = await prisma.permission.create({
      data: {
        module: validatedData.module,
        action: validatedData.action,
        description: validatedData.description
      },
      include: {
        _count: {
          select: {
            groupPermissions: true,
            userPermissions: true
          }
        }
      }
    });

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error('خطأ في إنشاء الصلاحية:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الصلاحية' },
      { status: 500 }
    );
  }
}

// GET - جلب إحصائيات الصلاحيات
export async function OPTIONS() {
  try {
    // جلب إحصائيات عامة
    const stats = await prisma.$transaction([
      // عدد الصلاحيات الإجمالي
      prisma.permission.count(),
      
      // عدد الوحدات الفريدة
      prisma.permission.groupBy({
        by: ['module'],
        _count: { module: true },
        orderBy: { module: 'asc' }
      }),
      
      // أكثر الوحدات استخداماً
      prisma.permission.groupBy({
        by: ['module'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      }),
      
      // أكثر العمليات استخداماً
      prisma.permission.groupBy({
        by: ['action'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      })
    ]);

    const [totalPermissions, moduleGroups, topModules, topActions] = stats;

    return NextResponse.json({
      totalPermissions,
      totalModules: moduleGroups.length,
      topModules: topModules.map(m => ({
        module: m.module,
        count: (m._count && typeof m._count === 'object' && 'id' in m._count) ? m._count.id : 0
      })),
      topActions: topActions.map(a => ({
        action: a.action,
        count: (a._count && typeof a._count === 'object' && 'id' in a._count) ? a._count.id : 0
      }))
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الصلاحيات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإحصائيات' },
      { status: 500 }
    );
  }
}