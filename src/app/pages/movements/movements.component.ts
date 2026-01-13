import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { CalendarModule } from 'primeng/calendar';
import { TextareaModule } from 'primeng/textarea';
import { AuthService } from '../../services/auth.service';

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
    InputNumberModule,
    InputTextModule,
    ToolbarModule,
    CalendarModule,
    TextareaModule
  ],
  templateUrl: './movements.component.html',
  styleUrl: './movements.component.scss'
})
export class MovementsComponent implements OnInit {
  allMovements = [
    { id: 1, date: '2024-01-20', product: 'Produit A', productId: 1, type: 'Entrée', quantity: 50, warehouse: 'Entrepôt Central Dakar', warehouseId: 1, user: 'Marie Martin', justification: 'Réception de commande fournisseur' },
    { id: 2, date: '2024-01-19', product: 'Produit B', productId: 2, type: 'Sortie', quantity: 25, warehouse: 'Entrepôt Thiès', warehouseId: 2, user: 'Sophie Bernard', justification: 'Vente client' },
    { id: 3, date: '2024-01-19', product: 'Produit C', productId: 3, type: 'Entrée', quantity: 100, warehouse: 'Entrepôt Ziguinchor', warehouseId: 3, user: 'Lucie Moreau', justification: 'Réapprovisionnement' },
    { id: 4, date: '2024-01-18', product: 'Produit A', productId: 1, type: 'Sortie', quantity: 30, warehouse: 'Entrepôt Central Dakar', warehouseId: 1, user: 'Marie Martin', justification: 'Livraison commande' },
    { id: 5, date: '2024-01-18', product: 'Produit D', productId: 4, type: 'Transfert', quantity: 75, warehouse: 'Entrepôt Kaolack', warehouseId: 5, warehouseDestination: 'Entrepôt Saint-Louis', warehouseDestinationId: 4, user: 'Paul Durand', justification: 'Transfert entre entrepôts' },
    { id: 6, date: '2024-01-17', product: 'Produit E', productId: 5, type: 'Ajustement', quantity: -5, warehouse: 'Entrepôt Louga', warehouseId: 8, user: 'Sophie Bernard', justification: 'Correction inventaire - casse' },
    { id: 7, date: '2024-01-17', product: 'Produit A', productId: 1, type: 'Entrée', quantity: 200, warehouse: 'Entrepôt Central Dakar', warehouseId: 1, user: 'Marie Martin', justification: 'Commande fournisseur' },
    { id: 8, date: '2024-01-16', product: 'Produit B', productId: 2, type: 'Sortie', quantity: 15, warehouse: 'Entrepôt Thiès', warehouseId: 2, user: 'Lucie Moreau', justification: 'Vente client' },
    { id: 9, date: '2024-01-16', product: 'Produit C', productId: 3, type: 'Transfert', quantity: 50, warehouse: 'Entrepôt Ziguinchor', warehouseId: 3, warehouseDestination: 'Entrepôt Kolda', warehouseDestinationId: 7, user: 'Paul Durand', justification: 'Répartition stock' },
    { id: 10, date: '2024-01-15', product: 'Produit D', productId: 4, type: 'Ajustement', quantity: 10, warehouse: 'Entrepôt Kaolack', warehouseId: 5, user: 'Sophie Bernard', justification: 'Correction inventaire - erreur comptage' }
  ];
  
  movements: any[] = [];
  selectedMovements: any[] = [];
  globalFilter = '';
  
  // Liste des entrepôts accessibles pour le formulaire
  accessibleWarehouses: any[] = [];
  
  // Liste des produits disponibles
  products = [
    { id: 1, name: 'Produit A', sku: 'PRD-001' },
    { id: 2, name: 'Produit B', sku: 'PRD-002' },
    { id: 3, name: 'Produit C', sku: 'PRD-003' },
    { id: 4, name: 'Produit D', sku: 'PRD-004' },
    { id: 5, name: 'Produit E', sku: 'PRD-005' }
  ];

  displayDialog = false;
  movement: any = {};
  types = ['Entrée', 'Sortie', 'Transfert', 'Ajustement'];

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.filterMovements();
    this.loadAccessibleWarehouses();
  }

  filterMovements() {
    const accessibleIds = this.authService.getAccessibleWarehouseIds();
    
    // Si null, l'utilisateur a accès à tous les entrepôts
    if (accessibleIds === null) {
      this.movements = [...this.allMovements];
    } else {
      // Filtrer selon les entrepôts assignés
      this.movements = this.allMovements.filter(m => 
        m.warehouseId && accessibleIds.includes(m.warehouseId)
      );
    }
  }

  loadAccessibleWarehouses() {
    const accessibleIds = this.authService.getAccessibleWarehouseIds();
    const allWarehouses = [
      { id: 1, name: 'Entrepôt Central Dakar' },
      { id: 2, name: 'Entrepôt Thiès' },
      { id: 3, name: 'Entrepôt Ziguinchor' },
      { id: 4, name: 'Entrepôt Saint-Louis' },
      { id: 5, name: 'Entrepôt Kaolack' },
      { id: 6, name: 'Entrepôt Tambacounda' },
      { id: 7, name: 'Entrepôt Kolda' },
      { id: 8, name: 'Entrepôt Louga' },
      { id: 9, name: 'Entrepôt Fatick' },
      { id: 10, name: 'Entrepôt Matam' },
      { id: 11, name: 'Entrepôt Kaffrine' },
      { id: 12, name: 'Entrepôt Sédhiou' },
      { id: 13, name: 'Entrepôt Kédougou' }
    ];
    
    if (accessibleIds === null) {
      this.accessibleWarehouses = allWarehouses;
    } else if (accessibleIds.length === 0 && this.authService.isAdminEntreprise()) {
      this.accessibleWarehouses = allWarehouses;
    } else {
      this.accessibleWarehouses = allWarehouses.filter(w => accessibleIds.includes(w.id));
    }
  }

  getSeverity(type: string): 'success' | 'danger' | 'info' | 'warn' | undefined {
    switch (type) {
      case 'Entrée':
        return 'success';
      case 'Sortie':
        return 'danger';
      case 'Transfert':
        return 'info';
      case 'Ajustement':
        return 'warn';
      default:
        return undefined;
    }
  }

  openNew() {
    this.movement = {
      type: 'Entrée',
      warehouseId: null,
      warehouseDestinationId: null,
      date: new Date(),
      quantity: 0
    };
    this.displayDialog = true;
  }

  saveMovement() {
    if (!this.movement.type || !this.movement.productId || !this.movement.warehouseId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.movement.type === 'Transfert' && !this.movement.warehouseDestinationId) {
      alert('Veuillez sélectionner un entrepôt de destination pour le transfert');
      return;
    }

    if (this.movement.quantity <= 0) {
      alert('La quantité doit être supérieure à 0');
      return;
    }
    
    // Récupérer le nom du produit
    const product = this.products.find(p => p.id === this.movement.productId);
    if (product) {
      this.movement.product = product.name;
    }
    
    // Récupérer le nom de l'entrepôt
    const warehouse = this.accessibleWarehouses.find(w => w.id === this.movement.warehouseId);
    if (warehouse) {
      this.movement.warehouse = warehouse.name;
    }

    // Récupérer le nom de l'entrepôt de destination pour les transferts
    if (this.movement.type === 'Transfert' && this.movement.warehouseDestinationId) {
      const destWarehouse = this.accessibleWarehouses.find(w => w.id === this.movement.warehouseDestinationId);
      if (destWarehouse) {
        this.movement.warehouseDestination = destWarehouse.name;
      }
    }
    
    // Récupérer l'utilisateur actuel
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.movement.user = currentUser.name;
    }
    
    // TODO: Implémenter la sauvegarde API
    if (!this.movement.id) {
      this.movement.id = this.allMovements.length + 1;
      if (this.movement.date instanceof Date) {
        this.movement.date = this.movement.date.toISOString().split('T')[0];
      } else if (!this.movement.date) {
        this.movement.date = new Date().toISOString().split('T')[0];
      }
      this.allMovements.push({ ...this.movement });
      this.filterMovements();
    } else {
      const index = this.allMovements.findIndex(m => m.id === this.movement.id);
      if (index !== -1) {
        this.allMovements[index] = { ...this.movement };
        this.filterMovements();
      }
    }
    
    this.displayDialog = false;
    this.movement = {};
  }

  isFormValid(): boolean {
    const baseValid = !!(this.movement.type && this.movement.productId && this.movement.warehouseId && this.movement.quantity > 0);
    if (this.movement.type === 'Transfert') {
      return baseValid && !!this.movement.warehouseDestinationId;
    }
    return baseValid;
  }
}

