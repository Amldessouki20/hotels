import { NextRequest, NextResponse } from 'next/server'

// Cache configuration
const CACHE_DURATION = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
}

// In-memory cache store (use Redis in production)
const cacheStore = new Map<string, { data: any; expiry: number }>()

/**
 * Generate cache key from request
 */
export function generateCacheKey(request: NextRequest, additionalKeys: string[] = []): string {
  const url = new URL(request.url)
  const baseKey = `${request.method}:${url.pathname}${url.search}`
  return additionalKeys.length > 0 ? `${baseKey}:${additionalKeys.join(':')}` : baseKey
}

/**
 * Get data from cache
 */
export function getFromCache<T>(key: string): T | null {
  const cached = cacheStore.get(key)
  
  if (!cached) {
    return null
  }
  
  if (Date.now() > cached.expiry) {
    cacheStore.delete(key)
    return null
  }
  
  return cached.data as T
}

/**
 * Set data in cache
 */
export function setInCache(key: string, data: any, duration: number = CACHE_DURATION.MEDIUM): void {
  const expiry = Date.now() + (duration * 1000)
  cacheStore.set(key, { data, expiry })
}

/**
 * Clear cache by pattern
 */
export function clearCacheByPattern(pattern: string): void {
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key)
    }
  }
}

/**
 * Cache response middleware
 */
export function withCache(duration: number = CACHE_DURATION.MEDIUM) {
  return function cacheMiddleware(handler: Function) {
    return async function cachedHandler(request: NextRequest, context: any) {
      const cacheKey = generateCacheKey(request)
      
      // Try to get from cache first
      const cached = getFromCache(cacheKey)
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': `public, max-age=${duration}`,
          },
        })
      }
      
      // Execute handler
      const response = await handler(request, context)
      
      // Cache successful responses
      if (response.status === 200) {
        const data = await response.json()
        setInCache(cacheKey, data, duration)
        
        return NextResponse.json(data, {
          headers: {
            'X-Cache': 'MISS',
            'Cache-Control': `public, max-age=${duration}`,
          },
        })
      }
      
      return response
    }
  }
}

/**
 * Clean up expired cache entries
 */
function cleanupCache() {
  const now = Date.now()
  for (const [key, value] of cacheStore.entries()) {
    if (now > value.expiry) {
      cacheStore.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000)

export { CACHE_DURATION }