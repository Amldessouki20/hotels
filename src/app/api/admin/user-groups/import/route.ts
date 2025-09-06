import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthFromRequest } from '@/lib/auth';
import { checkPermissionFromRequest } from '@/lib/permissions';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema للاستيراد
const importGroupSchema = z.object({
  name: z.string().min(1, 'اسم المجموعة مطلوب'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  permissions: z.array(z.object({
    module: z.string(),
    action: z.string()
  })).optional().default([])
});

const importDataSchema = z.object({
  groups: z.array(importGroupSchema).min(1, 'يجب تحديد مجموعة واحدة على الأقل'),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    validateOnly: z.boolean().default(false),
    createMissingPermissions: z.boolean().default(false)
  }).optional().default({})
});

// POST - استيراد المجموعات
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

    // التحقق من صلاحية استيراد المجموعات
    const hasPermission = await checkPermissionFromRequest(request, 'user_groups', 'create');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لاستيراد المجموعات' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = importDataSchema.parse(body);
    const { groups, options } = validatedData;

    // التحقق من التكرار في البيانات المستوردة
    const groupNames = groups.map(g => g.name);
    const uniqueNames = new Set(groupNames);
    if (uniqueNames.size !== groupNames.length) {
      const duplicates = groupNames.filter((name, index) => 
        groupNames.indexOf(name) !== index
      );
      return NextResponse.json({
        error: 'يوجد مجموعات مكررة في البيانات المستوردة',
        duplicates: [...new Set(duplicates)]
      }, { status: 400 });
    }

    // التحقق من المجموعات الموجودة
    const existingGroups = await prisma.userGroup.findMany({
      where: {
        name: { in: groupNames }
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true
      }
    });

    const existingNames = existingGroups.map(g => g.name);
    const newGroups = groups.filter(g => !existingNames.includes(g.name));
    const duplicateGroups = groups.filter(g => existingNames.includes(g.name));

    // جمع جميع الصلاحيات المطلوبة
    const allRequiredPermissions = groups.flatMap(g => g.permissions || []);
    const uniquePermissions = allRequiredPermissions.filter(
      (permission, index, self) => 
        index === self.findIndex(p => p.module === permission.module && p.action === permission.action)
    );

    // التحقق من وجود الصلاحيات
    const existingPermissions = await prisma.permission.findMany({
      where: {
        OR: uniquePermissions.map(p => ({
          AND: [
            { module: p.module },
            { action: p.action }
          ]
        }))
      },
      select: {
        id: true,
        module: true,
        action: true
      }
    });

    const existingPermissionKeys = existingPermissions.map(p => `${p.module}:${p.action}`);
    const missingPermissions = uniquePermissions.filter(p => 
      !existingPermissionKeys.includes(`${p.module}:${p.action}`)
    );

    // إذا كان التحقق فقط
    if (options.validateOnly) {
      return NextResponse.json({
        validation: {
          totalGroups: groups.length,
          newGroups: newGroups.length,
          duplicateGroups: duplicateGroups.length,
          totalPermissions: uniquePermissions.length,
          existingPermissions: existingPermissions.length,
          missingPermissions: missingPermissions.length,
          valid: missingPermissions.length === 0 || options.createMissingPermissions
        },
        preview: {
          newGroups: newGroups.slice(0, 5),
          duplicateGroups: duplicateGroups.slice(0, 5),
          missingPermissions: missingPermissions.slice(0, 10)
        }
      });
    }

    // التحقق من الصلاحيات المفقودة
    if (missingPermissions.length > 0 && !options.createMissingPermissions) {
      return NextResponse.json({
        error: 'توجد صلاحيات مفقودة',
        missingPermissions: missingPermissions.map(p => `${p.module}:${p.action}`),
        suggestion: 'استخدم createMissingPermissions في الخيارات أو أنشئ الصلاحيات أولاً'
      }, { status: 400 });
    }

    // معالجة المجموعات المكررة
    if (duplicateGroups.length > 0 && !options.skipDuplicates && !options.updateExisting) {
      return NextResponse.json({
        error: 'توجد مجموعات مكررة',
        duplicateGroups: duplicateGroups.map(g => g.name),
        suggestion: 'استخدم skipDuplicates أو updateExisting في الخيارات'
      }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let createdGroupsCount = 0;
      let updatedGroupsCount = 0;
      let skippedGroupsCount = 0;
      let createdPermissionsCount = 0;
      const errors: string[] = [];
      const createdGroupIds: string[] = [];

      // إنشاء الصلاحيات المفقودة إذا كان مطلوباً
      if (options.createMissingPermissions && missingPermissions.length > 0) {
        try {
          const created = await tx.permission.createMany({
            data: missingPermissions.map(p => ({
              module: p.module,
              action: p.action,
              description: `تم إنشاؤها تلقائياً أثناء الاستيراد`
            })),
            skipDuplicates: true
          });
          createdPermissionsCount = created.count;
        } catch (error) {
          errors.push(`خطأ في إنشاء الصلاحيات المفقودة: ${error}`);
        }
      }

      // إعادة جلب الصلاحيات بعد الإنشاء
      const allPermissions = await tx.permission.findMany({
        where: {
          OR: uniquePermissions.map(p => ({
            AND: [
              { module: p.module },
              { action: p.action }
            ]
          }))
        },
        select: {
          id: true,
          module: true,
          action: true
        }
      });

      // إنشاء المجموعات الجديدة
      for (const group of newGroups) {
        try {
          const createdGroup = await tx.userGroup.create({
            data: {
              name: group.name,
              description: group.description || null,
              isActive: group.isActive
            }
          });

          createdGroupIds.push(createdGroup.id);

          // إضافة الصلاحيات للمجموعة
          if (group.permissions && group.permissions.length > 0) {
            const groupPermissions = group.permissions
              .map(gp => {
                const permission = allPermissions.find(p => 
                  p.module === gp.module && p.action === gp.action
                );
                return permission ? {
                  groupId: createdGroup.id,
                  permissionId: permission.id
                } : null;
              })
              .filter(Boolean) as { groupId: string; permissionId: string }[];

            if (groupPermissions.length > 0) {
              await tx.groupPermission.createMany({
                data: groupPermissions,
                skipDuplicates: true
              });
            }
          }

          createdGroupsCount++;
        } catch (error) {
          errors.push(`خطأ في إنشاء المجموعة ${group.name}: ${error}`);
        }
      }

      // تحديث المجموعات الموجودة إذا كان مطلوباً
      if (options.updateExisting && duplicateGroups.length > 0) {
        for (const group of duplicateGroups) {
          try {
            const existing = existingGroups.find(eg => eg.name === group.name);
            if (!existing) continue;

            // تحديث بيانات المجموعة
            await tx.userGroup.update({
              where: { id: existing.id },
              data: {
                description: group.description || existing.description,
                isActive: group.isActive
              }
            });

            // تحديث الصلاحيات إذا كانت محددة
            if (group.permissions && group.permissions.length > 0) {
              // حذف الصلاحيات الحالية
              await tx.groupPermission.deleteMany({
                where: { groupId: existing.id }
              });

              // إضافة الصلاحيات الجديدة
              const groupPermissions = group.permissions
                .map(gp => {
                  const permission = allPermissions.find(p => 
                    p.module === gp.module && p.action === gp.action
                  );
                  return permission ? {
                    groupId: existing.id,
                    permissionId: permission.id
                  } : null;
                })
                .filter(Boolean) as { groupId: string; permissionId: string }[];

              if (groupPermissions.length > 0) {
                await tx.groupPermission.createMany({
                  data: groupPermissions,
                  skipDuplicates: true
                });
              }
            }

            updatedGroupsCount++;
          } catch (error) {
            errors.push(`خطأ في تحديث المجموعة ${group.name}: ${error}`);
          }
        }
      } else if (options.skipDuplicates) {
        skippedGroupsCount = duplicateGroups.length;
      }

      return {
        createdGroupsCount,
        updatedGroupsCount,
        skippedGroupsCount,
        createdPermissionsCount,
        createdGroupIds,
        errors,
        totalProcessed: createdGroupsCount + updatedGroupsCount + skippedGroupsCount
      };
    });

    // جلب المجموعات المنشأة حديثاً للعرض
    const recentGroups = result.createdGroupIds.length > 0 ? 
      await prisma.userGroup.findMany({
        where: {
          id: { in: result.createdGroupIds }
        },
        include: {
          _count: {
            select: {
              groupPermissions: true,
              users: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }) : [];

    return NextResponse.json({
      message: `تم استيراد المجموعات بنجاح`,
      summary: {
        totalGroups: groups.length,
        createdGroups: result.createdGroupsCount,
        updatedGroups: result.updatedGroupsCount,
        skippedGroups: result.skippedGroupsCount,
        createdPermissions: result.createdPermissionsCount,
        errors: result.errors.length
      },
      details: {
        recentGroups,
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

    console.error('خطأ في استيراد المجموعات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في استيراد المجموعات' },
      { status: 500 }
    );
  }
}