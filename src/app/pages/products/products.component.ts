import { Component, OnInit } from '@angular/core';
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
import { InputNumberModule } from 'primeng/inputnumber';
import { AuthService } from '../../services/auth.service';

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
    ToolbarModule,
    DropdownModule,
    InputNumberModule
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  // Note: Dans un vrai système, les produits auraient des stocks par entrepôt
  // Pour l'instant, on considère que tous les produits sont accessibles
  // mais les mouvements et stocks seront filtrés par entrepôt
  products = [
    { id: 1, name: 'Produit A', sku: 'PRD-001', category: 'Électronique', stock: 150, price: 29.99, status: 'En stock', warehouseId: 1, warehouseName: 'Entrepôt Central' },
    { id: 2, name: 'Produit B', sku: 'PRD-002', category: 'Vêtements', stock: 45, price: 49.99, status: 'En stock', warehouseId: 2, warehouseName: 'Entrepôt Nord' },
    { id: 3, name: 'Produit C', sku: 'PRD-003', category: 'Alimentaire', stock: 5, price: 9.99, status: 'Rupture', warehouseId: 3, warehouseName: 'Entrepôt Sud' },
    { id: 4, name: 'Produit D', sku: 'PRD-004', category: 'Électronique', stock: 200, price: 199.99, status: 'En stock', warehouseId: 1, warehouseName: 'Entrepôt Central' },
    { id: 5, name: 'Produit E', sku: 'PRD-005', category: 'Vêtements', stock: 0, price: 39.99, status: 'Rupture', warehouseId: 2, warehouseName: 'Entrepôt Nord' }
  ];

  constructor(public authService: AuthService) {}

  ngOnInit() {
    // Filtrer les produits selon les entrepôts assignés pour les gestionnaires/utilisateurs
    this.filterProducts();
  }

  filterProducts() {
    const accessibleIds = this.authService.getAccessibleWarehouseIds();
    
    // Si l'utilisateur est admin entreprise, tous les produits sont visibles
    if (this.authService.isAdminEntreprise() || accessibleIds === null) {
      // Tous les produits sont visibles
      return;
    }
    
    // Pour les gestionnaires/utilisateurs, filtrer les produits selon les entrepôts assignés
    if (accessibleIds.length > 0) {
      this.products = this.products.filter(p => 
        p.warehouseId && accessibleIds.includes(p.warehouseId)
      );
    } else {
      // Si aucun entrepôt assigné, pas de produits visibles
      this.products = [];
    }
  }

  selectedProducts: any[] = [];
  displayDialog = false;
  product: any = {};
  globalFilter = '';
  
  // Liste des entrepôts disponibles (à récupérer depuis l'API)
  warehouses = [
    { id: 1, name: 'Entrepôt Central' },
    { id: 2, name: 'Entrepôt Nord' },
    { id: 3, name: 'Entrepôt Sud' },
    { id: 4, name: 'Entrepôt Est' }
  ];

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
    this.product = {
      warehouseId: null
    };
    this.displayDialog = true;
  }

  editProduct(product: any) {
    this.product = { 
      ...product,
      warehouseId: product.warehouseId || null
    };
    this.displayDialog = true;
  }

  saveProduct() {
    if (!this.product.name || !this.product.sku) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Si admin entreprise, l'entrepôt est obligatoire
    if (this.authService.isAdminEntreprise() && !this.product.warehouseId) {
      alert('Veuillez sélectionner un entrepôt pour ce produit');
      return;
    }
    
    // Récupérer le nom de l'entrepôt si sélectionné
    if (this.product.warehouseId) {
      const warehouse = this.warehouses.find(w => w.id === this.product.warehouseId);
      if (warehouse) {
        this.product.warehouseName = warehouse.name;
      }
    }
    
    // TODO: Implémenter la sauvegarde API
    if (!this.product.id) {
      this.product.id = this.products.length + 1;
      this.product.status = this.product.stock > 0 ? 'En stock' : 'Rupture';
      this.products.push({ ...this.product });
    } else {
      const index = this.products.findIndex(p => p.id === this.product.id);
      if (index !== -1) {
        this.products[index] = { ...this.product };
        this.products[index].status = this.product.stock > 0 ? 'En stock' : 'Rupture';
      }
    }
    
    this.displayDialog = false;
    this.product = {};
  }
  
  getWarehouseName(warehouseId: number): string {
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : `Entrepôt ${warehouseId}`;
  }
  
  isFormValid(): boolean {
    const baseValid = !!(this.product.name && this.product.sku);
    if (this.authService.isAdminEntreprise()) {
      return baseValid && !!this.product.warehouseId;
    }
    return baseValid;
  }
}

