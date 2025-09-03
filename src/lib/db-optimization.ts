import { PrismaClient } from '@prisma/client'

// Database connection pool configuration
const DB_POOL_CONFIG = {
  // Connection pool settings
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  
  // Query optimization settings
  queryTimeout: 30000,
  statementTimeout: 30000,
}

// Enhanced Prisma client with optimizations
export class OptimizedPrismaClient extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    })
    
    // Add query optimization middleware
    this.$use(async (params, next) => {
      const before = Date.now()
      const result = await next(params)
      const after = Date.now()
      
      // Log slow queries in development
      if (process.env.NODE_ENV === 'development' && (after - before) > 1000) {
        console.warn(`Slow query detected: ${params.model}.${params.action} took ${after - before}ms`)
      }
      
      return result
    })
  }
}

// Common query optimizations
export const QueryOptimizations = {
  // Optimized user queries with minimal data
  getUserBasic: {
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      isActive: true,
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  
  // Optimized hotel queries
  getHotelBasic: {
    select: {
      id: true,
      name: true,
      code: true,
      address: true,
      isActive: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  
  // Optimized room queries
  getRoomBasic: {
    select: {
      id: true,
      roomType: true,
      basePrice: true,
      capacity: true,
      isActive: true,
      status: true,
      hotel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  
  // Optimized booking queries
  getBookingBasic: {
    select: {
      id: true,
      resId: true,
      checkInDate: true,
      checkOutDate: true,
      totalAmount: true,
      status: true,
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      room: {
        select: {
          id: true,
          roomType: true,
          hotel: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
}

// Database performance monitoring
export class DatabaseMonitor {
  private static queryStats = new Map<string, { count: number; totalTime: number; avgTime: number }>()
  
  static recordQuery(operation: string, duration: number) {
    const stats = this.queryStats.get(operation) || { count: 0, totalTime: 0, avgTime: 0 }
    stats.count++
    stats.totalTime += duration
    stats.avgTime = stats.totalTime / stats.count
    this.queryStats.set(operation, stats)
  }
  
  static getStats() {
    return Object.fromEntries(this.queryStats)
  }
  
  static getSlowQueries(threshold: number = 1000) {
    return Object.fromEntries(
      Array.from(this.queryStats.entries()).filter(([_, stats]) => stats.avgTime > threshold)
    )
  }
}

// Batch operations for better performance
export class BatchOperations {
  static async batchCreateBookings(prisma: PrismaClient, bookings: any[]) {
    return prisma.$transaction(
      bookings.map(booking => prisma.booking.create({ data: booking }))
    )
  }
  
  static async batchUpdateRoomStatus(prisma: PrismaClient, updates: { id: string; status: any }[]) {
    return prisma.$transaction(
      updates.map(update => 
        prisma.room.update({
          where: { id: update.id },
          data: { status: update.status }
        })
      )
    )
  }
  
  static async batchCreatePayments(prisma: PrismaClient, payments: any[]) {
    return prisma.$transaction(
      payments.map(payment => prisma.payment.create({ data: payment }))
    )
  }
}

// Index suggestions for better query performance
export const IndexSuggestions = {
  // Composite indexes for common query patterns
  bookings: [
    'CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(check_in_date, check_out_date, status);',
    'CREATE INDEX IF NOT EXISTS idx_bookings_hotel_date ON bookings(hotel_id, check_in_date);',
    'CREATE INDEX IF NOT EXISTS idx_bookings_guest_status ON bookings(guest_id, status);',
  ],
  
  rooms: [
    'CREATE INDEX IF NOT EXISTS idx_rooms_hotel_type_status ON rooms(hotel_id, room_type, status);',
    'CREATE INDEX IF NOT EXISTS idx_rooms_price_capacity ON rooms(base_price, capacity);',
  ],
  
  users: [
    'CREATE INDEX IF NOT EXISTS idx_users_group_active ON users(group_id, is_active);',
    'CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);',
  ],
}