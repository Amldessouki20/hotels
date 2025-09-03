// Base filter types
export interface TextFilter {
  value: string
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith'
}

export interface NumberFilter {
  min?: number
  max?: number
  operator: 'between' | 'greaterThan' | 'lessThan' | 'equals'
}

export interface DateFilter {
  startDate?: string
  endDate?: string
  preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom'
}

export interface BooleanFilter {
  value: boolean
}

export interface MultiSelectFilter {
  values: string[]
  operator: 'in' | 'notIn'
}

// Entity-specific filter types
export interface HotelFilters {
  name?: TextFilter
  city?: TextFilter
  country?: TextFilter
  rating?: NumberFilter
  priceRange?: NumberFilter
  amenities?: MultiSelectFilter
  isActive?: BooleanFilter
  createdAt?: DateFilter
  updatedAt?: DateFilter
}

export interface RoomFilters {
  name?: TextFilter
  hotelId?: string
  type?: TextFilter
  capacity?: NumberFilter
  basePrice?: NumberFilter
  boardType?: 'BB' | 'HB' | 'FB' | 'AI'
  amenities?: MultiSelectFilter
  isAvailable?: BooleanFilter
  createdAt?: DateFilter
  updatedAt?: DateFilter
}

export interface BookingFilters {
  guestName?: TextFilter
  guestEmail?: TextFilter
  hotelId?: string
  roomId?: string
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  checkInDate?: DateFilter
  checkOutDate?: DateFilter
  totalAmount?: NumberFilter
  createdAt?: DateFilter
  updatedAt?: DateFilter
}

export interface GuestFilters {
  firstName?: TextFilter
  lastName?: TextFilter
  email?: TextFilter
  phone?: TextFilter
  nationality?: TextFilter
  isVip?: BooleanFilter
  createdAt?: DateFilter
  updatedAt?: DateFilter
}

export interface PaymentFilters {
  bookingId?: string
  amount?: NumberFilter
  method?: 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'ONLINE'
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  transactionId?: TextFilter
  createdAt?: DateFilter
  updatedAt?: DateFilter
}

export interface UserFilters {
  name?: TextFilter
  email?: TextFilter
  groupId?: string
  isActive?: BooleanFilter
  lastLogin?: DateFilter
  createdAt?: DateFilter
  updatedAt?: DateFilter
}

// Union type for all filters
export type EntityFilters = HotelFilters | RoomFilters | BookingFilters | GuestFilters | PaymentFilters | UserFilters

// Filter context types
export interface FilterState {
  filters: Record<string, any>
  isLoading: boolean
  results: any[]
  totalCount: number
  page: number
  limit: number
  sortBy?: string
  sortOrder: 'asc' | 'desc'
}

export interface FilterActions {
  setFilter: (key: string, value: any) => void
  removeFilter: (key: string) => void
  clearFilters: () => void
  applyFilters: () => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void
}

// Saved filter types
export interface SavedFilter {
  id: string
  name: string
  description?: string
  filterType: 'hotels' | 'rooms' | 'bookings' | 'guests' | 'payments' | 'users'
  filters: Record<string, any>
  isPublic: boolean
  isDefault: boolean
  createdById: string
  createdAt: string
  updatedAt: string
}

// Filter preset types
export interface FilterPreset {
  id: string
  name: string
  description?: string
  filterType: string
  filters: Record<string, any>
  isSystem: boolean
}

// Export types
export interface ExportOptions {
  filterType: string
  filters: Record<string, any>
  format: 'csv' | 'excel' | 'pdf'
  includeHeaders: boolean
  fields?: string[]
}

// Search types
export interface FilterSearchParams {
  query?: string
  filterType?: string
  page: number
  limit: number
  sortBy?: string
  sortOrder: 'asc' | 'desc'
}

// Component props types
export interface FilterComponentProps {
  value?: any
  onChange: (value: any) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export interface DateRangePickerProps extends FilterComponentProps {
  presets?: Array<{
    label: string
    value: string
  }>
}

export interface MultiSelectProps extends FilterComponentProps {
  options: Array<{
    label: string
    value: string
  }>
  searchable?: boolean
  maxSelected?: number
}

// Filter statistics
export interface FilterStats {
  totalResults: number
  filteredResults: number
  appliedFilters: number
  executionTime: number
}
