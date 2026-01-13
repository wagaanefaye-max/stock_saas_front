import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TableModule, TagModule],
  templateUrl: './warehouses.component.html',
  styleUrl: './warehouses.component.scss'
})
export class WarehousesComponent {
  warehouses = [
    { id: 1, name: 'Entrepôt Central', location: 'Paris', capacity: 10000, used: 7500, status: 'Actif' },
    { id: 2, name: 'Entrepôt Nord', location: 'Lille', capacity: 5000, used: 3200, status: 'Actif' },
    { id: 3, name: 'Entrepôt Sud', location: 'Marseille', capacity: 8000, used: 4500, status: 'Actif' },
    { id: 4, name: 'Entrepôt Est', location: 'Strasbourg', capacity: 6000, used: 0, status: 'Inactif' }
  ];

  getUsagePercentage(used: number, capacity: number): number {
    return Math.round((used / capacity) * 100);
  }

  getSeverity(status: string): 'success' | 'warn' {
    return status === 'Actif' ? 'success' : 'warn';
  }
}

