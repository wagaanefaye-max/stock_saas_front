import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ToolbarModule,
    MenuModule
  ],
  templateUrl: './warehouses.component.html',
  styleUrl: './warehouses.component.scss'
})
export class WarehousesComponent implements OnInit {
  allWarehouses = [
    { id: 1, name: 'Entrepôt Central Dakar', location: 'Dakar', region: 'Dakar', capacity: 15000, used: 11200, status: 'Actif', address: 'Zone Industrielle, Route de l\'Aéroport, Dakar' },
    { id: 2, name: 'Entrepôt Thiès', location: 'Thiès', region: 'Thiès', capacity: 8000, used: 5200, status: 'Actif', address: 'Avenue Cheikh Anta Diop, Thiès' },
    { id: 3, name: 'Entrepôt Ziguinchor', location: 'Ziguinchor', region: 'Ziguinchor', capacity: 6000, used: 3800, status: 'Actif', address: 'Quartier Escale, Ziguinchor' },
    { id: 4, name: 'Entrepôt Saint-Louis', location: 'Saint-Louis', region: 'Saint-Louis', capacity: 5000, used: 2100, status: 'Actif', address: 'Route de Rosso, Saint-Louis' },
    { id: 5, name: 'Entrepôt Kaolack', location: 'Kaolack', region: 'Kaolack', capacity: 7000, used: 4500, status: 'Actif', address: 'Zone Commerciale, Kaolack' },
    { id: 6, name: 'Entrepôt Tambacounda', location: 'Tambacounda', region: 'Tambacounda', capacity: 4000, used: 0, status: 'Inactif', address: 'Route Nationale, Tambacounda' },
    { id: 7, name: 'Entrepôt Kolda', location: 'Kolda', region: 'Kolda', capacity: 3500, used: 1800, status: 'Actif', address: 'Centre-ville, Kolda' },
    { id: 8, name: 'Entrepôt Louga', location: 'Louga', region: 'Louga', capacity: 4500, used: 2900, status: 'Actif', address: 'Avenue du Général de Gaulle, Louga' },
    { id: 9, name: 'Entrepôt Fatick', location: 'Fatick', region: 'Fatick', capacity: 3000, used: 1500, status: 'Actif', address: 'Quartier Administratif, Fatick' },
    { id: 10, name: 'Entrepôt Matam', location: 'Matam', region: 'Matam', capacity: 2500, used: 800, status: 'Actif', address: 'Route de Bakel, Matam' },
    { id: 11, name: 'Entrepôt Kaffrine', location: 'Kaffrine', region: 'Kaffrine', capacity: 4000, used: 2200, status: 'Actif', address: 'Zone Industrielle, Kaffrine' },
    { id: 12, name: 'Entrepôt Sédhiou', location: 'Sédhiou', region: 'Sédhiou', capacity: 3000, used: 1200, status: 'Actif', address: 'Centre-ville, Sédhiou' },
    { id: 13, name: 'Entrepôt Kédougou', location: 'Kédougou', region: 'Kédougou', capacity: 2000, used: 500, status: 'Actif', address: 'Route de Tambacounda, Kédougou' }
  ];
  
  warehouses: any[] = [];
  selectedWarehouses: any[] = [];
  displayDialog = false;
  warehouse: any = {};
  globalFilter = '';
  menuItems: any[] = [];
  selectedWarehouse: any = null;
  @ViewChild('actionMenu') actionMenu!: Menu;

  // Régions du Sénégal
  regions = [
    'Dakar', 'Thiès', 'Ziguinchor', 'Saint-Louis', 'Kaolack', 
    'Tambacounda', 'Kolda', 'Louga', 'Fatick', 'Matam', 'Kaffrine', 'Sédhiou', 'Kédougou'
  ];

  statuses = ['Actif', 'Inactif', 'Maintenance'];

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.filterWarehouses();
  }

  filterWarehouses() {
    const user = this.authService.getCurrentUser();
    const accessibleIds = this.authService.getAccessibleWarehouseIds();
    
    // Si null, l'utilisateur a accès à tous les entrepôts (Super Admin ou Admin Entreprise)
    if (accessibleIds === null) {
      this.warehouses = [...this.allWarehouses];
    } else if (accessibleIds.length === 0) {
      // Si aucun entrepôt assigné, afficher tous pour l'admin entreprise
      if (this.authService.isAdminEntreprise()) {
        this.warehouses = [...this.allWarehouses];
      } else {
        this.warehouses = [];
      }
    } else {
      // Filtrer selon les entrepôts assignés
      this.warehouses = this.allWarehouses.filter(w => accessibleIds.includes(w.id));
    }
  }

  getUsagePercentage(used: number, capacity: number): number {
    return Math.round((used / capacity) * 100);
  }

  getSeverity(status: string): 'success' | 'warn' | 'danger' | undefined {
    switch (status) {
      case 'Actif':
        return 'success';
      case 'Inactif':
        return 'warn';
      case 'Maintenance':
        return 'danger';
      default:
        return undefined;
    }
  }

  openNew() {
    // Vérifier que seul l'admin entreprise peut créer un entrepôt
    if (!this.authService.isAdminEntreprise()) {
      return;
    }

    this.warehouse = {
      status: 'Actif',
      capacity: 0,
      used: 0,
      region: 'Dakar'
    };
    this.displayDialog = true;
  }

  editWarehouse(warehouse: any) {
    // Vérifier que seul l'admin entreprise peut modifier un entrepôt
    if (!this.authService.isAdminEntreprise()) {
      return;
    }

    this.warehouse = { ...warehouse };
    this.displayDialog = true;
  }

  saveWarehouse() {
    // Vérifier que seul l'admin entreprise peut sauvegarder un entrepôt
    if (!this.authService.isAdminEntreprise()) {
      return;
    }
    if (!this.warehouse.name || !this.warehouse.location || !this.warehouse.region) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.warehouse.capacity < 0) {
      alert('La capacité ne peut pas être négative');
      return;
    }

    if (this.warehouse.used > this.warehouse.capacity) {
      alert('Le stock utilisé ne peut pas dépasser la capacité');
      return;
    }

    // TODO: Implémenter la sauvegarde API
    if (!this.warehouse.id) {
      this.warehouse.id = this.allWarehouses.length + 1;
      this.warehouse.used = this.warehouse.used || 0;
      this.allWarehouses.push({ ...this.warehouse });
    } else {
      const index = this.allWarehouses.findIndex(w => w.id === this.warehouse.id);
      if (index !== -1) {
        this.allWarehouses[index] = { ...this.warehouse };
      }
    }
    
    this.filterWarehouses();
    this.displayDialog = false;
    this.warehouse = {};
  }

  deleteWarehouse(warehouse: any) {
    // Vérifier que seul l'admin entreprise peut supprimer un entrepôt
    if (!this.authService.isAdminEntreprise()) {
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'entrepôt "${warehouse.name}" ?`)) {
      const index = this.allWarehouses.findIndex(w => w.id === warehouse.id);
      if (index !== -1) {
        this.allWarehouses.splice(index, 1);
        this.filterWarehouses();
      }
    }
  }

  toggleWarehouseStatus(warehouse: any) {
    // Vérifier que seul l'admin entreprise peut changer le statut d'un entrepôt
    if (!this.authService.isAdminEntreprise()) {
      return;
    }
    const newStatus = warehouse.status === 'Actif' ? 'Inactif' : 'Actif';
    const index = this.allWarehouses.findIndex(w => w.id === warehouse.id);
    if (index !== -1) {
      this.allWarehouses[index].status = newStatus;
      this.filterWarehouses();
    }
  }

  showMenu(event: Event, warehouse: any) {
    // Vérifier que seul l'admin entreprise peut accéder au menu
    if (!this.authService.isAdminEntreprise()) {
      return;
    }

    this.selectedWarehouse = warehouse;
    this.menuItems = [
      {
        label: 'Modifier',
        icon: 'pi pi-pencil',
        command: () => {
          this.editWarehouse(warehouse);
        }
      },
      {
        label: warehouse.status === 'Actif' ? 'Désactiver' : 'Activer',
        icon: warehouse.status === 'Actif' ? 'pi pi-ban' : 'pi pi-check-circle',
        command: () => {
          this.toggleWarehouseStatus(warehouse);
        }
      },
      {
        separator: true
      },
      {
        label: 'Supprimer',
        icon: 'pi pi-trash',
        styleClass: 'text-red-500',
        command: () => {
          this.deleteWarehouse(warehouse);
        }
      }
    ];
    this.actionMenu.toggle(event);
  }

  isFormValid(): boolean {
    return !!(this.warehouse.name && this.warehouse.location && this.warehouse.region && 
              this.warehouse.capacity !== undefined && this.warehouse.capacity >= 0 &&
              this.warehouse.status);
  }
}

