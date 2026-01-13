import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { PhoneFormatDirective } from '../../../directives/phone-format.directive';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    CardModule,
    TagModule,
    ToolbarModule,
    DropdownModule,
    ToggleButtonModule,
    TooltipModule,
    DividerModule,
    PhoneFormatDirective
  ],
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.scss'
})
export class CompaniesComponent {
  companies = [
    { id: 1, name: 'Entreprise A', email: 'contact@entreprisea.com', plan: 'Premium', status: 'Actif', users: 25, createdAt: '2024-01-15' },
    { id: 2, name: 'Entreprise B', email: 'contact@entrepriseb.com', plan: 'Standard', status: 'Actif', users: 12, createdAt: '2024-01-10' },
    { id: 3, name: 'Entreprise C', email: 'contact@entreprisec.com', plan: 'Basique', status: 'Inactif', users: 5, createdAt: '2024-01-05' },
    { id: 4, name: 'Entreprise D', email: 'contact@entreprised.com', plan: 'Premium', status: 'Actif', users: 45, createdAt: '2024-01-20' },
    { id: 5, name: 'Entreprise E', email: 'contact@entreprisee.com', plan: 'Standard', status: 'Actif', users: 18, createdAt: '2024-01-12' }
  ];

  selectedCompanies: any[] = [];
  displayDialog = false;
  company: any = {};
  globalFilter = '';
  plans = ['Free', 'Premium', 'Standard', 'Basique'];
  statuses = ['Actif', 'Inactif', 'Suspendu'];
  
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
  
  companyLogo: File | null = null;
  companyLogoPreview: string | null = null;

  getSeverity(status: string): 'success' | 'danger' | 'warn' | undefined {
    switch (status) {
      case 'Actif':
        return 'success';
      case 'Inactif':
        return 'danger';
      case 'Suspendu':
        return 'warn';
      default:
        return undefined;
    }
  }

  getPlanSeverity(plan: string): 'success' | 'info' | 'warn' | 'secondary' | undefined {
    switch (plan) {
      case 'Premium':
        return 'success';
      case 'Standard':
        return 'info';
      case 'Basique':
        return 'warn';
      case 'Free':
        return 'secondary';
      default:
        return undefined;
    }
  }

  openNew() {
    this.company = {
      status: 'Actif',
      plan: 'Standard',
      country: 'Sénégal',
      phone: '',
      address: '',
      region: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: ''
    };
    this.companyLogo = null;
    this.companyLogoPreview = null;
    this.displayDialog = true;
  }

  editCompany(company: any) {
    this.company = { ...company };
    // Initialiser les champs manquants
    if (!this.company.country) {
      this.company.country = 'Sénégal';
    }
    if (!this.company.phone) {
      this.company.phone = '';
    }
    if (!this.company.address) {
      this.company.address = '';
    }
    if (!this.company.region) {
      this.company.region = '';
    }
    // Si l'entreprise a déjà un logo, on peut charger la prévisualisation
    if (company.logoUrl) {
      this.companyLogoPreview = company.logoUrl;
    } else {
      this.companyLogoPreview = null;
    }
    this.companyLogo = null;
    this.displayDialog = true;
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
    if (this.company.logoUrl) {
      this.company.logoUrl = null;
    }
  }
  
  isFormValid(): boolean {
    return !!(this.company.name && 
             this.company.email && 
             this.company.phone && 
             this.company.address && 
             this.company.region && 
             this.company.plan &&
             this.company.adminFirstName &&
             this.company.adminLastName &&
             this.company.adminEmail);
  }

  saveCompany() {
    if (!this.isFormValid()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // TODO: Implémenter la sauvegarde avec upload du logo si présent
    if (this.company.id) {
      // Mise à jour
      const index = this.companies.findIndex(c => c.id === this.company.id);
      if (index !== -1) {
        // Si un nouveau logo a été sélectionné, mettre à jour l'URL
        if (this.companyLogoPreview && !this.company.logoUrl) {
          this.company.logoUrl = this.companyLogoPreview;
        }
        this.companies[index] = { ...this.company };
      }
    } else {
      // Création
      this.company.id = this.companies.length + 1;
      this.company.createdAt = new Date().toISOString().split('T')[0];
      this.company.users = 0;
      // Si un logo a été sélectionné, l'ajouter
      if (this.companyLogoPreview) {
        this.company.logoUrl = this.companyLogoPreview;
      }
      this.companies.push({ ...this.company });
    }
    this.displayDialog = false;
    this.companyLogo = null;
    this.companyLogoPreview = null;
  }

  deleteCompany(company: any) {
    // TODO: Implémenter la suppression
    const index = this.companies.findIndex(c => c.id === company.id);
    if (index !== -1) {
      this.companies.splice(index, 1);
    }
  }
}

