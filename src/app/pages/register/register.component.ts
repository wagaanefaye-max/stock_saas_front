import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { PhoneFormatDirective } from '../../directives/phone-format.directive';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/auth.model';
import { getErrorMessage } from '../../utils/error-message.util';

type RegisterField =
  | 'companyName'
  | 'companyEmail'
  | 'companyPhone'
  | 'companyAddress'
  | 'companyRegion'
  | 'adminFirstName'
  | 'adminLastName'
  | 'adminEmail'
  | 'acceptTerms'
  | 'companyLogo';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    CheckboxModule,
    DividerModule,
    PhoneFormatDirective
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  companyName = '';
  companyEmail = '';
  companyPhone = '';
  companyAddress = '';
  companyRegion = '';
  companyCountry = 'Sénégal';
  companyLogo: File | null = null;
  companyLogoPreview: string | null = null;

  regions = [
    'Dakar',
    'Thiès',
    'Diourbel',
    'Saint-Louis',
    'Tambacounda',
    'Kaolack',
    'Louga',
    'Fatick',
    'Kolda',
    'Ziguinchor',
    'Kaffrine',
    'Matam',
    'Kédougou',
    'Sédhiou'
  ];

  adminFirstName = '';
  adminLastName = '';
  adminEmail = '';

  acceptTerms = false;
  currentStep = 1;
  totalSteps = 3;
  errorMessage = '';
  submitting = false;
  fieldErrors: Partial<Record<RegisterField, string>> = {};

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  nextStep() {
    if (!this.validateStep(this.currentStep)) {
      return;
    }
    if (this.currentStep < this.totalSteps) {
      this.errorMessage = '';
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.errorMessage = '';
      this.currentStep--;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!(
          this.companyName.trim() &&
          this.isValidEmail(this.companyEmail) &&
          this.isValidPhone(this.companyPhone) &&
          this.companyAddress.trim() &&
          this.companyRegion &&
          this.companyCountry
        );
      case 2:
        return !!(
          this.adminFirstName.trim() &&
          this.adminLastName.trim() &&
          this.isValidEmail(this.adminEmail)
        );
      case 3:
        return this.acceptTerms;
      default:
        return false;
    }
  }

  validateStep(step: number): boolean {
    this.fieldErrors = {};
    let valid = true;

    if (step === 1) {
      valid = this.setFieldError('companyName', this.validateRequired(this.companyName, 'Le nom de l\'entreprise est obligatoire.')) && valid;
      valid = this.setFieldError('companyEmail', this.validateEmail(this.companyEmail)) && valid;
      valid = this.setFieldError('companyPhone', this.validatePhone(this.companyPhone)) && valid;
      valid = this.setFieldError('companyAddress', this.validateRequired(this.companyAddress, 'L\'adresse est obligatoire.')) && valid;
      valid = this.setFieldError('companyRegion', this.companyRegion ? undefined : 'Veuillez sélectionner une région.') && valid;
    }

    if (step === 2) {
      valid = this.setFieldError('adminFirstName', this.validateRequired(this.adminFirstName, 'Le prénom est obligatoire.')) && valid;
      valid = this.setFieldError('adminLastName', this.validateRequired(this.adminLastName, 'Le nom est obligatoire.')) && valid;
      valid = this.setFieldError('adminEmail', this.validateEmail(this.adminEmail)) && valid;
    }

    if (step === 3) {
      valid = this.setFieldError('acceptTerms', this.acceptTerms ? undefined : 'Vous devez accepter les conditions pour continuer.') && valid;
    }

    return valid;
  }

  clearFieldError(field: RegisterField): void {
    if (this.fieldErrors[field]) {
      const next = { ...this.fieldErrors };
      delete next[field];
      this.fieldErrors = next;
    }
    this.errorMessage = '';
  }

  register() {
    if (!this.validateStep(3)) {
      return;
    }

    this.errorMessage = '';
    this.submitting = true;

    const registerRequest: RegisterRequest = {
      name: `${this.adminFirstName} ${this.adminLastName}`.trim(),
      email: this.adminEmail.trim(),
      companyName: this.companyName.trim(),
      companyEmail: this.companyEmail.trim(),
      companyPhone: this.companyPhone.trim(),
      companyAddress: this.companyAddress.trim(),
      companyRegion: this.companyRegion,
      planCode: 'Free'
    };

    this.authService.register(registerRequest).subscribe({
      next: (response: any) => {
        this.submitting = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Inscription réussie',
          detail: response.message || 'Un email de validation a été envoyé à votre adresse. Veuillez cliquer sur le lien pour activer votre compte.',
          life: 8000
        });

        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { registered: 'true', message: 'Veuillez vérifier votre email pour activer votre compte.' }
          });
        }, 2000);
      },
      error: (error) => {
        this.submitting = false;
        console.error('Erreur d\'inscription:', error);
        this.errorMessage = getErrorMessage(error, 'Une erreur est survenue lors de l\'inscription');
      }
    });
  }

  getStepProgress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (!file.type.match(/image\/(png|jpg|jpeg|gif|webp)/)) {
        this.fieldErrors = {
          ...this.fieldErrors,
          companyLogo: 'Veuillez sélectionner une image (PNG, JPG, JPEG, GIF ou WEBP).'
        };
        input.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.fieldErrors = {
          ...this.fieldErrors,
          companyLogo: 'L\'image ne doit pas dépasser 5 Mo.'
        };
        input.value = '';
        return;
      }

      this.clearFieldError('companyLogo');
      this.companyLogo = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.companyLogoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(): void {
    this.companyLogo = null;
    this.companyLogoPreview = null;
    this.clearFieldError('companyLogo');
  }

  private setFieldError(field: RegisterField, message?: string): boolean {
    if (message) {
      this.fieldErrors = { ...this.fieldErrors, [field]: message };
      return false;
    }
    return true;
  }

  private validateRequired(value: string, message: string): string | undefined {
    return value?.trim() ? undefined : message;
  }

  private validateEmail(value: string): string | undefined {
    const trimmed = value?.trim();
    if (!trimmed) {
      return 'L\'email est obligatoire.';
    }
    if (!this.isValidEmail(trimmed)) {
      return 'Format d\'email invalide.';
    }
    return undefined;
  }

  private validatePhone(value: string): string | undefined {
    const digits = (value || '').replace(/\D/g, '');
    if (!digits) {
      return 'Le téléphone est obligatoire.';
    }
    if (digits.length !== 9) {
      return 'Le numéro doit contenir 9 chiffres (ex. 78 900 88 77).';
    }
    return undefined;
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private isValidPhone(value: string): boolean {
    return (value || '').replace(/\D/g, '').length === 9;
  }
}
