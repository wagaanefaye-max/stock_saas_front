import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/** Preset PrimeNG aligné sur la charte Stock SaaS (#2563EB) */
export const StockSaasPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#2563eb',
      600: '#1d4ed8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#172554',
      950: '#172554'
    }
  }
});
