"use client";

import { useEffect, useState } from "react";

export function CacheDebugInfo() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Solo mostrar en desarrollo y auto-hide después de 30 segundos
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    setIsVisible(true);
    const hideTimer = setTimeout(() => setIsVisible(false), 30000);

    return () => clearTimeout(hideTimer);
  }, []);

  // Actualizar stats cada 10 segundos (menos frecuente para evitar loops)
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !isVisible) return;

    const updateStats = () => {
      try {
        // Obtener stats del store si está disponible
        let storeStats: any = null;
        if (typeof window !== "undefined" && window.localStorage) {
          const stored = localStorage.getItem("user-storage");
          if (stored) {
            const parsed = JSON.parse(stored);
            const state = parsed?.state;
            if (state?.cacheHits !== undefined) {
              const total = state.cacheHits + state.cacheMisses;
              storeStats = {
                hits: state.cacheHits || 0,
                misses: state.cacheMisses || 0,
                hitRatio:
                  total > 0 ? Math.round((state.cacheHits / total) * 100) : 0,
              };
            }
          }
        }

        setStats({
          storeStats,
          timestamp: new Date().toLocaleTimeString(),
          uptime: Math.floor(performance.now() / 1000) + "s", // Tiempo desde que se cargó la página
        });
      } catch (error) {
        console.error("Error getting cache stats:", error);
      }
    };

    // Actualizar inmediatamente y luego cada 10 segundos
    updateStats();
    const interval = setInterval(updateStats, 10000);

    return () => clearInterval(interval);
  }, [isVisible]); // Solo depende de isVisible

  // Keyboard shortcut
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === "c") {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (process.env.NODE_ENV !== "development" || !isVisible) {
    return null;
  }

  const hitRatio = stats?.storeStats?.hitRatio || 0;
  const isOptimized = hitRatio >= 80;

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg text-xs font-mono max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-green-400">🚀 CACHE STATUS</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="space-y-1">
        <div
          className={`font-bold ${isOptimized ? "text-green-400" : "text-red-400"}`}
        >
          Status: {isOptimized ? "✅ OPTIMIZED" : "⚠️ BUILDING CACHE"}
        </div>

        {stats?.storeStats ? (
          <>
            <div>
              Hit Ratio:{" "}
              <span className="text-yellow-400">
                {stats.storeStats.hitRatio}%
              </span>
            </div>
            <div>
              Cache Hits:{" "}
              <span className="text-green-400">{stats.storeStats.hits}</span>
            </div>
            <div>
              Cache Misses:{" "}
              <span className="text-red-400">{stats.storeStats.misses}</span>
            </div>
          </>
        ) : (
          <div className="text-gray-400">Cache building...</div>
        )}

        {stats && (
          <>
            <div>
              Uptime: <span className="text-gray-400">{stats.uptime}</span>
            </div>
            <div className="text-xs text-gray-500">
              Updated: {stats.timestamp}
            </div>
          </>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Ctrl+Alt+C to toggle • Auto-hide after 30s
      </div>
    </div>
  );
}

// Hook simplificado
export function useCacheOptimizationCheck() {
  return {
    checkOptimizations: () => {
      console.log("🔍 Checking cache optimizations...");

      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const stored = localStorage.getItem("user-storage");
          if (stored) {
            const parsed = JSON.parse(stored);
            const state = parsed?.state;
            if (state?.cacheHits !== undefined) {
              const total = state.cacheHits + state.cacheMisses;
              const hitRatio =
                total > 0 ? Math.round((state.cacheHits / total) * 100) : 0;

              if (hitRatio >= 80) {
                console.log(
                  "✅ OPTIMIZACIONES FUNCIONANDO - Hit ratio:",
                  hitRatio + "%"
                );
              } else {
                console.warn("⚠️ CACHE BUILDING - Hit ratio:", hitRatio + "%");
              }

              return { isOptimized: hitRatio >= 80, hitRatio };
            }
          }
        }

        console.warn("⚠️ No cache data available yet");
        return { isOptimized: false, hitRatio: 0 };
      } catch (error) {
        console.error("❌ Error checking optimizations:", error);
        return { isOptimized: false, hitRatio: 0 };
      }
    },
  };
}
