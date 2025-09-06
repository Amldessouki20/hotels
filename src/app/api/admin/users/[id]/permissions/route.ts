import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthFromRequest } from '@/lib/auth';
import { checkPermissionFromRequest } from '@/lib/permissions';
import { z } from 'zod';

// Schema للتحقق من صحة البيانات
const userPermissionSchema = z.object({
  permissionId: z.string().min(1, 'معرف الصلاحية مطلوب'),
  isAllowed: z.boolean().default(true)
});

const bulkPermissionsSchema = z.object({
  permissions: z.array(userPermissionSchema)
});

// GET - جلب صلاحيات مستخدم محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من المصادقة
    const authResult = await verifyAuthFromRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user;

    // التحقق من صلاحية الوصول لإدارة المستخدمين
    const hasPermission = await checkPermissionFromRequest(request, 'users', 'read');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لعرض صلاحيات المستخدمين' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // التحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, fullName: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // جلب صلاحيات المستخدم المباشرة
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId },
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

    // جلب صلاحيات المجموعة للمقارنة
    const userWithGroup = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        group: {
          include: {
            groupPermissions: {
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
            }
          }
        }
      }
    });

    const groupPermissions = userWithGroup?.group?.groupPermissions || [];

    // تجميع الصلاحيات حسب الوحدة
    const permissionsByModule: Record<string, any[]> = {};
    
    // إضافة صلاحيات المستخدم المباشرة
    userPermissions.forEach(up => {
      const module = up.permission.module;
      if (!permissionsByModule[module]) {
        permissionsByModule[module] = [];
      }
      permissionsByModule[module].push({
        ...up.permission,
        isAllowed: up.isAllowed,
        source: 'user',
        userPermissionId: up.id
      });
    });

    // إضافة صلاحيات المجموعة (إذا لم تكن موجودة في صلاحيات المستخدم)
    groupPermissions.forEach(gp => {
      const module = gp.permission.module;
      if (!permissionsByModule[module]) {
        permissionsByModule[module] = [];
      }
      
      // التحقق من عدم وجود الصلاحية في صلاحيات المستخدم المباشرة
      const existsInUserPermissions = userPermissions.some(
        up => up.permissionId === gp.permissionId
      );
      
      if (!existsInUserPermissions) {
        permissionsByModule[module].push({
          ...gp.permission,
          isAllowed: gp.isAllowed,
          source: 'group',
          groupPermissionId: gp.id
        });
      }
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName
      },
      permissions: permissionsByModule,
      summary: {
        totalUserPermissions: userPermissions.length,
        totalGroupPermissions: groupPermissions.length,
        modules: Object.keys(permissionsByModule)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب صلاحيات المستخدم:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب صلاحيات المستخدم' },
      { status: 500 }
    );
  }
}

// POST - إضافة صلاحية للمستخدم
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const hasPermission = await checkPermissionFromRequest(request, 'users', 'update');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لتحديث صلاحيات المستخدمين' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const body = await request.json();
    
    // التحقق من نوع البيانات (صلاحية واحدة أم متعددة)
    let validatedData;
    if (Array.isArray(body.permissions)) {
      validatedData = bulkPermissionsSchema.parse(body);
    } else {
      const singlePermission = userPermissionSchema.parse(body);
      validatedData = { permissions: [singlePermission] };
    }

    // التحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من وجود الصلاحيات
    const permissionIds = validatedData.permissions.map(p => p.permissionId);
    const existingPermissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } }
    });

    if (existingPermissions.length !== permissionIds.length) {
      return NextResponse.json(
        { error: 'بعض الصلاحيات المحددة غير موجودة' },
        { status: 400 }
      );
    }

    // إضافة أو تحديث الصلاحيات
    const results = [];
    for (const permissionData of validatedData.permissions) {
      const result = await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permissionData.permissionId
          }
        },
        update: {
          isAllowed: permissionData.isAllowed
        },
        create: {
          userId,
          permissionId: permissionData.permissionId,
          isAllowed: permissionData.isAllowed
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
        }
      });
      results.push(result);
    }

    return NextResponse.json({
      message: `تم ${validatedData.permissions.length === 1 ? 'إضافة/تحديث الصلاحية' : 'إضافة/تحديث الصلاحيات'} بنجاح`,
      permissions: results
    });

  } catch (error) {
    console.error('خطأ في إضافة صلاحيات المستخدم:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في إضافة صلاحيات المستخدم' },
      { status: 500 }
    );
  }
}

// DELETE - حذف صلاحية من المستخدم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const hasPermission = await checkPermissionFromRequest(request, 'users', 'delete');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لحذف صلاحيات المستخدمين' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get('permissionId');

    if (!permissionId) {
      return NextResponse.json(
        { error: 'معرف الصلاحية مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // حذف الصلاحية
    const deletedPermission = await prisma.userPermission.deleteMany({
      where: {
        userId,
        permissionId
      }
    });

    if (deletedPermission.count === 0) {
      return NextResponse.json(
        { error: 'الصلاحية غير موجودة للمستخدم' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'تم حذف الصلاحية بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حذف صلاحية المستخدم:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف صلاحية المستخدم' },
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