import { NextRequest, NextResponse } from 'next/server';
import { resetPrismaConnection } from '@/lib/prisma';
import { verifyAuthFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authUser = await verifyAuthFromRequest(request);
  if (!authUser) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // Check if user is admin (check group name or role)
    if (authUser.group.name !== 'المديرين' && authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'يجب أن تكون مدير للوصول لهذه الخدمة' },
        { status: 403 }
      );
    }

    // Reset Prisma connection
    await resetPrismaConnection();

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين اتصال قاعدة البيانات بنجاح'
    });

  } catch (error) {
    console.error('Error resetting database connection:', error);
    return NextResponse.json(
      { error: 'خطأ في إعادة تعيين اتصال قاعدة البيانات' },
      { status: 500 }
    );
  }
}