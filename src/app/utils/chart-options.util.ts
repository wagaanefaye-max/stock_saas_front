/** Options Chart.js adaptées mobile / desktop */

import { BRAND } from './chart-colors.util';

const MOBILE_BREAKPOINT = 768;

export function isChartMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

/** Abrège les grands nombres sur l'axe Y (mobile) */
export function compactAxisTick(value: number | string): string {
  const n = Number(value);
  if (Number.isNaN(n)) {
    return String(value);
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 10_000) {
    return `${Math.round(n / 1000)}k`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}k`;
  }
  return String(n);
}

export interface LineChartConfig {
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom';
  beginAtZero?: boolean;
  /** Format des ticks Y ; par défaut compact sur mobile */
  yTickCallback?: (value: number | string) => string;
}

export function buildLineChartOptions(config: LineChartConfig = {}): Record<string, unknown> {
  const mobile = isChartMobile();
  const showLegend = config.showLegend ?? true;
  const legendPosition = mobile ? 'bottom' : (config.legendPosition ?? 'bottom');
  const beginAtZero = config.beginAtZero ?? true;

  const defaultYTick = (value: number | string) =>
    mobile ? compactAxisTick(value) : String(value);

  const yTickCallback = config.yTickCallback ?? defaultYTick;

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: showLegend,
        position: legendPosition,
        labels: {
          color: BRAND.textMuted,
          boxWidth: mobile ? 8 : 12,
          padding: mobile ? 6 : 12,
          font: { size: mobile ? 9 : 11 },
          usePointStyle: true
        }
      },
      tooltip: {
        padding: mobile ? 8 : 12,
        titleFont: { size: mobile ? 11 : 13 },
        bodyFont: { size: mobile ? 10 : 12 },
        boxPadding: mobile ? 4 : 6
      }
    },
    elements: {
      point: {
        radius: mobile ? 2 : 4,
        hoverRadius: mobile ? 5 : 7,
        hitRadius: mobile ? 12 : 8
      },
      line: {
        borderWidth: mobile ? 2 : 3
      }
    },
    scales: {
      x: {
        ticks: {
          color: BRAND.textMuted,
          font: { size: mobile ? 9 : 11 },
          maxRotation: mobile ? 0 : 45,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: mobile ? 6 : 12
        },
        grid: {
          display: !mobile,
          color: 'rgba(100, 116, 139, 0.1)'
        }
      },
      y: {
        beginAtZero,
        ticks: {
          color: BRAND.textMuted,
          font: { size: mobile ? 9 : 11 },
          maxTicksLimit: mobile ? 5 : 8,
          callback: yTickCallback
        },
        grid: { color: 'rgba(100, 116, 139, 0.12)' }
      }
    }
  };
}

export interface BarChartConfig {
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom';
  beginAtZero?: boolean;
}

export function buildBarChartOptions(config: BarChartConfig = {}): Record<string, unknown> {
  const mobile = isChartMobile();
  const showLegend = config.showLegend ?? true;
  const legendPosition = mobile ? 'bottom' : (config.legendPosition ?? 'top');
  const beginAtZero = config.beginAtZero ?? true;

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: showLegend,
        position: legendPosition,
        labels: {
          color: BRAND.textMuted,
          boxWidth: mobile ? 8 : 12,
          padding: mobile ? 6 : 12,
          font: { size: mobile ? 9 : 11 },
          usePointStyle: true
        }
      },
      tooltip: {
        padding: mobile ? 8 : 12,
        titleFont: { size: mobile ? 11 : 13 },
        bodyFont: { size: mobile ? 10 : 12 },
        boxPadding: mobile ? 4 : 6
      }
    },
    scales: {
      x: {
        ticks: {
          color: BRAND.textMuted,
          font: { size: mobile ? 9 : 11 },
          maxRotation: mobile ? 0 : 0,
          autoSkip: true,
          maxTicksLimit: mobile ? 6 : 12
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero,
        ticks: {
          color: BRAND.textMuted,
          font: { size: mobile ? 9 : 11 },
          maxTicksLimit: mobile ? 5 : 8,
          stepSize: 1,
          callback: (value: number | string) => {
            const n = Number(value);
            return Number.isInteger(n) ? String(n) : '';
          }
        },
        grid: { color: 'rgba(100, 116, 139, 0.12)' }
      }
    }
  };
}

export function buildDoughnutChartOptions(
  extraPlugins?: Record<string, unknown>
): Record<string, unknown> {
  const mobile = isChartMobile();

  const plugins: Record<string, unknown> = {
    legend: {
      position: 'bottom',
      labels: {
        color: BRAND.textMuted,
        boxWidth: mobile ? 8 : 12,
        padding: mobile ? 8 : 14,
        font: { size: mobile ? 9 : 11 },
        usePointStyle: true
      }
    },
    tooltip: {
      padding: mobile ? 8 : 10,
      titleFont: { size: mobile ? 11 : 12 },
      bodyFont: { size: mobile ? 10 : 11 }
    },
    ...extraPlugins
  };

  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: mobile ? '62%' : '55%',
    plugins
  };
}

/** Fusionne des options Chart.js (niveau racine + plugins) */
export function mergeChartOptions(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...base, ...patch };
  if (base['plugins'] && patch['plugins']) {
    merged['plugins'] = {
      ...(base['plugins'] as object),
      ...(patch['plugins'] as object)
    };
  }
  return merged;
}
