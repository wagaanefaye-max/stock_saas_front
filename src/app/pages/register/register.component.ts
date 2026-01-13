import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { PhoneFormatDirective } from '../../directives/phone-format.directive';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    CheckboxModule,
    DividerModule,
    PhoneFormatDirective
  ],
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
  
  // Plan d'abonnement
  selectedPlan = 'Free';
  plans = [
    { label: 'Gratuit - 14 jours d\'essai', value: 'Free' },
    { label: 'Basique - 29,99€/mois', value: 'Basique' },
    { label: 'Standard - 79,99€/mois', value: 'Standard' },
    { label: 'Premium - 149,99€/mois', value: 'Premium' }
  ];
  
  // Autres
  acceptTerms = false;
  loading = false;
  currentStep = 1;
  totalSteps = 3;

  constructor(private router: Router) {}

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
        return this.acceptTerms && !!this.selectedPlan;
      default:
        return false;
    }
  }

  register() {
    if (!this.isStepValid(3)) {
      return;
    }

    this.loading = true;
    
    // TODO: Implémenter l'appel API d'inscription
    setTimeout(() => {
      this.loading = false;
      // Rediriger vers la page de login avec un message de succès
      this.router.navigate(['/login'], { 
        queryParams: { registered: 'true' } 
      });
    }, 2000);
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

