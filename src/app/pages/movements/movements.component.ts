import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-movements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    DialogModule,
    DropdownModule,
    InputNumberModule
  ],
  templateUrl: './movements.component.html',
  styleUrl: './movements.component.scss'
})
export class MovementsComponent {
  movements = [
    { id: 1, date: '2024-01-15', product: 'Produit A', type: 'Entrée', quantity: 50, warehouse: 'Entrepôt Central', user: 'John Doe' },
    { id: 2, date: '2024-01-14', product: 'Produit B', type: 'Sortie', quantity: 25, warehouse: 'Entrepôt Nord', user: 'Jane Smith' },
    { id: 3, date: '2024-01-14', product: 'Produit C', type: 'Entrée', quantity: 100, warehouse: 'Entrepôt Sud', user: 'John Doe' },
    { id: 4, date: '2024-01-13', product: 'Produit A', type: 'Sortie', quantity: 30, warehouse: 'Entrepôt Central', user: 'Jane Smith' }
  ];

  displayDialog = false;
  movement: any = {};
  types = ['Entrée', 'Sortie'];

  getSeverity(type: string): 'success' | 'danger' {
    return type === 'Entrée' ? 'success' : 'danger';
  }

  openNew() {
    this.movement = {};
    this.displayDialog = true;
  }

  saveMovement() {
    // TODO: Implémenter la sauvegarde
    this.displayDialog = false;
  }
}

