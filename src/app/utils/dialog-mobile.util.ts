/** Réglages communs pour modales PrimeNG (mobile-first) */

export const APP_DIALOG_BREAKPOINTS: Record<string, string> = {
  '1280px': '720px',
  '960px': '92vw',
  '640px': '96vw'
};

export const APP_DIALOG_SIZES = {
  sm: { width: '28rem', maxWidth: '96vw' },
  md: { width: '32rem', maxWidth: '96vw' },
  lg: { width: '38rem', maxWidth: '96vw' },
  xl: { width: '44rem', maxWidth: '96vw' },
  wide: { width: '50rem', maxWidth: '96vw', maxHeight: '90vh' },
  detail: { width: '90vw', maxWidth: '60rem' }
} as const;

/** Taille par défaut (formulaires standards) */
export const APP_DIALOG_STYLE = APP_DIALOG_SIZES.md;

export const APP_DIALOG_STYLE_SM = APP_DIALOG_SIZES.sm;
export const APP_DIALOG_STYLE_LG = APP_DIALOG_SIZES.lg;
export const APP_DIALOG_STYLE_XL = APP_DIALOG_SIZES.xl;
export const APP_DIALOG_STYLE_WIDE = APP_DIALOG_SIZES.wide;
export const APP_DIALOG_STYLE_DETAIL = APP_DIALOG_SIZES.detail;

export const APP_CONFIRM_BREAKPOINTS: Record<string, string> = {
  '640px': '96vw'
};

export const APP_CONFIRM_STYLE = {
  width: '26rem',
  maxWidth: '96vw'
};
