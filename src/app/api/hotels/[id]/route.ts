import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/hotels/[id] - Fetch hotel by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid hotel ID' },
        { status: 400 }
      );
    }

    // Fetch hotel by ID with related data
    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        amenities: true,
        rooms: {
          select: {
            id: true,
            roomType: true,
            basePrice: true,
            quantity: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            rooms: true,
            bookings: true,
          },
        },
      },
    });

    if (!hotel) {
      return NextResponse.json(
        { success: false, message: 'Hotel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error('GET /api/hotels/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/hotels/[id] - Update hotel by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Check if user has permission to update hotels (owners/admins)
    const groupName = decoded.groupName?.toLowerCase() || '';
    const canUpdateHotels = groupName.includes('owner') || groupName.includes('admin');
    
    if (!canUpdateHotels) {
      return NextResponse.json(
        { success: false, message: 'Only owners and admins can update hotels' },
        { status: 403 }
      );
    }

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid hotel ID' },
        { status: 400 }
      );
    }

    // Check if hotel exists
    const existingHotel = await prisma.hotel.findUnique({
      where: { id },
    });

    if (!existingHotel) {
      return NextResponse.json(
        { success: false, message: 'Hotel not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, altName, code, description, altDescription, address } = body;

    // Validate required fields if provided
    if (name !== undefined && (!name || typeof name !== 'string')) {
      return NextResponse.json(
        { success: false, message: 'Invalid name format' },
        { status: 400 }
      );
    }

    if (code !== undefined && (!code || typeof code !== 'string')) {
      return NextResponse.json(
        { success: false, message: 'Invalid code format' },
        { status: 400 }
      );
    }

    if (address !== undefined && (!address || typeof address !== 'string')) {
      return NextResponse.json(
        { success: false, message: 'Invalid address format' },
        { status: 400 }
      );
    }

    // Check if new code already exists (if code is being updated)
    if (code && code !== existingHotel.code) {
      const hotelWithCode = await prisma.hotel.findUnique({
        where: { code },
      });

      if (hotelWithCode) {
        return NextResponse.json(
          { success: false, message: 'Hotel code already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (altName !== undefined) updateData.altName = altName || null;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description || null;
    if (altDescription !== undefined) updateData.altDescription = altDescription || null;
    if (address !== undefined) updateData.address = address;

    // Update hotel
    const updatedHotel = await prisma.hotel.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: updatedHotel,
      message: 'Hotel updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/hotels/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/hotels/[id] - Delete hotel by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Check if user has permission to delete hotels (owners/admins)
    const groupName = decoded.groupName?.toLowerCase() || '';
    const canDeleteHotels = groupName.includes('owner') || groupName.includes('admin');
    
    if (!canDeleteHotels) {
      return NextResponse.json(
        { success: false, message: 'Only owners and admins can delete hotels' },
        { status: 403 }
      );
    }

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid hotel ID' },
        { status: 400 }
      );
    }

    // Check if hotel exists
    const existingHotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rooms: true,
            bookings: true,
          },
        },
      },
    });

    if (!existingHotel) {
      return NextResponse.json(
        { success: false, message: 'Hotel not found' },
        { status: 404 }
      );
    }

    // Check if hotel has active bookings
    if (existingHotel._count.bookings > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete hotel with existing bookings. Please cancel all bookings first.' 
        },
        { status: 409 }
      );
    }

    // Delete hotel (this will cascade delete related amenities and rooms due to schema constraints)
    await prisma.hotel.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Hotel deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/hotels/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

