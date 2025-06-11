import { getUserStoreSnapshot, isStoreAvailable } from "@/store/userStore";

// Tipos para métricas de performance
interface PerformanceMetrics {
  cacheHitRatio: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  lastUpdated: string;
  avgResponseTime?: number;
  uptime: string;
}

interface RequestLog {
  timestamp: number;
  source: "zustand" | "api" | "middleware" | "provider";
  userId?: string;
  success: boolean;
  responseTime?: number;
}

class PerformanceMonitor {
  private requestLogs: RequestLog[] = [];
  private startTime: number = Date.now();
  private maxLogSize = 1000; // Mantener últimos 1000 requests

  // Log de request con fuente y tiempo
  logRequest(
    source: RequestLog["source"],
    userId?: string,
    success = true,
    responseTime?: number
  ) {
    const log: RequestLog = {
      timestamp: Date.now(),
      source,
      userId,
      success,
      responseTime,
    };

    this.requestLogs.push(log);

    // Mantener solo los últimos N logs para evitar memory leaks
    if (this.requestLogs.length > this.maxLogSize) {
      this.requestLogs = this.requestLogs.slice(-this.maxLogSize);
    }

    // Log en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[PERF-MONITOR] ${source.toUpperCase()} request - Success: ${success}${responseTime ? `, Time: ${responseTime}ms` : ""}`
      );
    }
  }

  // Obtener métricas actuales
  getMetrics(): PerformanceMetrics {
    const now = Date.now();
    const uptime = Math.floor((now - this.startTime) / 1000); // segundos

    // Calcular métricas de requests
    const totalRequests = this.requestLogs.length;
    const successfulRequests = this.requestLogs.filter(
      (log) => log.success
    ).length;

    // Métricas de cache desde Zustand store
    let cacheHits = 0;
    let cacheMisses = 0;
    let cacheHitRatio = 0;

    if (isStoreAvailable()) {
      try {
        const store = getUserStoreSnapshot();
        const stats = store.getCacheStats();
        cacheHits = stats.hits;
        cacheMisses = stats.misses;
        cacheHitRatio = stats.hitRatio;
      } catch (error) {
        console.warn("[PERF-MONITOR] Error accessing store stats:", error);
      }
    }

    // Calcular tiempo promedio de respuesta
    const requestsWithTime = this.requestLogs.filter((log) => log.responseTime);
    const avgResponseTime =
      requestsWithTime.length > 0
        ? requestsWithTime.reduce((sum, log) => sum + log.responseTime!, 0) /
          requestsWithTime.length
        : undefined;

    return {
      cacheHitRatio,
      totalRequests: cacheHits + cacheMisses,
      cacheHits,
      cacheMisses,
      lastUpdated: new Date().toISOString(),
      avgResponseTime: avgResponseTime
        ? Math.round(avgResponseTime * 100) / 100
        : undefined,
      uptime: this.formatUptime(uptime),
    };
  }

  // Generar reporte de performance
  generateReport(): string {
    const metrics = this.getMetrics();
    const lines = [
      "🚀 QUANTUM CRM - REPORTE DE OPTIMIZACIÓN",
      "==========================================",
      "",
      "📊 MÉTRICAS DE CACHE:",
      `   Cache Hit Ratio: ${metrics.cacheHitRatio}%`,
      `   Total Cache Requests: ${metrics.totalRequests}`,
      `   Cache Hits: ${metrics.cacheHits}`,
      `   Cache Misses: ${metrics.cacheMisses}`,
      "",
      "⚡ PERFORMANCE:",
      `   Tiempo Promedio: ${metrics.avgResponseTime ? `${metrics.avgResponseTime}ms` : "N/A"}`,
      `   Uptime: ${metrics.uptime}`,
      "",
      "🎯 REQUESTS POR FUENTE (últimos " +
        Math.min(this.requestLogs.length, this.maxLogSize) +
        "):",
    ];

    // Agrupar requests por fuente
    const requestsBySource = this.requestLogs.reduce(
      (acc, log) => {
        acc[log.source] = (acc[log.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.entries(requestsBySource).forEach(([source, count]) => {
      const percentage = ((count / this.requestLogs.length) * 100).toFixed(1);
      lines.push(`   ${source.toUpperCase()}: ${count} (${percentage}%)`);
    });

    // Estimación de reducción
    if (metrics.cacheHitRatio > 0) {
      const estimatedReduction = Math.round(metrics.cacheHitRatio);
      lines.push("");
      lines.push("📈 IMPACTO ESTIMADO:");
      lines.push(`   Reducción de requests: ~${estimatedReduction}%`);
      lines.push(
        `   Requests evitados: ${metrics.cacheHits} de ${metrics.totalRequests}`
      );
    }

    lines.push("");
    lines.push(`Generado: ${new Date().toLocaleString()}`);

    return lines.join("\n");
  }

  // Resetear estadísticas
  reset() {
    this.requestLogs = [];
    this.startTime = Date.now();

    // También resetear stats del store si está disponible
    if (isStoreAvailable()) {
      try {
        const store = getUserStoreSnapshot();
        store.clearUser(); // Esto resetea también las stats
      } catch (error) {
        console.warn("[PERF-MONITOR] Error resetting store stats:", error);
      }
    }

    console.log("[PERF-MONITOR] 🔄 Estadísticas reseteadas");
  }

  // Formatear tiempo de uptime
  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // Validar si las optimizaciones están funcionando
  validateOptimizations(): { isOptimized: boolean; issues: string[] } {
    const metrics = this.getMetrics();
    const issues: string[] = [];

    // Validar hit ratio mínimo
    if (metrics.cacheHitRatio < 80) {
      issues.push(
        `Cache hit ratio bajo: ${metrics.cacheHitRatio}% (objetivo: >80%)`
      );
    }

    // Validar que hay requests siendo procesados
    if (metrics.totalRequests === 0) {
      issues.push("No hay requests de cache registrados");
    }

    // Validar tiempo de respuesta promedio
    if (metrics.avgResponseTime && metrics.avgResponseTime > 500) {
      issues.push(
        `Tiempo de respuesta alto: ${metrics.avgResponseTime}ms (objetivo: <500ms)`
      );
    }

    return {
      isOptimized: issues.length === 0,
      issues,
    };
  }
}

// Instancia singleton para monitoreo global
export const performanceMonitor = new PerformanceMonitor();

// Hook para usar en componentes React
export function usePerformanceMonitor() {
  return {
    logRequest: performanceMonitor.logRequest.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
    reset: performanceMonitor.reset.bind(performanceMonitor),
    validateOptimizations:
      performanceMonitor.validateOptimizations.bind(performanceMonitor),
  };
}

// Función utilitaria para logging rápido
export function logCacheRequest(
  source: "zustand" | "api" | "middleware" | "provider",
  userId?: string
) {
  performanceMonitor.logRequest(source, userId, true);
}

// Auto-log de estadísticas cada 5 minutos en desarrollo
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  setInterval(
    () => {
      const report = performanceMonitor.generateReport();
      console.log("\n" + report + "\n");
    },
    5 * 60 * 1000
  ); // 5 minutos
}
