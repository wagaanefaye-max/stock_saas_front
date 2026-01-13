import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { PhoneFormatDirective } from '../../../directives/phone-format.directive';

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ToggleButtonModule,
    DividerModule,
    InputNumberModule,
    PhoneFormatDirective
  ],
  templateUrl: './platform-settings.component.html',
  styleUrl: './platform-settings.component.scss'
})
export class PlatformSettingsComponent {
  platformSettings = {
    name: 'Stock SaaS',
    supportEmail: 'support@stocksaas.com',
    supportPhone: '77 123 45 67',
    maxCompanies: 100,
    maxUsersPerCompany: 50,
    maintenanceMode: false,
    allowNewRegistrations: true
  };

  plans = [
    { name: 'Free', price: 0, maxUsers: 10, maxWarehouses: 3, trialDays: 14 },
    { name: 'Basique', price: 29.99, maxUsers: 5, maxWarehouses: 2 },
    { name: 'Standard', price: 79.99, maxUsers: 20, maxWarehouses: 5 },
    { name: 'Premium', price: 149.99, maxUsers: 50, maxWarehouses: 10 }
  ];

  saveSettings() {
    // TODO: Implémenter la sauvegarde
    console.log('Settings saved', this.platformSettings);
  }
}

