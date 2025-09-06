import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthFromRequest } from '@/lib/auth';
import { verifyPermissionFromRequest } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema للتحقق من صحة البيانات
const createUserSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional(),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  groupId: z.string().min(1, 'مجموعة المستخدم مطلوبة'),
  salary: z.number().optional(),
  maxDiscountRate: z.number().min(0).max(100).optional(),
  isActive: z.boolean().default(true),
  passwordNeverExpires: z.boolean().default(false)
});

// Schema for updating users - currently unused but kept for future use
// const updateUserSchema = createUserSchema.partial().extend({
//   id: z.string().min(1, 'معرف المستخدم مطلوب')
// });

const userFiltersSchema = z.object({
  search: z.string().optional(),
  groupId: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

// GET - جلب جميع المستخدمين مع الفلترة والبحث
export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const authResult = await verifyAuthFromRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صلاحية الوصول لإدارة المستخدمين
    const hasPermission = await verifyPermissionFromRequest(request, 'users', 'read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لعرض المستخدمين' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const filters = userFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      groupId: searchParams.get('groupId') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    });

    // بناء شروط البحث
    const where: Prisma.UserWhereInput = {};
    
    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search, mode: 'insensitive' } },
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    if (filters.groupId) {
      where.groupId = filters.groupId;
    }
    
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // حساب الإزاحة للصفحات
    const skip = (filters.page - 1) * filters.limit;

    // جلب المستخدمين مع معلومات المجموعة
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: filters.limit,
        include: {
          group: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          _count: {
            select: {
              userPermissions: true,
              createdBookings: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    // إزالة كلمات المرور من النتائج
    const safeUsers = users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...safeUser } = user;
      return safeUser;
    });

    return NextResponse.json({
      users: safeUsers,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / filters.limit)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المستخدمين' },
      { status: 500 }
    );
  }
}

// POST - إنشاء مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const authResult = await verifyAuthFromRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // التحقق من صلاحية إنشاء المستخدمين
    const hasCreatePermission = await verifyPermissionFromRequest(request, 'users', 'create');
    if (!hasCreatePermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لإنشاء المستخدمين' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // التحقق من عدم وجود مستخدم بنفس اسم المستخدم
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: validatedData.username },
          ...(validatedData.email ? [{ email: validatedData.email }] : [])
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'اسم المستخدم أو البريد الإلكتروني موجود بالفعل' },
        { status: 400 }
      );
    }

    // التحقق من وجود المجموعة
    const group = await prisma.userGroup.findUnique({
      where: { id: validatedData.groupId }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'المجموعة المحددة غير موجودة' },
        { status: 400 }
      );
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // إنشاء المستخدم
    const newUser = await prisma.user.create({
      data: {
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        groupId: validatedData.groupId,
        salary: validatedData.salary,
        maxDiscountRate: validatedData.maxDiscountRate,
        isActive: validatedData.isActive,
        passwordNeverExpires: validatedData.passwordNeverExpires,
        lastPasswordChange: new Date()
      },
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = newUser;

    return NextResponse.json(
      { 
        message: 'تم إنشاء المستخدم بنجاح',
        user: safeUser
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المستخدم' },
      { status: 500 }
    );
  }
}

// منع الطرق الأخرى
export async function PUT() {
  return NextResponse.json(
    { error: 'الطريقة غير مدعومة' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'الطريقة غير مدعومة' },
    { status: 405 }
  );
}