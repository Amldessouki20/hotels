// Bundle optimization utilities

/**
 * Dynamic imports for code splitting
 */
export const DynamicImports = {
  // Lazy load utility libraries (only existing ones)
  Charts: () => import('recharts'),
  
  // Example dynamic imports - replace with actual component paths when they exist
  // BookingForm: () => import('../components/booking/BookingForm'),
  // HotelManagement: () => import('../components/hotel/HotelManagement'),
  // RoomManagement: () => import('../components/room/RoomManagement'),
  // UserManagement: () => import('../components/user/UserManagement'),
  // ReportsModule: () => import('../components/reports/ReportsModule'),
  // DatePicker: () => import('react-datepicker'),
  // PDFGenerator: () => import('jspdf'),
  // ExcelExporter: () => import('xlsx'),
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  // Preload critical fonts
  const fontLink = document.createElement('link')
  fontLink.rel = 'preload'
  fontLink.href = '/fonts/Tajawal-Regular.woff2'
  fontLink.as = 'font'
  fontLink.type = 'font/woff2'
  fontLink.crossOrigin = 'anonymous'
  document.head.appendChild(fontLink)
  
  // Preload critical images
  const criticalImages = [
    '/images/logo.svg',
    '/images/default-hotel.jpg',
    '/images/default-room.jpg'
  ]
  
  criticalImages.forEach(src => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = src
    link.as = 'image'
    document.head.appendChild(link)
  })
}

/**
 * Lazy loading utilities
 */
export class LazyLoader {
  private static observer: IntersectionObserver | null = null
  
  static init() {
    if (typeof window === 'undefined' || this.observer) return
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src
            if (src) {
              img.src = src
              img.classList.remove('lazy')
              this.observer?.unobserve(img)
            }
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    )
  }
  
  static observe(element: HTMLElement) {
    if (this.observer) {
      this.observer.observe(element)
    }
  }
  
  static disconnect() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

/**
 * Resource compression utilities
 */
export class ResourceCompressor {
  // Compress images on client side before upload
  static async compressImage(file: File, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 1920
        const maxHeight = 1080
        let { width, height } = img
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        }, 'image/jpeg', quality)
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }
  
  // Compress JSON data
  static compressJSON(data: any): string {
    return JSON.stringify(data, null, 0)
  }
  
  // Decompress JSON data
  static decompressJSON(compressed: string): any {
    return JSON.parse(compressed)
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>()
  
  static startMeasure(name: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      const existing = this.metrics.get(name) || []
      existing.push(duration)
      this.metrics.set(name, existing)
      
      // Keep only last 100 measurements
      if (existing.length > 100) {
        existing.shift()
      }
    }
  }
  
  static getMetrics() {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {}
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      }
    })
    
    return result
  }
  
  static clearMetrics() {
    this.metrics.clear()
  }
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static maxCacheSize = 100
  private static maxAge = 5 * 60 * 1000 // 5 minutes
  
  static set(key: string, data: any) {
    // Clean old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanup()
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  static get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  static cleanup() {
    const now = Date.now()
    const toDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.maxAge) {
        toDelete.push(key)
      }
    })
    
    toDelete.forEach(key => this.cache.delete(key))
    
    // If still too many, remove oldest entries
    if (this.cache.size >= this.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, entries.length - this.maxCacheSize + 10)
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }
  
  static clear() {
    this.cache.clear()
  }
  
  static getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      maxAge: this.maxAge
    }
  }
}