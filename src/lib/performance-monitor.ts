// Performance monitoring and analytics

/**
 * Core Web Vitals monitoring
 */
export class WebVitalsMonitor {
  private static vitals: Record<string, number> = {}
  
  static init() {
    if (typeof window === 'undefined') return
    
    // Monitor Largest Contentful Paint (LCP)
    this.observeLCP()
    
    // Monitor First Input Delay (FID)
    this.observeFID()
    
    // Monitor Cumulative Layout Shift (CLS)
    this.observeCLS()
    
    // Monitor Time to First Byte (TTFB)
    this.observeTTFB()
  }
  
  private static observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        this.vitals.LCP = lastEntry.startTime
        this.reportVital('LCP', lastEntry.startTime)
      })
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    }
  }
  
  private static observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.vitals.FID = entry.processingStart - entry.startTime
          this.reportVital('FID', entry.processingStart - entry.startTime)
        })
      })
      
      observer.observe({ entryTypes: ['first-input'] })
    }
  }
  
  private static observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            this.vitals.CLS = clsValue
            this.reportVital('CLS', clsValue)
          }
        })
      })
      
      observer.observe({ entryTypes: ['layout-shift'] })
    }
  }
  
  private static observeTTFB() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as any
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.fetchStart
        this.vitals.TTFB = ttfb
        this.reportVital('TTFB', ttfb)
      }
    }
  }
  
  private static reportVital(name: string, value: number) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name}: ${value.toFixed(2)}ms`)
    }
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(name, value)
    }
  }
  
  private static sendToAnalytics(metric: string, value: number) {
    // Send to your analytics service
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric, value, timestamp: Date.now() })
    }).catch(console.error)
  }
  
  static getVitals() {
    return { ...this.vitals }
  }
}

/**
 * API Performance monitoring
 */
export class APIMonitor {
  private static requests = new Map<string, { count: number; totalTime: number; errors: number }>()
  
  static trackRequest(url: string, duration: number, success: boolean) {
    const stats = this.requests.get(url) || { count: 0, totalTime: 0, errors: 0 }
    
    stats.count++
    stats.totalTime += duration
    if (!success) stats.errors++
    
    this.requests.set(url, stats)
  }
  
  static getStats() {
    const result: Record<string, any> = {}
    
    for (const [url, stats] of this.requests) {
      result[url] = {
        ...stats,
        avgTime: stats.totalTime / stats.count,
        errorRate: (stats.errors / stats.count) * 100
      }
    }
    
    return result
  }
  
  static getSlowestAPIs(limit: number = 5) {
    const stats = this.getStats()
    return Object.entries(stats)
      .sort(([, a], [, b]) => b.avgTime - a.avgTime)
      .slice(0, limit)
  }
  
  static getErrorProneAPIs(limit: number = 5) {
    const stats = this.getStats()
    return Object.entries(stats)
      .filter(([, stat]) => stat.errorRate > 0)
      .sort(([, a], [, b]) => b.errorRate - a.errorRate)
      .slice(0, limit)
  }
}

/**
 * Resource loading monitor
 */
export class ResourceMonitor {
  private static resources: any[] = []
  
  static init() {
    if (typeof window === 'undefined') return
    
    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.resources.push({
            name: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize || 0,
            duration: entry.duration,
            startTime: entry.startTime
          })
        })
      })
      
      observer.observe({ entryTypes: ['resource'] })
    }
  }
  
  static getLargestResources(limit: number = 10) {
    return this.resources
      .sort((a, b) => b.size - a.size)
      .slice(0, limit)
  }
  
  static getSlowestResources(limit: number = 10) {
    return this.resources
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }
  
  static getResourcesByType() {
    const byType: Record<string, any[]> = {}
    
    this.resources.forEach(resource => {
      if (!byType[resource.type]) {
        byType[resource.type] = []
      }
      byType[resource.type].push(resource)
    })
    
    return byType
  }
  
  static getTotalResourceSize() {
    return this.resources.reduce((total, resource) => total + resource.size, 0)
  }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
  private static measurements: any[] = []
  
  static init() {
    if (typeof window === 'undefined') return
    
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.measureMemory()
    }, 30000)
    
    // Initial measurement
    this.measureMemory()
  }
  
  private static measureMemory() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.measurements.push({
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      })
      
      // Keep only last 100 measurements
      if (this.measurements.length > 100) {
        this.measurements.shift()
      }
    }
  }
  
  static getCurrentMemory() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
      }
    }
    return null
  }
  
  static getMemoryTrend() {
    return this.measurements.map(m => ({
      timestamp: m.timestamp,
      used: Math.round(m.usedJSHeapSize / 1024 / 1024)
    }))
  }
}

/**
 * Performance dashboard data
 */
export class PerformanceDashboard {
  static async getFullReport() {
    return {
      webVitals: WebVitalsMonitor.getVitals(),
      apiStats: APIMonitor.getStats(),
      slowestAPIs: APIMonitor.getSlowestAPIs(),
      errorProneAPIs: APIMonitor.getErrorProneAPIs(),
      largestResources: ResourceMonitor.getLargestResources(),
      slowestResources: ResourceMonitor.getSlowestResources(),
      resourcesByType: ResourceMonitor.getResourcesByType(),
      totalResourceSize: ResourceMonitor.getTotalResourceSize(),
      currentMemory: MemoryMonitor.getCurrentMemory(),
      memoryTrend: MemoryMonitor.getMemoryTrend(),
      timestamp: new Date().toISOString()
    }
  }
  
  static async exportReport() {
    const report = await this.getFullReport()
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// Initialize all monitors
export function initializePerformanceMonitoring() {
  WebVitalsMonitor.init()
  ResourceMonitor.init()
  MemoryMonitor.init()
}