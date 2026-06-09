import { Pipe, PipeTransform } from '@angular/core';

/**
 * Affiche un numéro de téléphone au format : 78 900 88 77 (XX XXX XX XX)
 */
@Pipe({
  name: 'phoneFormat',
  standalone: true
})
export class PhoneFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (value == null || value === '') return '-';
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '-';
    const d = digits.substring(0, 9);
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.substring(0, 2)} ${d.substring(2)}`;
    if (d.length <= 7) return `${d.substring(0, 2)} ${d.substring(2, 5)} ${d.substring(5)}`;
    return `${d.substring(0, 2)} ${d.substring(2, 5)} ${d.substring(5, 7)} ${d.substring(7, 9)}`;
  }
}
