import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthFromRequest } from '@/lib/auth';
import { verifyPermissionFromRequest } from '@/lib/permissions';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema للاستيراد
const importPermissionSchema = z.object({
  module: z.string().min(1, 'اسم الوحدة مطلوب'),
  action: z.string().min(1, 'اسم العملية مطلوب'),
  description: z.string().optional()
});

const importDataSchema = z.object({
  permissions: z.array(importPermissionSchema).min(1, 'يجب تحديد صلاحية واحدة على الأقل'),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    validateOnly: z.boolean().default(false)
  }).optional().default({})
});

// POST - استيراد الصلاحيات
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

    // التحقق من صلاحية استيراد الصلاحيات
    const hasPermission = await verifyPermissionFromRequest(request, 'permissions', 'create');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لاستيراد الصلاحيات' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = importDataSchema.parse(body);
    const { permissions, options } = validatedData;

    // التحقق من التكرار في البيانات المستوردة
    const permissionKeys = permissions.map(p => `${p.module}:${p.action}`);
    const uniqueKeys = new Set(permissionKeys);
    if (uniqueKeys.size !== permissionKeys.length) {
      const duplicates = permissionKeys.filter((key, index) => 
        permissionKeys.indexOf(key) !== index
      );
      return NextResponse.json({
        error: 'يوجد صلاحيات مكررة في البيانات المستوردة',
        duplicates: [...new Set(duplicates)]
      }, { status: 400 });
    }

    // التحقق من الصلاحيات الموجودة
    const existingPermissions = await prisma.permission.findMany({
      where: {
        OR: permissions.map(p => ({
          AND: [
            { module: p.module },
            { action: p.action }
          ]
        }))
      },
      select: {
        id: true,
        module: true,
        action: true,
        description: true
      }
    });

    const existingKeys = existingPermissions.map(p => `${p.module}:${p.action}`);
    const newPermissions = permissions.filter(p => 
      !existingKeys.includes(`${p.module}:${p.action}`)
    );
    const duplicatePermissions = permissions.filter(p => 
      existingKeys.includes(`${p.module}:${p.action}`)
    );

    // إذا كان التحقق فقط
    if (options.validateOnly) {
      return NextResponse.json({
        validation: {
          totalPermissions: permissions.length,
          newPermissions: newPermissions.length,
          duplicatePermissions: duplicatePermissions.length,
          valid: true
        },
        preview: {
          newPermissions: newPermissions.slice(0, 5),
          duplicatePermissions: duplicatePermissions.slice(0, 5)
        }
      });
    }

    // معالجة الصلاحيات المكررة
    if (duplicatePermissions.length > 0 && !options.skipDuplicates && !options.updateExisting) {
      return NextResponse.json({
        error: 'توجد صلاحيات مكررة',
        duplicatePermissions: duplicatePermissions.map(p => `${p.module}:${p.action}`),
        suggestion: 'استخدم skipDuplicates أو updateExisting في الخيارات'
      }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // إنشاء الصلاحيات الجديدة
      if (newPermissions.length > 0) {
        try {
          const created = await tx.permission.createMany({
            data: newPermissions.map(p => ({
              module: p.module,
              action: p.action,
              description: p.description || null
            })),
            skipDuplicates: true
          });
          createdCount = created.count;
        } catch (error) {
          errors.push(`خطأ في إنشاء الصلاحيات الجديدة: ${error}`);
        }
      }

      // تحديث الصلاحيات الموجودة إذا كان مطلوباً
      if (options.updateExisting && duplicatePermissions.length > 0) {
        for (const permission of duplicatePermissions) {
          try {
            const existing = existingPermissions.find(ep => 
              ep.module === permission.module && ep.action === permission.action
            );
            
            if (existing && permission.description !== existing.description) {
              await tx.permission.update({
                where: { id: existing.id },
                data: {
                  description: permission.description || null
                }
              });
              updatedCount++;
            }
          } catch (error) {
            errors.push(`خطأ في تحديث الصلاحية ${permission.module}:${permission.action}: ${error}`);
          }
        }
      } else if (options.skipDuplicates) {
        skippedCount = duplicatePermissions.length;
      }

      return {
        createdCount,
        updatedCount,
        skippedCount,
        errors,
        totalProcessed: createdCount + updatedCount + skippedCount
      };
    });

    // جلب الصلاحيات المنشأة حديثاً للعرض
    const recentPermissions = await prisma.permission.findMany({
      where: {
        OR: newPermissions.map(p => ({
          AND: [
            { module: p.module },
            { action: p.action }
          ]
        }))
      },
      take: 10
    });

    return NextResponse.json({
      message: `تم استيراد الصلاحيات بنجاح`,
      summary: {
        totalPermissions: permissions.length,
        created: result.createdCount,
        updated: result.updatedCount,
        skipped: result.skippedCount,
        errors: result.errors.length
      },
      details: {
        recentPermissions,
        errors: result.errors
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }

    console.error('خطأ في استيراد الصلاحيات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في استيراد الصلاحيات' },
      { status: 500 }
    );
  }
}