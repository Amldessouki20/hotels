# دليل إدارة مجموعات المستخدمين والصلاحيات للأدمن

## نظرة عامة

نظام إدارة الفنادق يوفر مرونة كاملة للأدمن في إنشاء وإدارة مجموعات المستخدمين والصلاحيات. النظام مصمم ليكون قابل للتخصيص بالكامل دون أي قيود.

## هيكل النظام الحالي

### 1. نموذج UserGroup (مجموعات المستخدمين)
```prisma
model UserGroup {
  id          String   @id @default(cuid())
  name        String   @unique          // اسم المجموعة (قابل للتخصيص)
  description String?                   // وصف المجموعة (اختياري)
  isActive    Boolean  @default(true)   // حالة المجموعة (نشطة/غير نشطة)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  users            User[]              // المستخدمين في هذه المجموعة
  groupPermissions GroupPermission[]   // صلاحيات المجموعة
}
```

### 2. نموذج Permission (الصلاحيات)
```prisma
model Permission {
  id          String   @id @default(cuid())
  module      String   // الوحدة: "Hotels" | "Bookings" | "Users" | "Reports" | أي وحدة جديدة
  action      String   // العملية: "create" | "read" | "update" | "delete" | أي عملية جديدة
  description String?  // وصف الصلاحية
  
  groupPermissions GroupPermission[]
  userPermissions  UserPermission[]
}
```

## المرونة المتاحة للأدمن

### ✅ إضافة مجموعات جديدة بحرية
- **لا توجد قيود** على عدد المجموعات
- **لا توجد قيود** على أسماء المجموعات
- يمكن إنشاء مجموعات مخصصة لأي غرض:
  - مجموعات حسب الأقسام (المحاسبة، الاستقبال، الصيانة)
  - مجموعات حسب المستوى (مدير عام، مدير فرع، موظف)
  - مجموعات حسب الفنادق (فندق القاهرة، فندق الإسكندرية)
  - أي تصنيف آخر

### ✅ إضافة صلاحيات جديدة بحرية
- **لا توجد قيود** على الوحدات (modules)
- **لا توجد قيود** على العمليات (actions)
- يمكن إنشاء صلاحيات لأي وحدة جديدة:
  - وحدات موجودة: Hotels, Bookings, Users, Reports
  - وحدات جديدة: Maintenance, Inventory, Marketing, Finance
  - أي وحدة أخرى

## أمثلة على المرونة

### مجموعات مخصصة يمكن إنشاؤها:
```sql
-- مجموعات حسب الأقسام
INSERT INTO user_groups (name, description) VALUES 
('قسم المحاسبة', 'مسؤول عن جميع العمليات المالية'),
('قسم الصيانة', 'مسؤول عن صيانة الفنادق والغرف'),
('قسم التسويق', 'مسؤول عن الحملات التسويقية والعروض');

-- مجموعات حسب المستوى
INSERT INTO user_groups (name, description) VALUES 
('مدير عام', 'صلاحيات كاملة على جميع الفنادق'),
('مدير فرع', 'صلاحيات على فندق واحد فقط'),
('مشرف نوبة', 'صلاحيات محدودة أثناء النوبة');

-- مجموعات حسب الفنادق
INSERT INTO user_groups (name, description) VALUES 
('فريق فندق النيل', 'موظفي فندق النيل'),
('فريق فندق الهرم', 'موظفي فندق الهرم');
```

### صلاحيات مخصصة يمكن إنشاؤها:
```sql
-- صلاحيات للصيانة
INSERT INTO permissions (module, action, description) VALUES 
('Maintenance', 'create', 'إنشاء طلب صيانة جديد'),
('Maintenance', 'assign', 'تعيين فني للصيانة'),
('Maintenance', 'complete', 'إنهاء طلب الصيانة');

-- صلاحيات للمخزون
INSERT INTO permissions (module, action, description) VALUES 
('Inventory', 'add_item', 'إضافة عنصر للمخزون'),
('Inventory', 'transfer', 'نقل عناصر بين الفنادق'),
('Inventory', 'audit', 'مراجعة المخزون');

-- صلاحيات للتسويق
INSERT INTO permissions (module, action, description) VALUES 
('Marketing', 'create_campaign', 'إنشاء حملة تسويقية'),
('Marketing', 'send_email', 'إرسال رسائل تسويقية'),
('Marketing', 'view_analytics', 'عرض تحليلات التسويق');
```

## واجهة الأدمن المقترحة

### 1. صفحة إدارة المجموعات
```typescript
// مكونات واجهة إدارة المجموعات
interface UserGroupForm {
  name: string;           // اسم المجموعة (حقل مفتوح)
  description?: string;   // وصف المجموعة (اختياري)
  isActive: boolean;      // حالة المجموعة
  permissions: string[];  // قائمة معرفات الصلاحيات
}

// API لإنشاء مجموعة جديدة
POST /api/admin/user-groups
{
  "name": "قسم خدمة العملاء",
  "description": "مسؤول عن التعامل مع شكاوى العملاء",
  "isActive": true,
  "permissions": ["perm_1", "perm_2", "perm_3"]
}
```

### 2. صفحة إدارة الصلاحيات
```typescript
// مكونات واجهة إدارة الصلاحيات
interface PermissionForm {
  module: string;         // الوحدة (حقل مفتوح)
  action: string;         // العملية (حقل مفتوح)
  description?: string;   // وصف الصلاحية (اختياري)
}

// API لإنشاء صلاحية جديدة
POST /api/admin/permissions
{
  "module": "CustomerService",
  "action": "resolve_complaint",
  "description": "حل شكاوى العملاء"
}
```

## إعدادات قاعدة البيانات

### حالة قاعدة البيانات الحالية ✅
- **Supabase**: متصلة وجاهزة
- **Database URL**: `postgresql://postgres:moataz1482015@db.bdcndsnjpdhxaezdkgcm.supabase.co:5432/postgres`
- **Host**: `aws-1-eu-north-1.pooler.supabase.com`
- **Database**: `postgres`

### الجداول الجاهزة:
- ✅ `user_groups` - لحفظ المجموعات
- ✅ `permissions` - لحفظ الصلاحيات
- ✅ `group_permissions` - لربط المجموعات بالصلاحيات
- ✅ `user_permissions` - لصلاحيات فردية إضافية
- ✅ `users` - المستخدمين مع ربطهم بالمجموعات

## خطوات التنفيذ

### 1. إنشاء واجهات الأدمن
```bash
# إنشاء صفحات إدارة المجموعات
mkdir -p src/app/admin/user-groups
mkdir -p src/app/admin/permissions

# إنشاء مكونات الواجهة
touch src/components/admin/UserGroupForm.tsx
touch src/components/admin/PermissionForm.tsx
touch src/components/admin/UserGroupList.tsx
touch src/components/admin/PermissionList.tsx
```

### 2. إنشاء APIs
```bash
# إنشاء APIs للمجموعات والصلاحيات
mkdir -p src/app/api/admin/user-groups
mkdir -p src/app/api/admin/permissions

touch src/app/api/admin/user-groups/route.ts
touch src/app/api/admin/permissions/route.ts
```

### 3. تشغيل المايجريشن
```bash
# تطبيق الاسكيما على قاعدة البيانات
npx prisma db push

# إنشاء البيانات الأولية
npx prisma db seed
```

## الخلاصة

### ✅ النظام يدعم بالفعل:
1. **إضافة مجموعات بحرية كاملة** - لا توجد قيود على الأسماء أو العدد
2. **إضافة صلاحيات بحرية كاملة** - لا توجد قيود على الوحدات أو العمليات
3. **ربط مرن** بين المجموعات والصلاحيات
4. **صلاحيات فردية إضافية** للمستخدمين
5. **قاعدة بيانات جاهزة** على Supabase
6. **واجهات الإدارة (Admin UI) مكتملة**
7. **APIs للإدارة مكتملة**

### 📁 الملفات المُنشأة:

#### واجهات المستخدم:
- `src/components/admin/UserGroupManager.tsx` - إدارة المجموعات
- `src/components/admin/PermissionManager.tsx` - إدارة الصلاحيات
- `src/app/admin/groups/page.tsx` - صفحة الإدارة الرئيسية

#### APIs:
- `src/app/api/admin/user-groups/route.ts` - إدارة المجموعات
- `src/app/api/admin/user-groups/[id]/route.ts` - إدارة مجموعة واحدة
- `src/app/api/admin/user-groups/[id]/permissions/route.ts` - صلاحيات المجموعة
- `src/app/api/admin/permissions/route.ts` - إدارة الصلاحيات
- `src/app/api/admin/permissions/[id]/route.ts` - إدارة صلاحية واحدة

### 📋 ما يحتاج تنفيذ:
1. **تطبيق نظام التحقق من الصلاحيات** في التطبيق
2. **إضافة middleware للحماية**
3. **اختبار النظام**

النظام مصمم ليكون **مرن بالكامل** ويسمح للأدمن بإنشاء أي تصنيفات أو صلاحيات يحتاجها دون أي قيود تقنية.