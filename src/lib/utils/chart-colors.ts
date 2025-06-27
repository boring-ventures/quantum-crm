import { useTheme } from "next-themes";
import { useMemo } from "react";

// Paleta de colores base compatible con shadcn/ui
const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  // Colores específicos para charts usando CSS válidas de Tailwind
  blue: "hsl(221, 83%, 53%)", // blue-600
  green: "hsl(142, 76%, 36%)", // green-600
  red: "hsl(0, 84%, 60%)", // red-500
  orange: "hsl(25, 95%, 53%)", // orange-500
  purple: "hsl(271, 81%, 56%)", // purple-500
  yellow: "hsl(45, 93%, 47%)", // yellow-500
  pink: "hsl(330, 81%, 60%)", // pink-500
  indigo: "hsl(239, 84%, 67%)", // indigo-500
  cyan: "hsl(189, 94%, 43%)", // cyan-500
  teal: "hsl(173, 80%, 40%)", // teal-600
  lime: "hsl(84, 81%, 44%)", // lime-500
  emerald: "hsl(160, 84%, 39%)", // emerald-600
};

// Colores específicos para dark theme
const DARK_CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  blue: "hsl(213, 93%, 68%)", // blue-400
  green: "hsl(142, 69%, 58%)", // green-400
  red: "hsl(0, 93%, 71%)", // red-400
  orange: "hsl(34, 100%, 69%)", // orange-400
  purple: "hsl(271, 91%, 71%)", // purple-400
  yellow: "hsl(54, 92%, 68%)", // yellow-400
  pink: "hsl(330, 85%, 74%)", // pink-400
  indigo: "hsl(238, 83%, 77%)", // indigo-400
  cyan: "hsl(188, 85%, 67%)", // cyan-400
  teal: "hsl(173, 58%, 59%)", // teal-400
  lime: "hsl(82, 69%, 68%)", // lime-400
  emerald: "hsl(161, 79%, 63%)", // emerald-400
};

// Array de colores para rotación automática
const COLOR_ROTATION = [
  "blue",
  "green",
  "orange",
  "purple",
  "red",
  "yellow",
  "pink",
  "indigo",
  "cyan",
  "teal",
  "lime",
  "emerald",
] as const;

export type ChartColorKey = keyof typeof CHART_COLORS;

export function useChartColors() {
  const { theme, systemTheme } = useTheme();

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const colors = useMemo(() => {
    return isDark ? DARK_CHART_COLORS : CHART_COLORS;
  }, [isDark]);

  const getColor = (key: ChartColorKey): string => {
    return colors[key];
  };

  const getColors = (keys: ChartColorKey[]): string[] => {
    return keys.map((key) => colors[key]);
  };

  const getRotatingColors = (count: number): string[] => {
    return Array.from({ length: count }, (_, index) => {
      const colorKey = COLOR_ROTATION[index % COLOR_ROTATION.length];
      return colors[colorKey];
    });
  };

  const getQualificationColors = () => ({
    goodLeads: colors.green,
    badLeads: colors.red,
    notQualified: colors.orange,
  });

  const getChartAxisColors = () => ({
    grid: "hsl(var(--border))",
    text: "hsl(var(--muted-foreground))",
    background: "hsl(var(--background))",
  });

  return {
    colors,
    getColor,
    getColors,
    getRotatingColors,
    getQualificationColors,
    getChartAxisColors,
    isDark,
  };
}

// Hook para generar colores consistentes para datasets específicos
export function useSourceColors(
  sources: Array<{ sourceId: string; name: string }>
) {
  const { getRotatingColors } = useChartColors();

  return useMemo(() => {
    const colors = getRotatingColors(sources.length);
    const colorMap = new Map<string, string>();

    sources.forEach((source, index) => {
      colorMap.set(source.sourceId, colors[index]);
    });

    return colorMap;
  }, [sources, getRotatingColors]);
}

// Utilidad para obtener colores de gradiente
export function getGradientColors(baseColor: string, isDark: boolean) {
  // Esta función podría expandirse para crear gradientes automáticos
  return {
    from: baseColor,
    to: isDark
      ? baseColor.replace(/\d+%\)$/, "30%)")
      : baseColor.replace(/\d+%\)$/, "80%)"),
  };
}
