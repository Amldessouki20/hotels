import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating a room
const updateRoomSchema = z.object({
  roomType: z.string().min(1, 'Room type is required').optional(),
  roomTypeDescription: z.string().min(1, 'Room type description is required').optional(),
  altDescription: z.string().optional(),
  basePrice: z.number().positive('Base price must be positive').optional(),
  quantity: z.number().int().positive('Quantity must be a positive integer').optional(),
  boardType: z.enum(['ROOM_ONLY', 'BED_BREAKFAST', 'HALF_BOARD', 'FULL_BOARD']).optional(),
  size: z.string().optional(),
  capacity: z.number().int().positive('Capacity must be a positive integer').optional(),
  floor: z.number().int().optional(),
  isActive: z.boolean().optional(),
  amenities: z.array(z.object({
    name: z.string().min(1, 'Amenity name is required'),
    icon: z.string().optional()
  })).optional()
});

// GET /api/rooms/[id] - Fetch a specific room by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const roomId = id;

    // Fetch room with all related data
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true
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
        seasonalPrices: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            price: true
          },
          orderBy: {
            startDate: 'asc'
          }
        },
        availabilitySlots: {
          select: {
            id: true,
            date: true,
            availableCount: true,
            blockedCount: true,
            notes: true
          },
          where: {
            date: {
              gte: new Date()
            }
          },
          orderBy: {
            date: 'asc'
          },
          take: 30 // Next 30 days
        },
        _count: {
          select: {
            bookings: true,
            seasonalPrices: true,
            availabilitySlots: true
          }
        }
      }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: room
    });

  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/rooms/[id] - Update a specific room
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Check if user has owner or admin group
    if (!['owner', 'admin'].includes(decoded.groupName)) {
      return NextResponse.json(
        { error: 'Only owners and admins can update rooms' },
        { status: 403 }
      );
    }

    const roomId = id;

    // Check if room exists and get hotel info
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        hotel: {
          select: {
            id: true,
            createdById: true
          }
        }
      }
    });

    if (!existingRoom) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check if user owns the hotel or is admin/owner
    if (existingRoom.hotel.createdById !== decoded.userId && !['owner', 'admin'].includes(decoded.groupName)) {
      return NextResponse.json(
        { error: 'You can only update rooms in your own hotels' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateRoomSchema.parse(body);

    // Extract amenities from validated data
    const { amenities, ...roomData } = validatedData;

    // Update room with amenities in a transaction
    const updatedRoom = await prisma.$transaction(async (tx) => {
      // Update the room
      const room = await tx.room.update({
        where: { id: roomId },
        data: roomData,
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

      // Update amenities if provided
      if (amenities !== undefined) {
        // Delete existing amenities
        await tx.roomAmenity.deleteMany({
          where: { roomId }
        });

        // Create new amenities
        if (amenities.length > 0) {
          await tx.roomAmenity.createMany({
            data: amenities.map(amenity => ({
              roomId,
              name: amenity.name,
              icon: amenity.icon
            }))
          });
        }

        // Fetch the room again with updated amenities
        return await tx.room.findUnique({
          where: { id: roomId },
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

      return room;
    });

    return NextResponse.json({
      success: true,
      message: 'Room updated successfully',
      data: updatedRoom
    });

  } catch (error) {
    console.error('Error updating room:', error);
    
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

// DELETE /api/rooms/[id] - Delete a specific room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Check if user has owner or admin group
    if (!['owner', 'admin'].includes(decoded.groupName)) {
      return NextResponse.json(
        { error: 'Only owners and admins can delete rooms' },
        { status: 403 }
      );
    }

    const roomId = id;

    // Check if room exists and get hotel info
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        hotel: {
          select: {
            id: true,
            createdById: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      }
    });

    if (!existingRoom) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check if user owns the hotel or is admin/owner
    if (existingRoom.hotel.createdById !== decoded.userId && !['owner', 'admin'].includes(decoded.groupName)) {
      return NextResponse.json(
        { error: 'You can only delete rooms from your own hotels' },
        { status: 403 }
      );
    }

    // Check if room has any bookings
    if (existingRoom._count.bookings > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete room with existing bookings',
          details: `This room has ${existingRoom._count.bookings} booking(s). Please cancel all bookings before deleting the room.`
        },
        { status: 409 }
      );
    }

    // Delete the room (this will cascade delete related amenities, seasonal prices, and availability slots)
    await prisma.room.delete({
      where: { id: roomId }
    });

    return NextResponse.json({
      success: true,
      message: 'Room deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method is not allowed on this route
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use /api/rooms for creating new rooms.' },
    { status: 405 }
  );
}