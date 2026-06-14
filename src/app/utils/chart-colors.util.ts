/** Charte couleurs Stock SaaS — source unique pour graphiques et KPIs */

export const BRAND = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#16A34A',
  secondaryDark: '#15803D',
  warning: '#F59E0B',
  warningDark: '#D97706',
  danger: '#DC2626',
  dangerDark: '#B91C1C',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  bgMain: '#F9FAFB',
  white: '#FFFFFF'
} as const;

/** Palette multi-séries (uniquement couleurs charte + dérivés) */
export const CHART_PALETTE = [
  BRAND.primary,
  BRAND.secondary,
  BRAND.warning,
  BRAND.primaryDark,
  BRAND.secondaryDark,
  BRAND.warningDark
] as const;

/** Séries mouvements de stock */
export const MOVEMENT_SERIES = {
  entries: BRAND.primary,
  exits: BRAND.danger,
  transfers: BRAND.secondary,
  adjustments: BRAND.warning
} as const;

/** Statuts factures / abonnements */
export const STATUS_COLORS = {
  success: BRAND.secondary,
  warning: BRAND.warning,
  danger: BRAND.danger,
  primary: BRAND.primary,
  neutral: BRAND.textMuted
} as const;

export function chartFill(hex: string, alpha = 0.12): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function paletteColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

export function brandLineDataset(label: string, color: string, data: number[]) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: chartFill(color),
    tension: 0.3,
    fill: true
  };
}

export function brandMovementPointDataset(label: string, color: string, data: number[]) {
  return {
    label,
    data,
    fill: true,
    backgroundColor: chartFill(color),
    borderColor: color,
    borderWidth: 2,
    tension: 0.4,
    pointBackgroundColor: color,
    pointBorderColor: BRAND.white,
    pointBorderWidth: 2,
    pointRadius: 4
  };
}
