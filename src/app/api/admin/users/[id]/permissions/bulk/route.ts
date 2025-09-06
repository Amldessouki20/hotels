import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthFromRequest } from '@/lib/auth';
import { checkPermissionFromRequest } from '@/lib/permissions';
import { z } from 'zod';

// Types for better type safety
type PermissionWithSource = {
  id: string;
  module: string;
  action: string;
  description: string | null;
  source: 'direct' | 'group';
};

type PermissionsByModule = Record<string, PermissionWithSource[]>;

const prisma = new PrismaClient();

// Schema للعمليات المجمعة
const bulkPermissionsSchema = z.object({
  permissionIds: z.array(z.string()).min(1, 'يجب تحديد صلاحية واحدة على الأقل'),
  action: z.enum(['add', 'remove', 'replace'])
});

// POST - إدارة صلاحيات المستخدم بشكل مجمع
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // التحقق من صلاحية إدارة صلاحيات المستخدمين
  const hasPermission = await checkPermissionFromRequest(request, 'users', 'update');
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'ليس لديك صلاحية لإدارة صلاحيات المستخدمين' },
      { status: 403 }
    );
  }

    const userId = params.id;
    const body = await request.json();
    const validatedData = bulkPermissionsSchema.parse(body);

    // التحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        groupId: true,
        group: {
          select: {
            name: true
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

    // التحقق من وجود الصلاحيات
    const existingPermissions = await prisma.permission.findMany({
      where: {
        id: { in: validatedData.permissionIds }
      },
      select: {
        id: true,
        module: true,
        action: true,
        description: true
      }
    });

    if (existingPermissions.length !== validatedData.permissionIds.length) {
      return NextResponse.json(
        { error: 'بعض الصلاحيات المحددة غير موجودة' },
        { status: 404 }
      );
    }

    // تنفيذ العملية حسب النوع
    const result = await prisma.$transaction(async (tx) => {
      let message = '';
      let affectedCount = 0;

      if (validatedData.action === 'replace') {
        // حذف جميع الصلاحيات المباشرة الحالية
        const deleted = await tx.userPermission.deleteMany({
          where: { userId }
        });
        
        // إضافة الصلاحيات الجديدة
        const created = await tx.userPermission.createMany({
          data: validatedData.permissionIds.map(permissionId => ({
            userId,
            permissionId
          })),
          skipDuplicates: true
        });
        
        affectedCount = created.count;
        message = `تم استبدال جميع الصلاحيات المباشرة للمستخدم. تم حذف ${deleted.count} وإضافة ${created.count} صلاحية`;
      } else if (validatedData.action === 'add') {
        // إضافة الصلاحيات الجديدة
        const created = await tx.userPermission.createMany({
          data: validatedData.permissionIds.map(permissionId => ({
            userId,
            permissionId
          })),
          skipDuplicates: true
        });
        
        affectedCount = created.count;
        message = `تم إضافة ${created.count} صلاحية مباشرة للمستخدم`;
      } else if (validatedData.action === 'remove') {
        // حذف الصلاحيات المحددة
        const deleted = await tx.userPermission.deleteMany({
          where: {
            userId,
            permissionId: { in: validatedData.permissionIds }
          }
        });
        
        affectedCount = deleted.count;
        message = `تم حذف ${deleted.count} صلاحية مباشرة من المستخدم`;
      }

      // جلب الصلاحيات المحدثة للمستخدم
      const updatedUserPermissions = await tx.userPermission.findMany({
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
        }
      });

      // جلب صلاحيات المجموعة إذا كان المستخدم ينتمي لمجموعة
      let groupPermissions: {
        id: string;
        module: string;
        action: string;
        description: string;
      }[] = [];
      if (user.groupId) {
        const groupPerms = await tx.groupPermission.findMany({
          where: { groupId: user.groupId },
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
        groupPermissions = groupPerms.map((gp: any) => gp.permission);
      }

      return {
        message,
        affectedCount,
        directPermissions: updatedUserPermissions.map(up => up.permission),
        groupPermissions,
        totalPermissions: updatedUserPermissions.length + groupPermissions.length
      };
    });

    return NextResponse.json({
      ...result,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        group: user.group?.name || null
      },
      action: validatedData.action
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    console.error('خطأ في إدارة صلاحيات المستخدم:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إدارة صلاحيات المستخدم' },
      { status: 500 }
    );
  }
}

// GET - جلب ملخص صلاحيات المستخدم
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const userId = params.id;

    // جلب بيانات المستخدم مع صلاحياته
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        groupId: true,
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
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // جلب صلاحيات المجموعة
    let groupPermissions: {
      id: string;
      module: string;
      action: string;
      description: string;
    }[] = [];
    if (user.groupId) {
      const groupPerms = await prisma.groupPermission.findMany({
        where: { groupId: user.groupId },
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
      groupPermissions = groupPerms.map((gp: any) => gp.permission);
    }

    // تجميع الصلاحيات حسب الوحدة
    const directPermissions = user.userPermissions.map(up => up.permission);
    const allPermissions = [...directPermissions, ...groupPermissions];
    
    // إزالة التكرار
    const uniquePermissions = allPermissions.filter(
      (permission, index, self) => 
        index === self.findIndex(p => p.id === permission.id)
    );

    // تجميع حسب الوحدة
    const permissionsByModule: PermissionsByModule = uniquePermissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push({
        ...permission,
        source: directPermissions.find(dp => dp.id === permission.id) ? 'direct' : 'group'
      });
      return acc;
    }, {} as PermissionsByModule);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        group: user.group
      },
      permissions: {
        direct: directPermissions,
        fromGroup: groupPermissions,
        all: uniquePermissions,
        byModule: permissionsByModule
      },
      summary: {
        totalPermissions: uniquePermissions.length,
        directPermissions: directPermissions.length,
        groupPermissions: groupPermissions.length,
        moduleCount: Object.keys(permissionsByModule).length
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