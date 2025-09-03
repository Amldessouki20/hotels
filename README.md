<BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
```

### 2. تقرير الإشغال

```typescript
// components/reports/OccupancyReport.tsx
export function OccupancyReport() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    hotelId: ''
  });

  const fetchReport = async () => {
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        ...(filters.hotelId && { hotelId: filters.hotelId })
      });
      
      const response = await fetch(`/api/reports/occupancy?${params}`);
      const reportData = await response.json();
      setData(reportData);
    } catch (error) {
      toast.error('حدث خطأ في تحميل التقرير');
    }
  };

  return (
    <div className="space-y-6">
      {/* فلاتر التقرير */}
      <Card>
        <CardHeader>
          <CardTitle>تقرير الإشغال</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DatePicker
              label="من تاريخ"
              value={filters.startDate}
              onChange={(date) => setFilters({ ...filters, startDate: date })}
            />
            
            <DatePicker
              label="إلى تاريخ"
              value={filters.endDate}
              onChange={(date) => setFilters({ ...filters, endDate: date })}
            />
            
            <Select
              label="الفندق"
              value={filters.hotelId}
              onValueChange={(value) => setFilters({ ...filters, hotelId: value })}
            >
              <SelectItem value="">جميع الفنادق</SelectItem>
              {/* قائمة الفنادق */}
            </Select>
          </div>
          
          <Button onClick={fetchReport} className="mt-4">
            تحديث التقرير
          </Button>
        </CardContent>
      </Card>
      
      {/* عرض التقرير */}
      {data && (
        <>
          {/* ملخص الإشغال */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>معدل الإشغال</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {data.summary.occupancyRate}%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>الغرف المشغولة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {data.summary.occupiedRooms}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>الغرف المتاحة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {data.summary.availableRooms}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* رسم بياني للإشغال */}
          <Card>
            <CardHeader>
              <CardTitle>تطور الإشغال</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="occupancyRate" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
```

## بنية المشروع
### Project Structure

```
soufianbookingapp/
├── prisma/
│   ├── schema_improved.prisma # نموذج قاعدة البيانات المحسن
│   ├── migrations/            # ملفات الهجرة
│   └── setup/                 # ملفات الإعداد الأولي
│       ├── initial-groups.sql # مجموعات المستخدمين والصلاحيات
│       └── initial-users.sql  # المستخدمين الافتراضيين
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── admin/             # صفحات الإدارة
│   │   │   ├── users/         # إدارة المستخدمين
│   │   │   ├── groups/        # إدارة المجموعات
│   │   │   └── permissions/   # إدارة الصلاحيات
│   │   ├── dashboard/         # لوحة التحكم
│   │   ├── hotels/            # إدارة الفنادق
│   │   ├── rooms/             # إدارة الغرف
│   │   ├── bookings/          # إدارة الحجوزات
│   │   ├── guests/            # إدارة النزلاء
│   │   ├── payments/          # إدارة المدفوعات
│   │   └── reports/           # التقارير
│   ├── components/            # مكونات React
│   │   ├── ui/                # مكونات الواجهة الأساسية
│   │   ├── forms/             # نماذج الإدخال
│   │   ├── tables/            # جداول البيانات
│   │   ├── charts/            # الرسوم البيانية
│   │   └── admin/             # مكونات الإدارة
│   ├── lib/                   # المكتبات والأدوات
│   │   ├── auth/              # نظام المصادقة
│   │   ├── permissions/       # إدارة الصلاحيات
│   │   ├── database/          # اتصال قاعدة البيانات
│   │   └── utils/             # أدوات مساعدة
│   └── types/                 # تعريفات TypeScript
├── public/                    # الملفات العامة
├── docs/                      # الوثائق
│   └── user-management-guide.md # دليل إدارة المستخدمين
└── README.md                  # هذا الملف
```

---

## 🎨 تطوير واجهات المستخدم (UI)

### 1. إعداد المشروع للواجهات

#### تثبيت المكتبات المطلوبة
```bash
# مكتبات UI الأساسية
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-checkbox
npm install @radix-ui/react-toast @radix-ui/react-tabs
npm install lucide-react react-hook-form @hookform/resolvers
npm install zod tailwindcss-animate class-variance-authority
npm install clsx tailwind-merge

# مكتبات الرسوم البيانية
npm install recharts

# مكتبات التواريخ
npm install date-fns react-day-picker

# مكتبات الجداول
npm install @tanstack/react-table

# مكتبات الإشعارات
npm install react-hot-toast
```

#### إعداد Tailwind CSS
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### 2. مكونات UI الأساسية

#### مكون Button
```typescript
// components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

#### مكون Input
```typescript
// components/ui/input.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

#### مكون Card
```typescript
// components/ui/card.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

### 3. تخطيط الصفحات الرئيسية

#### صفحة لوحة التحكم
```typescript
// app/dashboard/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hotel, Bed, Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
        <p className="text-muted-foreground">
          مرحباً بك في نظام إدارة الفنادق
        </p>
      </div>
      
      {/* الإحصائيات السريعة */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفنادق</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 من الشهر الماضي
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الغرف المتاحة</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">
              من أصل 400 غرفة
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحجوزات اليوم</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              +12% من أمس
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">
              +20.1% من الشهر الماضي
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* الإجراءات السريعة */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/bookings/new">
              <Button className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                حجز جديد
              </Button>
            </Link>
            <Link href="/guests/new">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                نزيل جديد
              </Button>
            </Link>
            <Link href="/hotels/new">
              <Button variant="outline" className="w-full justify-start">
                <Hotel className="mr-2 h-4 w-4" />
                فندق جديد
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>الحجوزات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* قائمة الحجوزات الأخيرة */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">أحمد محمد</p>
                  <p className="text-sm text-muted-foreground">غرفة 101 - فندق الريتز</p>
                </div>
                <div className="text-sm text-green-600">مؤكد</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">سارة أحمد</p>
                  <p className="text-sm text-muted-foreground">غرفة 205 - فندق الهيلتون</p>
                </div>
                <div className="text-sm text-yellow-600">في الانتظار</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">محمد علي</p>
                  <p className="text-sm text-muted-foreground">جناح 301 - فندق الشيراتون</p>
                </div>
                <div className="text-sm text-blue-600">تم الوصول</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>الإحصائيات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">معدل الإشغال</span>
                <span className="font-bold text-green-600">78%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">متوسط سعر الليلة</span>
                <span className="font-bold">$125</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">عدد النزلاء VIP</span>
                <span className="font-bold text-purple-600">15</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">التقييم العام</span>
                <span className="font-bold text-yellow-600">4.8/5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### صفحة قائمة الفنادق
```typescript
// app/hotels/page.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HotelsList } from '@/components/hotels/HotelsList';
import { AdvancedFilters } from '@/components/filters/AdvancedFilters';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function HotelsPage() {
  return (
    <div className="space-y-6">
      {/* العنوان والإجراءات */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الفنادق</h1>
          <p className="text-muted-foreground">
            إدارة جميع الفنادق في النظام
          </p>
        </div>
        
        <Link href="/hotels/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            فندق جديد
          </Button>
        </Link>
      </div>
      
      {/* شريط البحث والفلاتر */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث في الفنادق..."
              className="pl-10"
            />
          </div>
        </div>
        
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          فلاتر متقدمة
        </Button>
      </div>
      
      {/* الفلاتر المتقدمة */}
      <AdvancedFilters
        filterType="hotels"
        filters={{}}
        onFiltersChange={(filters) => console.log(filters)}
      />
      
      {/* قائمة الفنادق */}
      <HotelsList />
    </div>
  );
}
```

---

## 🔐 المصادقة والصلاحيات
### Authentication & Permissions

### نظام إدارة المستخدمين والصلاحيات

يعتمد النظام على هيكل متقدم لإدارة المستخدمين والصلاحيات يتكون من:

#### 1. مجموعات المستخدمين (User Groups)
```typescript
interface UserGroup {
  id: string;
  name: string;           // اسم المجموعة
  description: string;    // وصف المجموعة
  isActive: boolean;      // حالة النشاط
  createdAt: Date;
  updatedAt: Date;
}
```

**المجموعات الافتراضية:**
- 🔴 **مديرو النظام (System Admins)**: إدارة كاملة للنظام
- 🟠 **مديرو الفنادق (Hotel Managers)**: إدارة فندق واحد أو أكثر
- 🟡 **موظفو الاستقبال (Receptionists)**: إدارة الحجوزات والنزلاء
- 🟢 **المحاسبون (Accountants)**: إدارة المدفوعات والتقارير المالية
- 🔵 **المشاهدون (Viewers)**: عرض البيانات فقط

#### 2. الصلاحيات (Permissions)
```typescript
interface Permission {
  id: string;
  module: string;         // النموذج (system, hotel, room, booking, guest, payment, report)
  action: string;         // العملية (create, read, update, delete, manage)
  name: string;           // اسم الصلاحية
  description: string;    // وصف الصلاحية
  createdAt: Date;
}
```

**أنواع الصلاحيات:**
- **صلاحيات النظام**: `system:manage_users`, `system:manage_groups`, `system:view_audit_logs`
- **صلاحيات الفنادق**: `hotel:create`, `hotel:read`, `hotel:update`, `hotel:delete`
- **صلاحيات الغرف**: `room:create`, `room:read`, `room:update`, `room:manage_pricing`
- **صلاحيات الحجوزات**: `booking:create`, `booking:read`, `booking:update`, `booking:checkin`
- **صلاحيات النزلاء**: `guest:create`, `guest:read`, `guest:manage_vip`, `guest:manage_blacklist`
- **صلاحيات المدفوعات**: `payment:create`, `payment:read`, `payment:refund`, `payment:approve`
- **صلاحيات التقارير**: `report:view_basic`, `report:view_financial`, `report:export`

#### 3. ربط الصلاحيات بالمجموعات (Group Permissions)
```typescript
interface GroupPermission {
  id: string;
  groupId: string;        // معرف المجموعة
  permissionId: string;   // معرف الصلاحية
  createdAt: Date;
}
```

#### 4. الصلاحيات الخاصة بالمستخدمين (User Permissions)
```typescript
interface UserPermission {
  id: string;
  userId: string;         // معرف المستخدم
  permissionId: string;   // معرف الصلاحية
  createdAt: Date;
}
```

#### 5. المستخدمون (Users)
```typescript
interface User {
  id: string;
  email: string;              // البريد الإلكتروني (فريد)
  hashedPassword: string;     // كلمة المرور المشفرة
  fullName: string;           // الاسم الكامل
  phone: string;              // رقم الهاتف
  groupId: string;            // مجموعة المستخدم
  isActive: boolean;          // حالة النشاط
  mustChangePassword: boolean; // إجبار تغيير كلمة المرور
  lastPasswordChange?: Date;   // آخر تغيير لكلمة المرور
  createdById: string;        // من أنشأ المستخدم
  createdAt: Date;
  updatedAt: Date;
}
```

### كيفية عمل نظام إدارة المستخدمين

#### 1. إعداد النظام الأولي
```bash
# تشغيل ملفات الإعداد الأولي
psql -d hotel_management -f prisma/setup/initial-groups.sql
psql -d hotel_management -f prisma/setup/initial-users.sql
```

#### 2. تسجيل دخول مدير النظام
```typescript
// بيانات مدير النظام الافتراضي
const adminCredentials = {
  email: 'admin@hotel-system.com',
  password: 'password123' // يجب تغييرها عند أول تسجيل دخول
};
```

#### 3. إضافة مستخدم جديد من واجهة الإدارة

**الخطوات:**
1. **الوصول لصفحة الإدارة**: `لوحة التحكم → إدارة النظام → المستخدمين`
2. **النقر على "إضافة مستخدم جديد"**
3. **ملء البيانات الأساسية**:
   - الاسم الكامل
   - البريد الإلكتروني (فريد)
   - رقم الهاتف
   - اختيار مجموعة المستخدم
4. **تحديد الصلاحيات الإضافية** (اختياري)
5. **إنشاء كلمة مرور مؤقتة**
6. **حفظ المستخدم**

#### 4. تخصيص الصلاحيات

**صلاحيات المجموعة (تلقائية)**:
```typescript
// مثال: صلاحيات مدير الفندق
const hotelManagerPermissions = [
  'hotel:read', 'hotel:update',
  'room:create', 'room:read', 'room:update', 'room:manage_pricing',
  'booking:create', 'booking:read', 'booking:update', 'booking:checkin',
  'guest:create', 'guest:read', 'guest:update',
  'payment:create', 'payment:read',
  'report:view_basic'
];
```

**صلاحيات إضافية خاصة بالمستخدم**:
```typescript
// مثال: إعطاء مدير فندق صلاحيات إضافية
const additionalPermissions = [
  'booking:delete',      // حذف الحجوزات
  'guest:manage_vip',    // إدارة نزلاء VIP
  'payment:refund'       // استرداد المدفوعات
];
```

#### 5. ربط المديرين بالفنادق
```typescript
// جدول ربط مديري الفنادق
interface HotelManager {
  id: string;
  hotelId: string;    // الفندق المخصص
  userId: string;     // المدير
  isActive: boolean;
  assignedAt: Date;
}

// مثال: ربط مدير بفندق
const assignment = {
  hotelId: 'hotel-001',
  userId: 'user-hm-001',
  isActive: true
};
```

#### 6. مراقبة النشاط والأمان

**تتبع الجلسات**:
```typescript
interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  loginAt: Date;
  lastActivity: Date;
  isActive: boolean;
  expiresAt: Date;
}
```

**تسجيل محاولات تسجيل الدخول**:
```typescript
interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  attemptAt: Date;
  isSuccessful: boolean;
  failureReason?: string;
}
```

#### 7. سير العمل النموذجي

**إضافة مدير فندق جديد**:
1. مدير النظام يسجل دخول
2. يذهب لصفحة إدارة المستخدمين
3. ينقر "إضافة مستخدم جديد"
4. يملأ البيانات ويختار "مدير فندق"
5. يضيف صلاحيات إضافية حسب الحاجة
6. يربط المدير بفندق معين
7. يرسل بيانات تسجيل الدخول للمدير الجديد

**إضافة موظف استقبال**:
1. مدير الفندق يسجل دخول
2. يذهب لصفحة إدارة المستخدمين (إذا كان لديه الصلاحية)
3. ينشئ مستخدم جديد بمجموعة "موظف استقبال"
4. الموظف يحصل على صلاحيات مجموعته تلقائياً

### الملفات المرجعية

📁 **ملفات الإعداد**:
- `prisma/setup/initial-groups.sql` - مجموعات المستخدمين والصلاحيات الافتراضية
- `prisma/setup/initial-users.sql` - المستخدمين الافتراضيين مع أمثلة

📖 **الوثائق**:
- `docs/user-management-guide.md` - دليل شامل لإدارة المستخدمين والصلاحيات

🔧 **الكود المرجعي**:
- `src/lib/auth/` - نظام المصادقة
- `src/lib/permissions/` - إدارة الصلاحيات
- `src/app/admin/users/` - واجهة إدارة المستخدمين

---

## 🔧 خطوات التطوير المرحلية

### المرحلة الأولى: الإعداد الأساسي (أسبوع 1)

1. **إعداد المشروع**
   - إنشاء مشروع Next.js جديد
   - تثبيت وإعداد Prisma
   - إعداد قاعدة البيانات PostgreSQL
   - تطبيق Schema المحسن

2. **إعداد نظام المصادقة**
   - تثبيت NextAuth.js
   - إعداد مقدمي المصادقة
   - إنشاء middleware للحماية
   - تطبيق نظام الصلاحيات

3. **إعداد UI Framework**
   - تثبيت Tailwind CSS
   - إنشاء مكونات UI الأساسية
   - إعداد نظام الألوان والخطوط
   - تطبيق دعم RTL للعربية

### المرحلة الثانية: الوحدات الأساسية (أسبوع 2-3)

1. **وحدة إدارة الفنادق**
   - API endpoints للـ CRUD operations
   - واجهات إنشاء وتحديث الفنادق
   - صفحة قائمة الفنادق مع الفلاتر
   - صفحة تفاصيل الفندق

2. **وحدة إدارة الغرف**
   - API endpoints للغرف
   - واجهات إدارة الغرف
   - نظام الأسعار الموسمية
   - إدارة توفر الغرف

3. **وحدة إدارة النزلاء**
   - API endpoints للنزلاء
   - واجهات إدارة النزلاء
   - نظام VIP والقائمة السوداء
   - تتبع تاريخ النزلاء

### المرحلة الثالثة: الحجوزات والمدفوعات (أسبوع 4-5)

1. **وحدة الحجوزات**
   - API endpoints للحجوزات
   - واجهة إنشاء الحجز متعددة الخطوات
   - إدارة حالات الحجز
   - نظام الإشعارات

2. **وحدة المدفوعات**
   - API endpoints للمدفوعات
   - واجهات تسجيل المدفوعات
   - تتبع المدفوعات الجزئية
   - إنشاء الإيصالات

### المرحلة الرابعة: الفلاتر والتقارير (أسبوع 6)

1. **نظام الفلاتر المتقدم**
   - مكونات الفلاتر القابلة لإعادة الاستخدام
   - حفظ وتحميل الفلاتر
   - فلاتر مخصصة لكل وحدة

2. **نظام التقارير**
   - تقارير الإيرادات
   - تقارير الإشغال
   - تقارير النزلاء
   - تصدير التقارير

### المرحلة الخامسة: التحسينات والاختبار (أسبوع 7)

1. **تحسين الأداء**
   - تحسين الاستعلامات
   - إضافة التخزين المؤقت
   - تحسين الفهارس

2. **الاختبار والمراجعة**
   - اختبار جميع الوظائف
   - مراجعة الأمان
   - تحسين تجربة المستخدم

---

## 📝 ملاحظات مهمة للتطوير

### 1. أفضل الممارسات

- **استخدام TypeScript**: لضمان أمان الأنواع وتقليل الأخطاء
- **التحقق من البيانات**: استخدام Zod لتحقق من البيانات
- **معالجة الأخطاء**: تطبيق معالجة شاملة للأخطاء
- **الأمان**: تطبيق أفضل ممارسات الأمان
- **الأداء**: تحسين الاستعلامات والفهارس

### 2. هيكل الملفات المقترح

```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── dashboard/
├── hotels/
│   ├── page.tsx
│   ├── new/
│   └── [id]/
├── rooms/
├── bookings/
├── guests/
├── payments/
├── reports/
└── api/
    ├── auth/
    ├── hotels/
    ├── rooms/
    ├── bookings/
    ├── guests/
    ├── payments/
    └── reports/
```

### 3. متغيرات البيئة المطلوبة

```env
# قاعدة البيانات
DATABASE_URL="postgresql://username:password@localhost:5432/hotel_management"

# المصادقة
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# البريد الإلكتروني
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# التخزين السحابي (اختياري)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 4. أوامر مفيدة للتطوير

```bash
# تطوير
npm run dev

# بناء المشروع
npm run build

# تشغيل الإنتاج
npm start

# إعادة تعيين قاعدة البيانات
npx prisma migrate reset

# إنشاء migration جديد
npx prisma migrate dev --name migration_name

# تحديث Prisma Client
npx prisma generate

# فتح Prisma Studio
npx prisma studio
```

---

## 🚀 نصائح للنشر والإنتاج

### 1. إعداد الإنتاج

- استخدام قاعدة بيانات PostgreSQL مُدارة
- إعداد النسخ الاحتياطية التلقائية
- تفعيل SSL/TLS
- إعداد مراقبة الأداء
- تطبيق حدود معدل الطلبات

### 2. الأمان

- تشفير البيانات الحساسة
- تطبيق CORS بشكل صحيح
- استخدام HTTPS في الإنتاج
- تحديث التبعيات بانتظام
- مراجعة الصلاحيات دورياً

### 3. المراقبة والصيانة

- إعداد نظام مراقبة الأخطاء
- تتبع الأداء والاستخدام
- النسخ الاحتياطية المنتظمة
- تحديث النظام دورياً
- مراجعة السجلات (Logs)

---

## 📞 الدعم والمساعدة

للحصول على المساعدة أو الإبلاغ عن مشاكل:

1. **الوثائق**: راجع هذا الملف للحصول على معلومات مفصلة
2. **المشاكل الشائعة**: تحقق من قسم استكشاف الأخطاء
3. **التحديثات**: تابع التحديثات الجديدة للنظام

---

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT. راجع ملف LICENSE للمزيد من التفاصيل.

---

**تم إنشاء هذا الدليل بواسطة نظام إدارة الفنادق المتقدم**

*آخر تحديث: ديسمبر 2024*