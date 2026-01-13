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

@Component({
  selector: 'app-products',
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
    ToolbarModule
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent {
  products = [
    { id: 1, name: 'Produit A', sku: 'PRD-001', category: 'Électronique', stock: 150, price: 29.99, status: 'En stock' },
    { id: 2, name: 'Produit B', sku: 'PRD-002', category: 'Vêtements', stock: 45, price: 49.99, status: 'En stock' },
    { id: 3, name: 'Produit C', sku: 'PRD-003', category: 'Alimentaire', stock: 5, price: 9.99, status: 'Rupture' },
    { id: 4, name: 'Produit D', sku: 'PRD-004', category: 'Électronique', stock: 200, price: 199.99, status: 'En stock' },
    { id: 5, name: 'Produit E', sku: 'PRD-005', category: 'Vêtements', stock: 0, price: 39.99, status: 'Rupture' }
  ];

  selectedProducts: any[] = [];
  displayDialog = false;
  product: any = {};
  globalFilter = '';

  getSeverity(status: string): 'success' | 'danger' | undefined {
    switch (status) {
      case 'En stock':
        return 'success';
      case 'Rupture':
        return 'danger';
      default:
        return undefined;
    }
  }

  openNew() {
    this.product = {};
    this.displayDialog = true;
  }

  editProduct(product: any) {
    this.product = { ...product };
    this.displayDialog = true;
  }

  saveProduct() {
    // TODO: Implémenter la sauvegarde
    this.displayDialog = false;
  }
}

