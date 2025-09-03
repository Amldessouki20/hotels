import { PrismaClient, BoardType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ================================
  // CREATE DEFAULT COMPANY
  // ================================
  const defaultCompany = await prisma.company.upsert({
    where: { name: 'Default Company' },
    update: {},
    create: { name: 'Default Company' },
  })

  // ================================
  // PERMISSIONS
  // ================================
  console.log('📋 Creating permissions...')
  const permissions = [
    { module: 'Hotels', action: 'create', description: 'إنشاء فندق جديد' },
    { module: 'Hotels', action: 'read', description: 'عرض الفنادق' },
    { module: 'Hotels', action: 'update', description: 'تحديث بيانات الفندق' },
    { module: 'Hotels', action: 'delete', description: 'حذف فندق' },
    { module: 'Rooms', action: 'create', description: 'إنشاء غرفة جديدة' },
    { module: 'Rooms', action: 'read', description: 'عرض الغرف' },
    { module: 'Rooms', action: 'update', description: 'تحديث بيانات الغرفة' },
    { module: 'Rooms', action: 'delete', description: 'حذف غرفة' },
    { module: 'Bookings', action: 'create', description: 'إنشاء حجز جديد' },
    { module: 'Bookings', action: 'read', description: 'عرض الحجوزات' },
    { module: 'Bookings', action: 'update', description: 'تحديث بيانات الحجز' },
    { module: 'Bookings', action: 'delete', description: 'حذف حجز' },
    { module: 'Bookings', action: 'cancel', description: 'إلغاء حجز' },
    { module: 'Guests', action: 'create', description: 'إنشاء ضيف جديد' },
    { module: 'Guests', action: 'read', description: 'عرض الضيوف' },
    { module: 'Guests', action: 'update', description: 'تحديث بيانات الضيف' },
    { module: 'Guests', action: 'delete', description: 'حذف ضيف' },
    { module: 'Payments', action: 'create', description: 'إنشاء دفعة جديدة' },
    { module: 'Payments', action: 'read', description: 'عرض المدفوعات' },
    { module: 'Payments', action: 'update', description: 'تحديث بيانات الدفعة' },
    { module: 'Payments', action: 'delete', description: 'حذف دفعة' },
    { module: 'Reports', action: 'read', description: 'عرض التقارير' },
    { module: 'Reports', action: 'export', description: 'تصدير التقارير' },
    { module: 'Users', action: 'create', description: 'إنشاء مستخدم جديد' },
    { module: 'Users', action: 'read', description: 'عرض المستخدمين' },
    { module: 'Users', action: 'update', description: 'تحديث بيانات المستخدم' },
    { module: 'Users', action: 'delete', description: 'حذف مستخدم' },
    { module: 'Filters', action: 'create', description: 'إنشاء فلتر محفوظ' },
    { module: 'Filters', action: 'read', description: 'عرض الفلاتر المحفوظة' },
    { module: 'Filters', action: 'update', description: 'تحديث فلتر محفوظ' },
    { module: 'Filters', action: 'delete', description: 'حذف فلتر محفوظ' },
    { module: 'Filters', action: 'share', description: 'مشاركة فلتر مع الآخرين' },
  ]

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { module_action: { module: permission.module, action: permission.action } },
      update: {},
      create: permission,
    })
  }

  // ================================
  // USER GROUPS
  // ================================
  console.log('👥 Creating user groups...')
  const adminGroup = await prisma.userGroup.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'مدير النظام - صلاحيات كاملة', isActive: true },
  })

  const managerGroup = await prisma.userGroup.upsert({
    where: { name: 'Manager' },
    update: {},
    create: { name: 'Manager', description: 'مدير الفندق - صلاحيات إدارية', isActive: true },
  })

  const receptionistGroup = await prisma.userGroup.upsert({
    where: { name: 'Receptionist' },
    update: {},
    create: { name: 'Receptionist', description: 'موظف الاستقبال - صلاحيات محدودة', isActive: true },
  })

  // ================================
  // GROUP PERMISSIONS
  // ================================
  console.log('🔐 Assigning permissions to groups...')
  const allPermissions = await prisma.permission.findMany()

  for (const permission of allPermissions) {
    await prisma.groupPermission.upsert({
      where: { groupId_permissionId: { groupId: adminGroup.id, permissionId: permission.id } },
      update: {},
      create: { groupId: adminGroup.id, permissionId: permission.id, isAllowed: true },
    })
  }

  // ================================
  // USERS
  // ================================
  console.log('👤 Creating users...')
  const hashedPassword = await bcrypt.hash('123456', 10)

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@hotel.com',
      password: hashedPassword,
      fullName: 'مدير النظام',
      phone: '+201234567890',
      groupId: adminGroup.id,
      isActive: true,
      passwordNeverExpires: true,
    },
  })

  // ================================
  // HOTELS
  // ================================
  console.log('🏨 Creating sample hotels...')
  const hotel1 = await prisma.hotel.upsert({
    where: { code: 'HTL001' },
    update: {},
    create: {
      code: 'HTL001',
      name: 'فندق النيل الذهبي',
      description: 'فندق فاخر على ضفاف النيل',
      address: 'كورنيش النيل، القاهرة',
      location: 'القاهرة',
      phone: '+20223456789',
      email: 'info@goldennile.com',
      website: 'https://goldennile.com',
      rating: 5,
      isActive: true,
      createdById: adminUser.id,
      companyId: defaultCompany.id,
    },
  })

  // ================================
  // ROOMS
  // ================================
  console.log('🛏️ Creating sample rooms...')
  const roomTypes = [
    { type: 'Standard Single', price: 150, capacity: 1 },
    { type: 'Standard Double', price: 200, capacity: 2 },
    { type: 'Deluxe Suite', price: 350, capacity: 4 },
    { type: 'Presidential Suite', price: 800, capacity: 6 },
  ]

  for (const roomType of roomTypes) {
    await prisma.room.createMany({
      data: Array(5).fill({
        hotelId: hotel1.id,
        roomType: roomType.type,
        roomTypeDescription: `غرفة ${roomType.type} مريحة ومجهزة بالكامل`,
        quantity: 1,
        capacity: roomType.capacity,
        basePrice: roomType.price,
        purchasePrice: roomType.price * 0.7,
        boardType: BoardType.BED_BREAKFAST,
        isActive: true,
        createdById: adminUser.id,
      }),
    })
  }

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
