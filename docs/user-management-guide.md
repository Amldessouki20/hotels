# دليل إدارة المستخدمين والصلاحيات
# User Management and Permissions Guide

## نظرة عامة على النظام
### System Overview

يعتمد نظام إدارة الفنادق على نظام صلاحيات متقدم يتكون من:
- **مجموعات المستخدمين (User Groups)**: تصنيفات أساسية للمستخدمين
- **الصلاحيات (Permissions)**: أذونات محددة لكل عملية في النظام
- **صلاحيات المجموعات (Group Permissions)**: ربط الصلاحيات بالمجموعات
- **صلاحيات المستخدمين (User Permissions)**: صلاحيات إضافية خاصة بمستخدم معين

---

## 1. مجموعات المستخدمين الافتراضية
### Default User Groups

### 🔴 مديرو النظام (System Administrators)
**المسؤوليات:**
- إدارة كامل النظام
- إضافة وحذف المستخدمين
- إدارة الصلاحيات
- إعداد النظام والتكوينات
- مراقبة الأداء والتقارير الشاملة

**الصلاحيات الكاملة:**
- جميع عمليات النظام (CRUD)
- إدارة المستخدمين والمجموعات
- الوصول لجميع التقارير
- إعدادات النظام

---

### 🟠 مديرو الفنادق (Hotel Managers)
**المسؤوليات:**
- إدارة فندق واحد أو أكثر
- إدارة الغرف والأسعار
- مراجعة الحجوزات والتقارير
- إدارة فريق العمل في الفندق

**الصلاحيات:**
- إنشاء وتعديل بيانات الفندق المخصص له
- إدارة الغرف (إضافة، تعديل، عرض)
- عرض وتعديل الحجوزات
- إدارة النزلاء
- عرض تقارير الفندق
- إدارة المدفوعات

---

### 🟡 موظفو الاستقبال (Receptionists)
**المسؤوليات:**
- إدارة الحجوزات اليومية
- تسجيل وصول ومغادرة النزلاء
- إدارة بيانات النزلاء
- التعامل مع الاستفسارات

**الصلاحيات:**
- إنشاء وتعديل الحجوزات
- إدارة النزلاء (إضافة، تعديل، عرض)
- عرض بيانات الغرف
- تسجيل المدفوعات الأساسية
- عرض التقارير الأساسية

---

### 🟢 المحاسبون (Accountants)
**المسؤوليات:**
- إدارة المدفوعات والفواتير
- مراجعة التقارير المالية
- متابعة المستحقات
- إدارة الحسابات المالية

**الصلاحيات:**
- إدارة كاملة للمدفوعات
- عرض جميع التقارير المالية
- عرض الحجوزات والنزلاء
- إدارة القائمة السوداء للنزلاء

---

### 🔵 المشاهدون (Viewers)
**المسؤوليات:**
- مراجعة البيانات فقط
- إعداد التقارير
- المراقبة والمتابعة

**الصلاحيات:**
- عرض البيانات فقط (بدون تعديل)
- عرض التقارير الأساسية

---

## 2. كيفية إضافة مستخدم جديد
### How to Add New User

### خطوات إضافة مستخدم من واجهة الإدارة:

#### الخطوة 1: الوصول لصفحة إدارة المستخدمين
```
لوحة التحكم → إدارة النظام → المستخدمين → إضافة مستخدم جديد
Dashboard → System Management → Users → Add New User
```

#### الخطوة 2: ملء البيانات الأساسية
```typescript
// نموذج إضافة مستخدم
interface NewUserForm {
  fullName: string;        // الاسم الكامل
  email: string;           // البريد الإلكتروني (فريد)
  phone: string;           // رقم الهاتف
  groupId: string;         // مجموعة المستخدم
  temporaryPassword: string; // كلمة مرور مؤقتة
  mustChangePassword: boolean; // إجبار تغيير كلمة المرور
  isActive: boolean;       // حالة النشاط
}
```

#### الخطوة 3: اختيار مجموعة المستخدم
- **مدير نظام**: للمديرين العامين
- **مدير فندق**: لمديري الفنادق
- **موظف استقبال**: لموظفي الاستقبال
- **محاسب**: للمحاسبين
- **مشاهد**: للمراجعين

#### الخطوة 4: تخصيص الصلاحيات الإضافية (اختياري)
يمكن إضافة صلاحيات خاصة للمستخدم بالإضافة لصلاحيات مجموعته:

```typescript
// مثال: إعطاء مدير فندق صلاحية حذف الحجوزات
const additionalPermissions = [
  'booking:delete',    // حذف الحجوزات
  'guest:manage_vip',  // إدارة نزلاء VIP
  'payment:refund'     // استرداد المدفوعات
];
```

---

## 3. إدارة الصلاحيات
### Permission Management

### أنواع الصلاحيات في النظام:

#### صلاحيات النظام (System Permissions)
```typescript
const systemPermissions = [
  'system:manage_users',      // إدارة المستخدمين
  'system:manage_groups',     // إدارة المجموعات
  'system:manage_permissions', // إدارة الصلاحيات
  'system:view_audit_logs',   // عرض سجلات التدقيق
  'system:manage_settings'    // إدارة إعدادات النظام
];
```

#### صلاحيات الفنادق (Hotel Permissions)
```typescript
const hotelPermissions = [
  'hotel:create',    // إنشاء فندق
  'hotel:read',      // عرض الفنادق
  'hotel:update',    // تعديل الفندق
  'hotel:delete',    // حذف الفندق
  'hotel:manage'     // إدارة كاملة
];
```

#### صلاحيات الغرف (Room Permissions)
```typescript
const roomPermissions = [
  'room:create',     // إنشاء غرفة
  'room:read',       // عرض الغرف
  'room:update',     // تعديل الغرفة
  'room:delete',     // حذف الغرفة
  'room:manage_pricing' // إدارة الأسعار
];
```

#### صلاحيات الحجوزات (Booking Permissions)
```typescript
const bookingPermissions = [
  'booking:create',    // إنشاء حجز
  'booking:read',      // عرض الحجوزات
  'booking:update',    // تعديل الحجز
  'booking:delete',    // حذف الحجز
  'booking:checkin',   // تسجيل الوصول
  'booking:checkout'   // تسجيل المغادرة
];
```

#### صلاحيات النزلاء (Guest Permissions)
```typescript
const guestPermissions = [
  'guest:create',        // إنشاء نزيل
  'guest:read',          // عرض النزلاء
  'guest:update',        // تعديل النزيل
  'guest:delete',        // حذف النزيل
  'guest:manage_vip',    // إدارة VIP
  'guest:manage_blacklist' // إدارة القائمة السوداء
];
```

#### صلاحيات المدفوعات (Payment Permissions)
```typescript
const paymentPermissions = [
  'payment:create',    // إنشاء دفعة
  'payment:read',      // عرض المدفوعات
  'payment:update',    // تعديل الدفعة
  'payment:delete',    // حذف الدفعة
  'payment:refund',    // استرداد
  'payment:approve'    // موافقة على الدفع
];
```

#### صلاحيات التقارير (Report Permissions)
```typescript
const reportPermissions = [
  'report:view_basic',     // عرض التقارير الأساسية
  'report:view_financial', // عرض التقارير المالية
  'report:view_detailed',  // عرض التقارير المفصلة
  'report:export',         // تصدير التقارير
  'report:create_custom'   // إنشاء تقارير مخصصة
];
```

---

## 4. سيناريوهات عملية لإدارة المستخدمين
### Practical User Management Scenarios

### السيناريو 1: إضافة مدير فندق جديد
```typescript
// 1. إنشاء المستخدم
const newHotelManager = {
  fullName: "أحمد محمد السعيد",
  email: "ahmed.manager@hotel.com",
  phone: "+966501234567",
  groupId: "hotel-manager-001", // مجموعة مديري الفنادق
  temporaryPassword: "TempPass123!",
  mustChangePassword: true,
  isActive: true
};

// 2. ربط المدير بفندق معين
const hotelAssignment = {
  hotelId: "hotel-001",
  userId: newHotelManager.id,
  isActive: true
};

// 3. إضافة صلاحيات خاصة (اختياري)
const additionalPermissions = [
  "booking:delete",     // حذف الحجوزات
  "guest:manage_vip"    // إدارة نزلاء VIP
];
```

### السيناريو 2: إضافة موظف استقبال
```typescript
const newReceptionist = {
  fullName: "فاطمة أحمد الزهراني",
  email: "fatima.reception@hotel.com",
  phone: "+966502345678",
  groupId: "receptionist-001", // مجموعة موظفي الاستقبال
  temporaryPassword: "Reception123!",
  mustChangePassword: true,
  isActive: true
};

// موظفو الاستقبال يحصلون على صلاحيات مجموعتهم فقط
// لا حاجة لصلاحيات إضافية عادة
```

### السيناريو 3: إضافة محاسب مع صلاحيات خاصة
```typescript
const newAccountant = {
  fullName: "عبدالله سالم المطيري",
  email: "abdullah.accounting@hotel.com",
  phone: "+966503456789",
  groupId: "accountant-001", // مجموعة المحاسبين
  temporaryPassword: "Account123!",
  mustChangePassword: true,
  isActive: true
};

// صلاحيات إضافية للمحاسب الرئيسي
const additionalPermissions = [
  "guest:manage_blacklist", // إدارة القائمة السوداء
  "payment:refund",         // استرداد المدفوعات
  "report:export"           // تصدير التقارير
];
```

---

## 5. واجهة إدارة المستخدمين
### User Management Interface

### صفحة قائمة المستخدمين
```typescript
// مكونات الواجهة الرئيسية
interface UserListPage {
  searchFilters: {
    name: string;
    email: string;
    group: string;
    isActive: boolean;
  };
  
  userActions: {
    view: (userId: string) => void;
    edit: (userId: string) => void;
    deactivate: (userId: string) => void;
    resetPassword: (userId: string) => void;
    managePermissions: (userId: string) => void;
  };
  
  bulkActions: {
    activateSelected: (userIds: string[]) => void;
    deactivateSelected: (userIds: string[]) => void;
    exportSelected: (userIds: string[]) => void;
  };
}
```

### نموذج تعديل المستخدم
```typescript
interface EditUserForm {
  basicInfo: {
    fullName: string;
    email: string;
    phone: string;
    isActive: boolean;
  };
  
  groupAndPermissions: {
    groupId: string;
    additionalPermissions: string[];
    removedPermissions: string[];
  };
  
  securitySettings: {
    mustChangePassword: boolean;
    accountLocked: boolean;
    sessionTimeout: number;
  };
}
```

### صفحة إدارة الصلاحيات
```typescript
interface PermissionManagementPage {
  userPermissions: {
    inherited: Permission[];    // من المجموعة
    additional: Permission[];   // إضافية
    removed: Permission[];      // محذوفة
  };
  
  permissionCategories: {
    system: Permission[];
    hotel: Permission[];
    room: Permission[];
    booking: Permission[];
    guest: Permission[];
    payment: Permission[];
    report: Permission[];
  };
}
```

---

## 6. أمثلة على كود إدارة المستخدمين
### User Management Code Examples

### API لإنشاء مستخدم جديد
```typescript
// /api/admin/users/create
export async function POST(request: Request) {
  try {
    const userData = await request.json();
    
    // 1. التحقق من الصلاحيات
    const currentUser = await getCurrentUser();
    if (!hasPermission(currentUser, 'system:manage_users')) {
      return NextResponse.json(
        { error: 'غير مصرح لك بإضافة مستخدمين' },
        { status: 403 }
      );
    }
    
    // 2. التحقق من البيانات
    const validation = validateUserData(userData);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors },
        { status: 400 }
      );
    }
    
    // 3. التحقق من عدم تكرار البريد الإلكتروني
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      );
    }
    
    // 4. تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(userData.temporaryPassword, 10);
    
    // 5. إنشاء المستخدم
    const newUser = await prisma.user.create({
      data: {
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        hashedPassword,
        groupId: userData.groupId,
        mustChangePassword: true,
        isActive: userData.isActive,
        createdById: currentUser.id
      }
    });
    
    // 6. إضافة الصلاحيات الإضافية
    if (userData.additionalPermissions?.length > 0) {
      await addUserPermissions(newUser.id, userData.additionalPermissions);
    }
    
    // 7. تسجيل في سجل التدقيق
    await logAuditAction({
      tableName: 'User',
      recordId: newUser.id,
      action: 'CREATE',
      userId: currentUser.id,
      details: `تم إنشاء مستخدم جديد: ${newUser.fullName}`
    });
    
    // 8. إرسال بريد إلكتروني بكلمة المرور المؤقتة
    await sendWelcomeEmail(newUser.email, userData.temporaryPassword);
    
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        groupId: newUser.groupId
      }
    });
    
  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المستخدم' },
      { status: 500 }
    );
  }
}
```

### دالة التحقق من الصلاحيات
```typescript
// utils/permissions.ts
export async function hasPermission(
  user: User,
  requiredPermission: string
): Promise<boolean> {
  try {
    // 1. الحصول على صلاحيات المجموعة
    const groupPermissions = await prisma.groupPermission.findMany({
      where: { groupId: user.groupId },
      include: { permission: true }
    });
    
    // 2. الحصول على الصلاحيات الإضافية للمستخدم
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId: user.id },
      include: { permission: true }
    });
    
    // 3. دمج جميع الصلاحيات
    const allPermissions = [
      ...groupPermissions.map(gp => gp.permission),
      ...userPermissions.map(up => up.permission)
    ];
    
    // 4. البحث عن الصلاحية المطلوبة
    return allPermissions.some(permission => {
      const permissionKey = `${permission.module}:${permission.action}`;
      return permissionKey === requiredPermission;
    });
    
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحيات:', error);
    return false;
  }
}
```

### مكون واجهة إضافة مستخدم
```typescript
// components/admin/AddUserForm.tsx
export default function AddUserForm() {
  const [formData, setFormData] = useState<NewUserForm>({
    fullName: '',
    email: '',
    phone: '',
    groupId: '',
    temporaryPassword: '',
    mustChangePassword: true,
    isActive: true
  });
  
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  useEffect(() => {
    loadUserGroups();
    loadAvailablePermissions();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          additionalPermissions: selectedPermissions
        })
      });
      
      if (response.ok) {
        toast.success('تم إنشاء المستخدم بنجاح');
        router.push('/admin/users');
      } else {
        const error = await response.json();
        toast.error(error.message || 'حدث خطأ في إنشاء المستخدم');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* البيانات الأساسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="الاسم الكامل"
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          required
        />
        
        <Input
          label="البريد الإلكتروني"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        
        <Input
          label="رقم الهاتف"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          required
        />
        
        <Select
          label="مجموعة المستخدم"
          value={formData.groupId}
          onChange={(value) => setFormData({...formData, groupId: value})}
          required
        >
          {userGroups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
      </div>
      
      {/* الصلاحيات الإضافية */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">الصلاحيات الإضافية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePermissions.map(permission => (
            <label key={permission.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedPermissions.includes(permission.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPermissions([...selectedPermissions, permission.id]);
                  } else {
                    setSelectedPermissions(
                      selectedPermissions.filter(id => id !== permission.id)
                    );
                  }
                }}
              />
              <span>{permission.name}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* أزرار الإجراءات */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          إلغاء
        </Button>
        <Button type="submit" variant="primary">
          إنشاء المستخدم
        </Button>
      </div>
    </form>
  );
}
```

---

## 7. الأمان والحماية
### Security and Protection

### حماية كلمات المرور
```typescript
// تشفير كلمة المرور
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// التحقق من كلمة المرور
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// إنشاء كلمة مرور قوية
const generateStrongPassword = (): string => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};
```

### حماية الجلسات
```typescript
// إدارة الجلسات
interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  isActive: boolean;
}

// إنشاء جلسة جديدة
const createSession = async (userId: string, ipAddress: string, userAgent: string) => {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة
  
  return await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      ipAddress,
      userAgent,
      expiresAt,
      isActive: true
    }
  });
};

// التحقق من صحة الجلسة
const validateSession = async (sessionToken: string): Promise<User | null> => {
  const session = await prisma.userSession.findUnique({
    where: { sessionToken },
    include: { user: true }
  });
  
  if (!session || !session.isActive || session.expiresAt < new Date()) {
    return null;
  }
  
  // تحديث آخر نشاط
  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastActivity: new Date() }
  });
  
  return session.user;
};
```

### تسجيل محاولات تسجيل الدخول
```typescript
// تسجيل محاولة تسجيل الدخول
const logLoginAttempt = async (
  email: string,
  ipAddress: string,
  userAgent: string,
  isSuccessful: boolean,
  failureReason?: string
) => {
  await prisma.loginAttempt.create({
    data: {
      email,
      ipAddress,
      userAgent,
      isSuccessful,
      failureReason,
      attemptAt: new Date()
    }
  });
};

// التحقق من محاولات تسجيل الدخول المتكررة
const checkBruteForce = async (email: string, ipAddress: string): Promise<boolean> => {
  const lastHour = new Date(Date.now() - 60 * 60 * 1000);
  
  const failedAttempts = await prisma.loginAttempt.count({
    where: {
      OR: [
        { email },
        { ipAddress }
      ],
      isSuccessful: false,
      attemptAt: { gte: lastHour }
    }
  });
  
  return failedAttempts >= 5; // حد أقصى 5 محاولات فاشلة في الساعة
};
```

---

## 8. التقارير والمراقبة
### Reports and Monitoring

### تقرير نشاط المستخدمين
```typescript
// تقرير تسجيل الدخول
const getUserLoginReport = async (startDate: Date, endDate: Date) => {
  return await prisma.loginAttempt.groupBy({
    by: ['email', 'isSuccessful'],
    where: {
      attemptAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    }
  });
};

// تقرير المستخدمين النشطين
const getActiveUsersReport = async () => {
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return await prisma.userSession.groupBy({
    by: ['userId'],
    where: {
      lastActivity: { gte: lastMonth },
      isActive: true
    },
    _count: {
      id: true
    },
    _max: {
      lastActivity: true
    }
  });
};

// تقرير استخدام الصلاحيات
const getPermissionUsageReport = async () => {
  return await prisma.auditLog.groupBy({
    by: ['action', 'tableName'],
    where: {
      timestamp: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // آخر أسبوع
      }
    },
    _count: {
      id: true
    }
  });
};
```

---

## 9. الصيانة والتحديث
### Maintenance and Updates

### تنظيف الجلسات المنتهية الصلاحية
```typescript
// مهمة دورية لتنظيف الجلسات
const cleanupExpiredSessions = async () => {
  const now = new Date();
  
  const deletedSessions = await prisma.userSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { 
          lastActivity: { 
            lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // أسبوع من عدم النشاط
          }
        }
      ]
    }
  });
  
  console.log(`تم حذف ${deletedSessions.count} جلسة منتهية الصلاحية`);
};

// تشغيل المهمة كل ساعة
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
```

### تحديث كلمات المرور المنتهية الصلاحية
```typescript
// إجبار تغيير كلمات المرور القديمة
const forcePasswordUpdate = async () => {
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  await prisma.user.updateMany({
    where: {
      lastPasswordChange: { lt: threeMonthsAgo },
      mustChangePassword: false
    },
    data: {
      mustChangePassword: true
    }
  });
};
```

---

## 10. أفضل الممارسات
### Best Practices

### 🔒 الأمان
1. **كلمات المرور القوية**: استخدم كلمات مرور معقدة وإجبار تغييرها دورياً
2. **التشفير**: جميع كلمات المرور مشفرة باستخدام bcrypt
3. **الجلسات الآمنة**: انتهاء صلاحية الجلسات وتتبع النشاط
4. **مراقبة محاولات الاختراق**: تسجيل ومراقبة محاولات تسجيل الدخول الفاشلة

### 👥 إدارة المستخدمين
1. **مبدأ الحد الأدنى من الصلاحيات**: إعطاء أقل صلاحيات ممكنة
2. **المراجعة الدورية**: مراجعة صلاحيات المستخدمين بانتظام
3. **التوثيق**: توثيق جميع التغييرات في الصلاحيات
4. **التدريب**: تدريب المستخدمين على استخدام النظام بأمان

### 📊 المراقبة والتدقيق
1. **سجلات التدقيق**: تسجيل جميع العمليات المهمة
2. **التقارير الدورية**: إنشاء تقارير دورية عن نشاط المستخدمين
3. **التنبيهات**: إعداد تنبيهات للأنشطة المشبوهة
4. **النسخ الاحتياطية**: نسخ احتياطية منتظمة لبيانات المستخدمين

---

## الخلاصة
### Summary

يوفر نظام إدارة المستخدمين والصلاحيات في تطبيق إدارة الفنادق:

✅ **نظام صلاحيات متقدم** مع مجموعات مستخدمين وصلاحيات مخصصة
✅ **أمان عالي** مع تشفير كلمات المرور ومراقبة الجلسات
✅ **مرونة في الإدارة** مع إمكانية تخصيص الصلاحيات لكل مستخدم
✅ **مراقبة شاملة** مع سجلات التدقيق والتقارير
✅ **واجهة سهلة الاستخدام** لإدارة المستخدمين والصلاحيات

هذا النظام يضمن الأمان والمرونة في إدارة الوصول لجميع وظائف النظام حسب دور كل مستخدم.