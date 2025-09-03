import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// GET /api/hotels - Fetch all hotels
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch hotels with related data
    const hotels = await prisma.hotel.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        amenities: true,
        _count: {
          select: {
            rooms: true,
            bookings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: hotels,
      count: hotels.length,
    });
  } catch (error) {
    console.error('GET /api/hotels error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/hotels - Create a new hotel
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user has permission to create hotels (owners/admins)
    const groupName = decoded.groupName?.toLowerCase() || '';
    const canCreateHotels = groupName.includes('owner') || groupName.includes('admin');
    
    if (!canCreateHotels) {
      return NextResponse.json(
        { success: false, message: 'Only owners and admins can create hotels' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, altName, code, description, altDescription, address, companyId } = body;

    // Validate required fields
    if (!name || !code || !address || !companyId) {
      return NextResponse.json(
        { success: false, message: 'Name, code, address, and companyId are required' },
        { status: 400 }
      );
    }

    // Validate input types
    if (typeof name !== 'string' || typeof code !== 'string' || typeof address !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid input format' },
        { status: 400 }
      );
    }

    // Check if hotel code already exists
    const existingHotel = await prisma.hotel.findUnique({
      where: { code },
    });

    if (existingHotel) {
      return NextResponse.json(
        { success: false, message: 'Hotel code already exists' },
        { status: 409 }
      );
    }

    // Create new hotel
    const hotel = await prisma.hotel.create({
      data: {
        name,
        code,
        description: description || null,
        address,
        companyId,
        createdById: decoded.userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        amenities: true,
        _count: {
          select: {
            rooms: true,
            bookings: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: hotel,
        message: 'Hotel created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/hotels error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

