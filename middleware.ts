import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET || 'fallback-secret-key')

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // Max requests per window
const API_RATE_LIMIT_MAX_REQUESTS = 50 // Stricter limit for API routes

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting function
function checkRateLimit(ip: string, isApiRoute: boolean = false): boolean {
  const now = Date.now()
  const maxRequests = isApiRoute ? API_RATE_LIMIT_MAX_REQUESTS : RATE_LIMIT_MAX_REQUESTS
  
  const record = rateLimitStore.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}, RATE_LIMIT_WINDOW)

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/hotels',
  '/bookings',
  '/guests',
  '/payments',
  '/reports',
  '/users',
  '/settings',
]

// API routes that require authentication
const protectedApiRoutes = [
  '/api/hotels',
  '/api/bookings',
  '/api/guests',
  '/api/payments',
  '/api/reports',
  '/api/users',
  '/api/filters',
]

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') || 
    request.headers.get('x-real-ip') || 
    request.headers.get('cf-connecting-ip') || 
    'unknown'
  
  // Apply rate limiting
  const isApiRoute = pathname.startsWith('/api/')
  if (!checkRateLimit(ip, isApiRoute)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { 
        status: 429, 
        headers: { 
          'content-type': 'application/json',
          'Retry-After': '60'
        } 
      }
    )
  }
  
  // Add security headers
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check if route requires authentication
  const requiresAuth = protectedRoutes.some(route => pathname.startsWith(route)) ||
                      protectedApiRoutes.some(route => pathname.startsWith(route))
  
  if (!requiresAuth) {
    return NextResponse.next()
  }
  
  // Get token from cookie or Authorization header
  const token = request.cookies.get('token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    // Redirect to login for page routes
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Return 401 for API routes
    return new NextResponse(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    )
  }
  
  try {
    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    // Add user info to request headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId as string)
    requestHeaders.set('x-user-group-id', payload.groupId as string)
    requestHeaders.set('x-user-group-name', payload.groupName as string)
    
    // Check group-based permissions for sensitive operations
    const groupName = payload.groupName as string
    
    // Admin-only routes
    if (pathname.startsWith('/api/users') || pathname.startsWith('/users')) {
      const isAdmin = groupName?.toLowerCase().includes('admin')
      
      if (!isAdmin) {
        if (pathname.startsWith('/api/')) {
          return new NextResponse(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { 'content-type': 'application/json' } }
          )
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    
    // Manager and Admin access for filters
    if (pathname.startsWith('/api/filters') || pathname.startsWith('/settings/filters')) {
      const hasFilterAccess = groupName?.toLowerCase().includes('admin') || 
                             groupName?.toLowerCase().includes('manager')
      
      if (!hasFilterAccess) {
        if (pathname.startsWith('/api/')) {
          return new NextResponse(
            JSON.stringify({ error: 'Manager or Admin access required' }),
            { status: 403, headers: { 'content-type': 'application/json' } }
          )
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    
  } catch (error) {
    console.error('JWT verification failed:', error)
    
    // Clear invalid token
    const response = pathname.startsWith('/api/') 
      ? new NextResponse(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        )
      : NextResponse.redirect(new URL('/login', request.url))
    
    response.cookies.delete('token')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
