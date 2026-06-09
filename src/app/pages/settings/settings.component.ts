import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PhoneFormatDirective } from '../../directives/phone-format.directive';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { catchError, finalize, of, throwError } from 'rxjs';

interface CompanySettingsResponse {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  region: string | null;
  country: string | null;
  planCode: string | null;
  notifLowStock: boolean | null;
  notifMovements: boolean | null;
  notifReports: boolean | null;
}

interface NotificationSettings {
  lowStock: boolean;
  movements: boolean;
  reports: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    InputSwitchModule,
    ToastModule,
    PhoneFormatDirective
  ],
  providers: [MessageService],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  companyId: number | null = null;
  isSaving = false;
  isSavingNotifications = false;
  company = {
    name: '',
    email: '',
    phone: '',
    address: '',
    region: '',
    country: 'Sénégal'
  };

  notifications: NotificationSettings = {
    lowStock: true,
    movements: true,
    reports: false
  };

  constructor(
    private messageService: MessageService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.companyId = currentUser?.companyId ?? null;

    if (!this.companyId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Entreprise introuvable',
        detail: 'Impossible de déterminer l’entreprise associée à votre compte.',
        life: 5000
      });
      return;
    }

    this.loadCompanySettings();
  }

  private loadCompanySettings(): void {
    if (!this.companyId) return;
    this.apiService.get<CompanySettingsResponse>(`/companies/${this.companyId}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des paramètres entreprise:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les paramètres de l’entreprise.'
          });
          return of(null);
        })
      )
      .subscribe(data => {
        if (!data) return;
        this.company = {
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          region: data.region ?? '',
          country: data.country ?? 'Sénégal'
        };
        this.notifications = {
          lowStock: data.notifLowStock ?? true,
          movements: data.notifMovements ?? true,
          reports: data.notifReports ?? false
        };
      });
  }

  private buildCompanyPayload() {
    return {
      name: this.company.name.trim(),
      email: this.company.email.trim(),
      phone: this.company.phone?.trim() || null,
      address: this.company.address?.trim() || null,
      region: this.company.region?.trim() || null,
      country: this.company.country?.trim() || 'Sénégal',
      notifLowStock: this.notifications.lowStock,
      notifMovements: this.notifications.movements,
      notifReports: this.notifications.reports
    };
  }

  saveSettings() {
    if (!this.companyId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action impossible',
        detail: 'Entreprise non identifiée.'
      });
      return;
    }

    if (!this.company.name.trim() || !this.company.email.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le nom de l’entreprise et l’email sont obligatoires.'
      });
      return;
    }

    this.isSaving = true;
    const payload = this.buildCompanyPayload();

    this.apiService.put<CompanySettingsResponse>(`/companies/${this.companyId}`, payload)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la sauvegarde des paramètres entreprise:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error?.error?.message || 'Impossible d’enregistrer les paramètres.'
          });
          return throwError(() => error);
        }),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Paramètres enregistrés',
          detail: 'Les informations de votre entreprise ont été mises à jour.',
          life: 4000
        });
      });
  }

  saveNotifications(): void {
    if (!this.companyId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action impossible',
        detail: 'Entreprise non identifiée.'
      });
      return;
    }

    this.isSavingNotifications = true;
    this.apiService.put<CompanySettingsResponse>(`/companies/${this.companyId}`, this.buildCompanyPayload())
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la sauvegarde des notifications:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error?.error?.message || 'Impossible d’enregistrer vos notifications.'
          });
          return throwError(() => error);
        }),
        finalize(() => {
          this.isSavingNotifications = false;
        })
      )
      .subscribe((data) => {
        this.notifications = {
          lowStock: data.notifLowStock ?? this.notifications.lowStock,
          movements: data.notifMovements ?? this.notifications.movements,
          reports: data.notifReports ?? this.notifications.reports
        };
        this.messageService.add({
          severity: 'success',
          summary: 'Notifications enregistrées',
          detail: 'Vos préférences de notifications ont été sauvegardées.',
          life: 3500
        });
      });
  }
}

