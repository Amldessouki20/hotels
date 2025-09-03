import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating a room
const createRoomSchema = z.object({
  hotelId: z.string().min(1, 'Hotel ID is required'),
  roomType: z.string().min(1, 'Room type is required'),
  roomTypeDescription: z.string().min(1, 'Room type description is required'),
  altDescription: z.string().optional(),
  purchasePrice: z.number().positive('Purchase price must be positive'),
  basePrice: z.number().positive('Base price must be positive'),
  quantity: z.number().int().positive('Quantity must be a positive integer').default(1),
  boardType: z.enum(['ROOM_ONLY', 'BED_BREAKFAST', 'HALF_BOARD', 'FULL_BOARD']).default('ROOM_ONLY'),
  size: z.string().optional(),
  capacity: z.number().int().positive('Capacity must be a positive integer').default(2),
  floor: z.number().int().optional(),
  isActive: z.boolean().default(true),
  amenities: z.array(z.object({
    name: z.string().min(1, 'Amenity name is required'),
    icon: z.string().optional()
  })).optional().default([])
});

// GET /api/rooms - Fetch all rooms with optional hotel filtering
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const isActive = searchParams.get('isActive');
    const roomType = searchParams.get('roomType');
    const boardType = searchParams.get('boardType');

    // Build where clause
    const where: any = {};
    if (hotelId) where.hotelId = hotelId;
    if (isActive !== null) where.isActive = isActive === 'true';
    if (roomType) where.roomType = { contains: roomType, mode: 'insensitive' };
    if (boardType) where.boardType = boardType;

    // Fetch rooms with related data
    const rooms = await prisma.room.findMany({
      where,
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        roomAmenities: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        },
        _count: {
          select: {
            bookings: true,
            seasonalPrices: true,
            availabilitySlots: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: rooms,
      count: rooms.length
    });

  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user has permission to create rooms (owners/admins)
    const groupName = decoded.groupName?.toLowerCase() || '';
    const canCreateRooms = groupName.includes('owner') || groupName.includes('admin');
    
    if (!canCreateRooms) {
      return NextResponse.json(
        { error: 'Only owners and admins can create rooms' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createRoomSchema.parse(body);

    // Check if hotel exists and user has access to it
    const hotel = await prisma.hotel.findUnique({
      where: { id: validatedData.hotelId },
      select: { id: true, createdById: true }
    });

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      );
    }

    // Check if user owns the hotel or has admin privileges
    const isOwnerOrAdmin = hotel.createdById === decoded.userId || 
                          groupName.includes('owner') || 
                          groupName.includes('admin');
    
    if (!isOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'You can only create rooms for your own hotels or as an admin' },
        { status: 403 }
      );
    }

    // Extract amenities from validated data
    const { amenities, ...roomData } = validatedData;

    // Create room with amenities in a transaction
    const room = await prisma.$transaction(async (tx) => {
      // Create the room
      const newRoom = await tx.room.create({
        data: {
          ...roomData,
          createdById: decoded.userId
        },
        include: {
          hotel: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          },
          roomAmenities: true
        }
      });

      // Create amenities if provided
      if (amenities && amenities.length > 0) {
        await tx.roomAmenity.createMany({
          data: amenities.map(amenity => ({
            roomId: newRoom.id,
            name: amenity.name,
            icon: amenity.icon
          }))
        });

        // Fetch the room again with amenities
        return await tx.room.findUnique({
          where: { id: newRoom.id },
          include: {
            hotel: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            createdBy: {
              select: {
                id: true,
                username: true,
                fullName: true
              }
            },
            roomAmenities: {
              select: {
                id: true,
                name: true,
                icon: true
              }
            }
          }
        });
      }

      return newRoom;
    });

    return NextResponse.json({
      success: true,
      message: 'Room created successfully',
      data: room
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating room:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT and DELETE methods are not allowed on this route
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use /api/rooms/[id] for updating specific rooms.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use /api/rooms/[id] for deleting specific rooms.' },
    { status: 405 }
  );
}