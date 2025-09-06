import { AuthUser, verifyAuthFromRequest, verifyAuthToken } from './auth';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

// تعريف أنواع الصلاحيات
export interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string | null;
}

export interface UserPermission {
  permission: Permission;
  isAllowed: boolean;
  source: 'group' | 'user';
}

// تعريف الوحدات والعمليات الأساسية
export const MODULES = {
  USERS: 'users',
  GROUPS: 'groups',
  PERMISSIONS: 'permissions',
  HOTELS: 'hotels',
  ROOMS: 'rooms',
  BOOKINGS: 'bookings',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  AUDIT: 'audit'
} as const;

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  EXPORT: 'export',
  IMPORT: 'import'
} as const;

// دوال مساعدة لبناء مفاتيح الصلاحيات
export function buildPermissionKey(module: string, action: string): string {
  return `${module}:${action}`;
}

export function parsePermissionKey(permissionKey: string): { module: string; action: string } {
  const [module, action] = permissionKey.split(':');
  return { module, action };
}

/**
 * جلب جميع صلاحيات المستخدم (من المجموعة والصلاحيات الفردية)
 */
export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  try {
    // جلب المستخدم مع مجموعته
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        group: {
          include: {
            groupPermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        userPermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      return [];
    }

    const permissions: UserPermission[] = [];
    const permissionMap = new Map<string, UserPermission>();

    // إضافة صلاحيات المجموعة
    user.group?.groupPermissions.forEach(gp => {
      const key = buildPermissionKey(gp.permission.module, gp.permission.action);
      permissionMap.set(key, {
        permission: gp.permission,
        isAllowed: gp.isAllowed,
        source: 'group'
      });
    });

    // إضافة الصلاحيات الفردية (تتفوق على صلاحيات المجموعة)
    user.userPermissions.forEach(up => {
      const key = buildPermissionKey(up.permission.module, up.permission.action);
      permissionMap.set(key, {
        permission: up.permission,
        isAllowed: up.isAllowed,
        source: 'user'
      });
    });

    return Array.from(permissionMap.values());
  } catch (error) {
    console.error('خطأ في جلب صلاحيات المستخدم:', error);
    return [];
  }
}

/**
 * التحقق من صلاحية محددة للمستخدم
 */
export async function hasPermission(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    const requiredKey = buildPermissionKey(module, action);
    
    const permission = permissions.find(p => 
      buildPermissionKey(p.permission.module, p.permission.action) === requiredKey
    );

    return permission ? permission.isAllowed : false;
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحية:', error);
    return false;
  }
}

/**
 * التحقق من صلاحية محددة للمستخدم باستخدام مفتاح الصلاحية
 */
export async function hasPermissionByKey(
  userId: string,
  permissionKey: string
): Promise<boolean> {
  const { module, action } = parsePermissionKey(permissionKey);
  return hasPermission(userId, module, action);
}

/**
 * التحقق من صلاحيات متعددة للمستخدم
 */
export async function hasAnyPermission(
  userId: string,
  permissionKeys: string[]
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    
    return permissionKeys.some(key => {
      const permission = permissions.find(p => 
        buildPermissionKey(p.permission.module, p.permission.action) === key
      );
      return permission ? permission.isAllowed : false;
    });
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحيات المتعددة:', error);
    return false;
  }
}

/**
 * التحقق من جميع الصلاحيات المطلوبة للمستخدم
 */
export async function hasAllPermissions(
  userId: string,
  permissionKeys: string[]
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    
    return permissionKeys.every(key => {
      const permission = permissions.find(p => 
        buildPermissionKey(p.permission.module, p.permission.action) === key
      );
      return permission ? permission.isAllowed : false;
    });
  } catch (error) {
    console.error('خطأ في التحقق من جميع الصلاحيات:', error);
    return false;
  }
}

/**
 * التحقق من صلاحية الإدارة العامة (manage) لوحدة معينة
 */
export async function canManageModule(
  userId: string,
  module: string
): Promise<boolean> {
  return hasPermission(userId, module, ACTIONS.MANAGE);
}

/**
 * جلب المستخدم من الطلب والتحقق من صلاحيته
 */
export async function verifyPermissionFromRequest(
  request: NextRequest,
  module: string,
  action: string
): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
  try {
    // استخراج التوكن من الكوكيز
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return {
        success: false,
        message: 'لم يتم العثور على رمز المصادقة'
      };
    }

    // التحقق من صحة التوكن
    const user = await verifyAuthToken(token);
    if (!user) {
      return {
        success: false,
        message: 'رمز المصادقة غير صالح أو منتهي الصلاحية'
      };
    }

    // التحقق من الصلاحية
    const hasRequiredPermission = await hasPermission(user.id, module, action);
    if (!hasRequiredPermission) {
      return {
        success: false,
        user,
        message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء'
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحية من الطلب:', error);
    return {
      success: false,
      message: 'حدث خطأ في التحقق من الصلاحية'
    };
  }
}

/**
 * التحقق من صلاحية باستخدام مفتاح الصلاحية من الطلب
 */
export async function verifyPermissionByKeyFromRequest(
  request: NextRequest,
  permissionKey: string
): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
  const { module, action } = parsePermissionKey(permissionKey);
  return verifyPermissionFromRequest(request, module, action);
}

/**
 * إنشاء middleware للتحقق من الصلاحيات
 */
export function createPermissionMiddleware(
  module: string,
  action: string
) {
  return async (request: NextRequest) => {
    return verifyPermissionFromRequest(request, module, action);
  };
}

/**
 * إنشاء middleware للتحقق من صلاحيات متعددة (أي واحدة منها)
 */
export function createAnyPermissionMiddleware(
  permissionKeys: string[]
) {
  return async (request: NextRequest) => {
    try {
      // استخراج التوكن من الكوكيز
      const token = request.cookies.get('token')?.value;
      
      if (!token) {
        return {
          success: false,
          message: 'لم يتم العثور على رمز المصادقة'
        };
      }

      // التحقق من صحة التوكن
      const user = await verifyAuthToken(token);
      if (!user) {
        return {
          success: false,
          message: 'رمز المصادقة غير صالح أو منتهي الصلاحية'
        };
      }

      // التحقق من الصلاحيات
      const hasRequiredPermission = await hasAnyPermission(user.id, permissionKeys);
      if (!hasRequiredPermission) {
        return {
          success: false,
          user,
          message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء'
        };
      }

      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('خطأ في التحقق من الصلاحيات المتعددة:', error);
      return {
        success: false,
        message: 'حدث خطأ في التحقق من الصلاحية'
      };
    }
  };
}

/**
 * دوال مساعدة للصلاحيات الشائعة
 */
export const PermissionHelpers = {
  // صلاحيات المستخدمين
  canCreateUsers: (userId: string) => hasPermission(userId, MODULES.USERS, ACTIONS.CREATE),
  canReadUsers: (userId: string) => hasPermission(userId, MODULES.USERS, ACTIONS.READ),
  canUpdateUsers: (userId: string) => hasPermission(userId, MODULES.USERS, ACTIONS.UPDATE),
  canDeleteUsers: (userId: string) => hasPermission(userId, MODULES.USERS, ACTIONS.DELETE),
  canManageUsers: (userId: string) => hasPermission(userId, MODULES.USERS, ACTIONS.MANAGE),

  // صلاحيات المجموعات
  canCreateGroups: (userId: string) => hasPermission(userId, MODULES.GROUPS, ACTIONS.CREATE),
  canReadGroups: (userId: string) => hasPermission(userId, MODULES.GROUPS, ACTIONS.READ),
  canUpdateGroups: (userId: string) => hasPermission(userId, MODULES.GROUPS, ACTIONS.UPDATE),
  canDeleteGroups: (userId: string) => hasPermission(userId, MODULES.GROUPS, ACTIONS.DELETE),
  canManageGroups: (userId: string) => hasPermission(userId, MODULES.GROUPS, ACTIONS.MANAGE),

  // صلاحيات الفنادق
  canCreateHotels: (userId: string) => hasPermission(userId, MODULES.HOTELS, ACTIONS.CREATE),
  canReadHotels: (userId: string) => hasPermission(userId, MODULES.HOTELS, ACTIONS.READ),
  canUpdateHotels: (userId: string) => hasPermission(userId, MODULES.HOTELS, ACTIONS.UPDATE),
  canDeleteHotels: (userId: string) => hasPermission(userId, MODULES.HOTELS, ACTIONS.DELETE),
  canManageHotels: (userId: string) => hasPermission(userId, MODULES.HOTELS, ACTIONS.MANAGE),

  // صلاحيات الغرف
  canCreateRooms: (userId: string) => hasPermission(userId, MODULES.ROOMS, ACTIONS.CREATE),
  canReadRooms: (userId: string) => hasPermission(userId, MODULES.ROOMS, ACTIONS.READ),
  canUpdateRooms: (userId: string) => hasPermission(userId, MODULES.ROOMS, ACTIONS.UPDATE),
  canDeleteRooms: (userId: string) => hasPermission(userId, MODULES.ROOMS, ACTIONS.DELETE),
  canManageRooms: (userId: string) => hasPermission(userId, MODULES.ROOMS, ACTIONS.MANAGE),

  // صلاحيات الحجوزات
  canCreateBookings: (userId: string) => hasPermission(userId, MODULES.BOOKINGS, ACTIONS.CREATE),
  canReadBookings: (userId: string) => hasPermission(userId, MODULES.BOOKINGS, ACTIONS.READ),
  canUpdateBookings: (userId: string) => hasPermission(userId, MODULES.BOOKINGS, ACTIONS.UPDATE),
  canDeleteBookings: (userId: string) => hasPermission(userId, MODULES.BOOKINGS, ACTIONS.DELETE),
  canManageBookings: (userId: string) => hasPermission(userId, MODULES.BOOKINGS, ACTIONS.MANAGE),

  // صلاحيات التقارير
  canReadReports: (userId: string) => hasPermission(userId, MODULES.REPORTS, ACTIONS.READ),
  canExportReports: (userId: string) => hasPermission(userId, MODULES.REPORTS, ACTIONS.EXPORT),
  canManageReports: (userId: string) => hasPermission(userId, MODULES.REPORTS, ACTIONS.MANAGE),

  // صلاحيات الإعدادات
  canReadSettings: (userId: string) => hasPermission(userId, MODULES.SETTINGS, ACTIONS.READ),
  canUpdateSettings: (userId: string) => hasPermission(userId, MODULES.SETTINGS, ACTIONS.UPDATE),
  canManageSettings: (userId: string) => hasPermission(userId, MODULES.SETTINGS, ACTIONS.MANAGE),

  // صلاحيات سجل التدقيق
  canReadAudit: (userId: string) => hasPermission(userId, MODULES.AUDIT, ACTIONS.READ),
  canManageAudit: (userId: string) => hasPermission(userId, MODULES.AUDIT, ACTIONS.MANAGE)
};

/**
 * تصدير الثوابت المفيدة
 */
export const COMMON_PERMISSIONS = {
  // صلاحيات المستخدمين
  USERS_CREATE: buildPermissionKey(MODULES.USERS, ACTIONS.CREATE),
  USERS_READ: buildPermissionKey(MODULES.USERS, ACTIONS.READ),
  USERS_UPDATE: buildPermissionKey(MODULES.USERS, ACTIONS.UPDATE),
  USERS_DELETE: buildPermissionKey(MODULES.USERS, ACTIONS.DELETE),
  USERS_MANAGE: buildPermissionKey(MODULES.USERS, ACTIONS.MANAGE),

  // صلاحيات المجموعات
  GROUPS_CREATE: buildPermissionKey(MODULES.GROUPS, ACTIONS.CREATE),
  GROUPS_READ: buildPermissionKey(MODULES.GROUPS, ACTIONS.READ),
  GROUPS_UPDATE: buildPermissionKey(MODULES.GROUPS, ACTIONS.UPDATE),
  GROUPS_DELETE: buildPermissionKey(MODULES.GROUPS, ACTIONS.DELETE),
  GROUPS_MANAGE: buildPermissionKey(MODULES.GROUPS, ACTIONS.MANAGE),

  // صلاحيات الفنادق
  HOTELS_CREATE: buildPermissionKey(MODULES.HOTELS, ACTIONS.CREATE),
  HOTELS_READ: buildPermissionKey(MODULES.HOTELS, ACTIONS.READ),
  HOTELS_UPDATE: buildPermissionKey(MODULES.HOTELS, ACTIONS.UPDATE),
  HOTELS_DELETE: buildPermissionKey(MODULES.HOTELS, ACTIONS.DELETE),
  HOTELS_MANAGE: buildPermissionKey(MODULES.HOTELS, ACTIONS.MANAGE),

  // صلاحيات الغرف
  ROOMS_CREATE: buildPermissionKey(MODULES.ROOMS, ACTIONS.CREATE),
  ROOMS_READ: buildPermissionKey(MODULES.ROOMS, ACTIONS.READ),
  ROOMS_UPDATE: buildPermissionKey(MODULES.ROOMS, ACTIONS.UPDATE),
  ROOMS_DELETE: buildPermissionKey(MODULES.ROOMS, ACTIONS.DELETE),
  ROOMS_MANAGE: buildPermissionKey(MODULES.ROOMS, ACTIONS.MANAGE),

  // صلاحيات الحجوزات
  BOOKINGS_CREATE: buildPermissionKey(MODULES.BOOKINGS, ACTIONS.CREATE),
  BOOKINGS_READ: buildPermissionKey(MODULES.BOOKINGS, ACTIONS.READ),
  BOOKINGS_UPDATE: buildPermissionKey(MODULES.BOOKINGS, ACTIONS.UPDATE),
  BOOKINGS_DELETE: buildPermissionKey(MODULES.BOOKINGS, ACTIONS.DELETE),
  BOOKINGS_MANAGE: buildPermissionKey(MODULES.BOOKINGS, ACTIONS.MANAGE),

  // صلاحيات التقارير
  REPORTS_READ: buildPermissionKey(MODULES.REPORTS, ACTIONS.READ),
  REPORTS_EXPORT: buildPermissionKey(MODULES.REPORTS, ACTIONS.EXPORT),
  REPORTS_MANAGE: buildPermissionKey(MODULES.REPORTS, ACTIONS.MANAGE),

  // صلاحيات الإعدادات
  SETTINGS_READ: buildPermissionKey(MODULES.SETTINGS, ACTIONS.READ),
  SETTINGS_UPDATE: buildPermissionKey(MODULES.SETTINGS, ACTIONS.UPDATE),
  SETTINGS_MANAGE: buildPermissionKey(MODULES.SETTINGS, ACTIONS.MANAGE),

  // صلاحيات سجل التدقيق
  AUDIT_READ: buildPermissionKey(MODULES.AUDIT, ACTIONS.READ),
  AUDIT_MANAGE: buildPermissionKey(MODULES.AUDIT, ACTIONS.MANAGE)
};

/**
 * Check permission from request
 */
export async function checkPermissionFromRequest(
  request: NextRequest,
  module: string,
  action: string
): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
  try {
    const user = await verifyAuthFromRequest(request);
    if (!user) {
      return {
        success: false,
        message: 'Authentication required'
      };
    }

    const hasAccess = await hasPermission(user.id, module, action);
    if (!hasAccess) {
      return {
        success: false,
        user,
        message: 'Insufficient permissions'
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Permission check error:', error);
    return {
      success: false,
      message: 'Permission check failed'
    };
  }
}