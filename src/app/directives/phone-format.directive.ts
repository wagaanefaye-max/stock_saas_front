import { Directive, ElementRef, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appPhoneFormat]',
  standalone: true
})
export class PhoneFormatDirective {
  constructor(
    private el: ElementRef,
    @Optional() private control: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Supprimer tout sauf les chiffres
    
    // Limiter à 9 chiffres (format sénégalais)
    if (value.length > 9) {
      value = value.substring(0, 9);
    }

    // Formater : XX XXX XX XX
    let formattedValue = '';
    if (value.length > 0) {
      formattedValue = value.substring(0, 2);
      if (value.length > 2) {
        formattedValue += ' ' + value.substring(2, 5);
        if (value.length > 5) {
          formattedValue += ' ' + value.substring(5, 7);
          if (value.length > 7) {
            formattedValue += ' ' + value.substring(7, 9);
          }
        }
      }
    }

    // Mettre à jour la valeur dans l'input
    this.el.nativeElement.value = formattedValue;
    
    // Mettre à jour la valeur dans le modèle si NgControl est disponible
    if (this.control && this.control.control) {
      this.control.control.setValue(formattedValue, { emitEvent: true });
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length !== 9 && value.length > 0) {
      // Optionnel : afficher une erreur si le format n'est pas complet
    }
  }
}

