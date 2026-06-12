import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { catchError, finalize, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { PlatformStatusService } from '../../../services/platform-status.service';

interface PlatformSettings {
  subscriptionMonthlyPriceFcfa: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewRegistrations: boolean;
}

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ToggleButtonModule,
    DividerModule,
    InputNumberModule,
    InputTextarea,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './platform-settings.component.html',
  styleUrl: './platform-settings.component.scss'
})
export class PlatformSettingsComponent implements OnInit {
  saving = false;

  platformSettings: PlatformSettings = {
    subscriptionMonthlyPriceFcfa: 5000,
    maintenanceMode: false,
    maintenanceMessage: '',
    allowNewRegistrations: true
  };

  constructor(
    private apiService: ApiService,
    private platformStatusService: PlatformStatusService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.apiService.get<PlatformSettings>('/platform-settings')
      .pipe(
        catchError(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error?.error?.message || 'Impossible de charger les paramètres'
          });
          return of(null);
        })
      )
      .subscribe(data => {
        if (!data) return;
        this.platformSettings = {
          subscriptionMonthlyPriceFcfa: data.subscriptionMonthlyPriceFcfa ?? 5000,
          maintenanceMode: !!data.maintenanceMode,
          maintenanceMessage: data.maintenanceMessage ?? '',
          allowNewRegistrations: data.allowNewRegistrations !== false
        };
      });
  }

  saveSettings(): void {
    const price = Number(this.platformSettings.subscriptionMonthlyPriceFcfa);
    if (!price || price <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le montant mensuel doit être supérieur à 0.'
      });
      return;
    }

    const maintenanceMessage = (this.platformSettings.maintenanceMessage || '').trim();
    if (maintenanceMessage.length > 1000) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le motif de maintenance ne peut pas dépasser 1000 caractères.'
      });
      return;
    }

    this.saving = true;
    this.apiService.put<PlatformSettings>('/platform-settings', {
      subscriptionMonthlyPriceFcfa: price,
      maintenanceMode: this.platformSettings.maintenanceMode,
      maintenanceMessage: maintenanceMessage || null,
      allowNewRegistrations: this.platformSettings.allowNewRegistrations
    })
      .pipe(
        catchError(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error?.error?.message || 'Enregistrement impossible'
          });
          return of(null);
        }),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe(data => {
        if (!data) return;
        this.platformSettings = {
          subscriptionMonthlyPriceFcfa: data.subscriptionMonthlyPriceFcfa,
          maintenanceMode: !!data.maintenanceMode,
          maintenanceMessage: data.maintenanceMessage ?? '',
          allowNewRegistrations: data.allowNewRegistrations !== false
        };
        this.platformStatusService.refresh().subscribe();
        this.messageService.add({
          severity: 'success',
          summary: 'Paramètres enregistrés',
          detail: 'Le tarif mensuel et les options plateforme ont été mis à jour.',
          life: 3500
        });
      });
  }
}
