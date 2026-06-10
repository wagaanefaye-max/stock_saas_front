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
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PhoneFormatDirective } from '../../directives/phone-format.directive';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/auth.model';
import { getErrorMessage } from '../../utils/error-message.util';

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
    ToastModule,
    PhoneFormatDirective
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  // Informations entreprise
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
  
  // Informations administrateur
  adminFirstName = '';
  adminLastName = '';
  adminEmail = '';
  
  // Autres
  acceptTerms = false;
  currentStep = 1;
  totalSteps = 3;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!(this.companyName && this.companyEmail && this.companyPhone && 
                 this.companyAddress && this.companyRegion && this.companyCountry);
      case 2:
        return !!(this.adminFirstName && this.adminLastName && this.adminEmail);
      case 3:
        return this.acceptTerms;
      default:
        return false;
    }
  }

  register() {
    if (!this.isStepValid(3)) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires et accepter les conditions';
      return;
    }

    this.errorMessage = '';
    
    const registerRequest: RegisterRequest = {
      name: `${this.adminFirstName} ${this.adminLastName}`.trim(),
      email: this.adminEmail,
      companyName: this.companyName,
      companyEmail: this.companyEmail,
      companyPhone: this.companyPhone,
      companyAddress: this.companyAddress,
      companyRegion: this.companyRegion,
      planCode: 'Free'
    };
    
    this.authService.register(registerRequest).subscribe({
      next: (response: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Inscription réussie',
          detail: response.message || 'Un email de validation a été envoyé à votre adresse. Veuillez cliquer sur le lien pour activer votre compte.',
          life: 8000
        });
        
        // Rediriger vers la page de login avec un message
        setTimeout(() => {
          this.router.navigate(['/login'], { 
            queryParams: { registered: 'true', message: 'Veuillez vérifier votre email pour activer votre compte.' } 
          });
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur d\'inscription:', error);
        
        const errorDetail = getErrorMessage(error, 'Une erreur est survenue lors de l\'inscription');
        
        this.errorMessage = errorDetail;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur d\'inscription',
          detail: errorDetail,
          life: 5000
        });
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
      
      // Vérifier le type de fichier (images uniquement)
      if (!file.type.match(/image\/(png|jpg|jpeg|gif|webp)/)) {
        alert('Veuillez sélectionner une image (PNG, JPG, JPEG, GIF ou WEBP)');
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      this.companyLogo = file;
      
      // Créer une prévisualisation
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
  }
}

