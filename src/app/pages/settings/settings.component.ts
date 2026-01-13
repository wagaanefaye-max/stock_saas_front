import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DividerModule } from 'primeng/divider';
import { PhoneFormatDirective } from '../../directives/phone-format.directive';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ToggleButtonModule,
    DividerModule,
    PhoneFormatDirective
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  company = {
    name: 'Mon Entreprise',
    email: 'contact@entreprise.com',
    phone: '77 123 45 67',
    address: '123 Rue Example, 75001 Paris'
  };

  notifications = {
    lowStock: true,
    movements: true,
    reports: false
  };

  saveSettings() {
    // TODO: Implémenter la sauvegarde
    console.log('Settings saved');
  }
}

