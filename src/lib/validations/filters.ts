import { z } from 'zod'

// Base filter validation schemas
export const textFilterSchema = z.object({
  value: z.string(),
  operator: z.enum(['contains', 'equals', 'startsWith', 'endsWith']).default('contains'),
})

export const numberFilterSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  operator: z.enum(['between', 'greaterThan', 'lessThan', 'equals']).default('between'),
})

export const dateFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  preset: z.enum(['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'custom']).optional(),
})

export const booleanFilterSchema = z.object({
  value: z.boolean(),
})

export const multiSelectFilterSchema = z.object({
  values: z.array(z.string()),
  operator: z.enum(['in', 'notIn']).default('in'),
})

// Hotel filters validation
export const hotelFiltersSchema = z.object({
  name: textFilterSchema.optional(),
  city: textFilterSchema.optional(),
  country: textFilterSchema.optional(),
  rating: numberFilterSchema.optional(),
  priceRange: numberFilterSchema.optional(),
  amenities: multiSelectFilterSchema.optional(),
  isActive: booleanFilterSchema.optional(),
  createdAt: dateFilterSchema.optional(),
  updatedAt: dateFilterSchema.optional(),
})

// Room filters validation
export const roomFiltersSchema = z.object({
  name: textFilterSchema.optional(),
  hotelId: z.string().optional(),
  type: textFilterSchema.optional(),
  capacity: numberFilterSchema.optional(),
  basePrice: numberFilterSchema.optional(),
  boardType: z.enum(['BB', 'HB', 'FB', 'AI']).optional(),
  amenities: multiSelectFilterSchema.optional(),
  isAvailable: booleanFilterSchema.optional(),
  createdAt: dateFilterSchema.optional(),
  updatedAt: dateFilterSchema.optional(),
})

// Booking filters validation
export const bookingFiltersSchema = z.object({
  guestName: textFilterSchema.optional(),
  guestEmail: textFilterSchema.optional(),
  hotelId: z.string().optional(),
  roomId: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  checkInDate: dateFilterSchema.optional(),
  checkOutDate: dateFilterSchema.optional(),
  totalAmount: numberFilterSchema.optional(),
  createdAt: dateFilterSchema.optional(),
  updatedAt: dateFilterSchema.optional(),
})

// Guest filters validation
export const guestFiltersSchema = z.object({
  firstName: textFilterSchema.optional(),
  lastName: textFilterSchema.optional(),
  email: textFilterSchema.optional(),
  phone: textFilterSchema.optional(),
  nationality: textFilterSchema.optional(),
  isVip: booleanFilterSchema.optional(),
  createdAt: dateFilterSchema.optional(),
  updatedAt: dateFilterSchema.optional(),
})

// Payment filters validation
export const paymentFiltersSchema = z.object({
  bookingId: z.string().optional(),
  amount: numberFilterSchema.optional(),
  method: z.enum(['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'ONLINE']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  transactionId: textFilterSchema.optional(),
  createdAt: dateFilterSchema.optional(),
  updatedAt: dateFilterSchema.optional(),
})

// User filters validation
export const userFiltersSchema = z.object({
  name: textFilterSchema.optional(),
  email: textFilterSchema.optional(),
  groupId: z.string().optional(),
  isActive: booleanFilterSchema.optional(),
  lastLogin: dateFilterSchema.optional(),
  createdAt: dateFilterSchema.optional(),
  updatedAt: dateFilterSchema.optional(),
})

// Saved filter validation
export const savedFilterSchema = z.object({
  name: z.string().min(1, 'Filter name is required').max(100, 'Filter name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  filterType: z.enum(['hotels', 'rooms', 'bookings', 'guests', 'payments', 'users']),
  filters: z.record(z.any()), // JSON object
  isPublic: z.boolean().default(false),
  isDefault: z.boolean().default(false),
})

// Filter search validation
export const filterSearchSchema = z.object({
  query: z.string().optional(),
  filterType: z.enum(['hotels', 'rooms', 'bookings', 'guests', 'payments', 'users']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Export validation
export const exportFiltersSchema = z.object({
  filterType: z.enum(['hotels', 'rooms', 'bookings', 'guests', 'payments', 'users']),
  filters: z.record(z.any()),
  format: z.enum(['csv', 'excel', 'pdf']).default('csv'),
  includeHeaders: z.boolean().default(true),
  fields: z.array(z.string()).optional(), // Specific fields to export
})

// Combined filter validation based on type
export const validateFiltersByType = (filterType: string, filters: any) => {
  switch (filterType) {
    case 'hotels':
      return hotelFiltersSchema.parse(filters)
    case 'rooms':
      return roomFiltersSchema.parse(filters)
    case 'bookings':
      return bookingFiltersSchema.parse(filters)
    case 'guests':
      return guestFiltersSchema.parse(filters)
    case 'payments':
      return paymentFiltersSchema.parse(filters)
    case 'users':
      return userFiltersSchema.parse(filters)
    default:
      throw new Error(`Unknown filter type: ${filterType}`)
  }
}
