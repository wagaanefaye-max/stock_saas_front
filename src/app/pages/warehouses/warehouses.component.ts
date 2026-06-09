import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { ViewChild } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { APP_DIALOG_BREAKPOINTS, APP_DIALOG_STYLE } from '../../utils/dialog-mobile.util';

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
    SelectModule,
    ToolbarModule,
    MenuModule,
    ToastModule,
    PaginatorModule,
  ],
  providers: [MessageService],
  templateUrl: './warehouses.component.html',
  styleUrl: './warehouses.component.scss'
})
export class WarehousesComponent implements OnInit {
  warehouses: any[] = [];
  selectedWarehouses: any[] = [];
  displayDialog = false;
  displayDetailsDialog = false;
  warehouse: any = {};
  selectedWarehouseDetails: any = null;
  warehouseProducts: any[] = [];
  globalFilter = '';
  menuItems: any[] = [];
  selectedWarehouse: any = null;
  readonly dialogStyle = APP_DIALOG_STYLE;
  readonly dialogBreakpoints = APP_DIALOG_BREAKPOINTS;
  readonly mobileRows = 10;
  mobileFirst = 0;
  @ViewChild('actionMenu') actionMenu!: Menu;

  // Régions du Sénégal
  regions = [
    'Dakar', 'Thiès', 'Ziguinchor', 'Saint-Louis', 'Kaolack', 
    'Tambacounda', 'Kolda', 'Louga', 'Fatick', 'Matam', 'Kaffrine', 'Sédhiou', 'Kédougou'
  ];

  statuses = [
    { label: 'Actif', value: 'ACTIF' },
    { label: 'Inactif', value: 'INACTIF' },
    { label: 'Maintenance', value: 'MAINTENANCE' }
  ];

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.loadWarehouses();

    // Vérifier si on doit ouvrir le formulaire automatiquement
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new' && this.authService.isAdminEntreprise()) {
        this.openNew();
        // Nettoyer l'URL
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  loadWarehouses() {
    this.apiService.get<any[]>('/warehouses').subscribe({
      next: (warehouses) => {
        this.warehouses = warehouses.map(w => ({
          ...w,
          status: w.statusLabel || (w.statusCode === 'Actif' ? 'Actif' : w.statusCode === 'Inactif' ? 'Inactif' : 'Maintenance')
        }));
      },
      error: (error) => {
        console.error('Erreur lors du chargement des entrepôts', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les entrepôts',
          life: 5000
        });
      }
    });
  }

  get filteredWarehouses(): any[] {
    const term = (this.globalFilter || '').toLowerCase().trim();
    if (!term) {
      return this.warehouses;
    }
    return this.warehouses.filter((w) =>
      ['name', 'region', 'description', 'statusLabel', 'status'].some((field) => {
        const val = w[field];
        return val != null && String(val).toLowerCase().includes(term);
      })
    );
  }

  get paginatedWarehouses(): any[] {
    return this.filteredWarehouses.slice(this.mobileFirst, this.mobileFirst + this.mobileRows);
  }

  get paginatedWarehousesNonAdmin(): any[] {
    return this.warehouses.slice(this.mobileFirst, this.mobileFirst + this.mobileRows);
  }

  onGlobalFilterChange(): void {
    this.mobileFirst = 0;
  }

  onMobilePageChange(event: { first?: number }): void {
    this.mobileFirst = event.first ?? 0;
  }

  getSeverity(status: string): 'success' | 'warn' | 'danger' | undefined {
    if (!status) return undefined;
    const statusLower = status.toLowerCase();
    if (statusLower.includes('actif') || statusLower === 'actif') {
      return 'success';
    }
    if (statusLower.includes('inactif') || statusLower === 'inactif') {
      return 'warn';
    }
    if (statusLower.includes('maintenance') || statusLower === 'maintenance') {
      return 'danger';
    }
    return undefined;
  }

  openNew() {
    // Vérifier que seul l'admin entreprise peut créer un entrepôt
    if (!this.authService.isAdminEntreprise()) {
      return;
    }

    this.warehouse = {
      statusCode: 'ACTIF',
      status: 'Actif',
      region: 'Dakar'
    };
    this.displayDialog = true;
  }

  editWarehouse(warehouse: any) {
    // Vérifier que seul l'admin entreprise peut modifier un entrepôt
    if (!this.authService.isAdminEntreprise()) {
      return;
    }

    this.warehouse = { 
      ...warehouse,
      statusCode: warehouse.statusCode || (warehouse.status === 'Actif' ? 'ACTIF' : warehouse.status === 'Inactif' ? 'INACTIF' : 'MAINTENANCE'),
      status: warehouse.statusLabel || warehouse.status
    };
    this.displayDialog = true;
  }

  saveWarehouse() {
    // Vérifier que seul l'admin entreprise peut sauvegarder un entrepôt
    if (!this.authService.isAdminEntreprise()) {
      return;
    }
    if (!this.warehouse.name || !this.warehouse.region) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Champs manquants',
        detail: 'Veuillez remplir le nom et la région',
        life: 5000
      });
      return;
    }

    // Convertir le statut en code
    const statusCode = this.warehouse.statusCode || 
                      (this.warehouse.status === 'Actif' ? 'ACTIF' : 
                       this.warehouse.status === 'Inactif' ? 'INACTIF' : 'MAINTENANCE');

    const warehouseData = {
      name: this.warehouse.name,
      region: this.warehouse.region,
      description: this.warehouse.description || null,
      statusCode: statusCode
    };

    if (!this.warehouse.id) {
      // Création
      this.apiService.post<any>('/warehouses', warehouseData).subscribe({
        next: (createdWarehouse) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Entrepôt créé',
            detail: `L'entrepôt "${createdWarehouse.name}" a été créé avec succès !`,
            life: 4000
          });
          this.displayDialog = false;
          this.warehouse = {};
          this.loadWarehouses(); // Recharger la liste
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Une erreur est survenue lors de la création de l\'entrepôt';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMessage,
            life: 5000
          });
        }
      });
    } else {
      // Mise à jour
      this.apiService.put<any>(`/warehouses/${this.warehouse.id}`, warehouseData).subscribe({
        next: (updatedWarehouse) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Entrepôt modifié',
            detail: `Les informations de l'entrepôt "${updatedWarehouse.name}" ont été mises à jour.`,
            life: 4000
          });
          this.displayDialog = false;
          this.warehouse = {};
          this.loadWarehouses(); // Recharger la liste
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Une erreur est survenue lors de la mise à jour de l\'entrepôt';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMessage,
            life: 5000
          });
        }
      });
    }
  }

  deleteWarehouse(warehouse: any) {
    // Vérifier que seul l'admin entreprise peut supprimer un entrepôt
    if (!this.authService.isAdminEntreprise()) {
      return;
    }

    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer l'entrepôt "${warehouse.name}" ? Cette action est irréversible et supprimera toutes les données associées.`,
      header: 'Confirmer la suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Non, annuler',
      accept: () => {
        this.apiService.delete(`/warehouses/${warehouse.id}`).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Entrepôt supprimé',
              detail: `L'entrepôt "${warehouse.name}" a été supprimé avec succès.`,
              life: 4000
            });
            this.loadWarehouses(); // Recharger la liste
          },
          error: (error) => {
            const errorMessage = error.error?.message || 'Une erreur est survenue lors de la suppression';
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: errorMessage,
              life: 5000
            });
          }
        });
      }
    });
  }

  toggleWarehouseStatus(warehouse: any) {
    // Vérifier que seul l'admin entreprise peut changer le statut d'un entrepôt
    if (!this.authService.isAdminEntreprise()) {
      return;
    }
    
    const currentStatusCode = warehouse.statusCode || (warehouse.status === 'Actif' ? 'ACTIF' : warehouse.status === 'Inactif' ? 'INACTIF' : 'MAINTENANCE');
    const newStatusCode = currentStatusCode === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    const newStatus = newStatusCode === 'ACTIF' ? 'Actif' : 'Inactif';
    const action = newStatusCode === 'ACTIF' ? 'activer' : 'désactiver';
    
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir ${action} l'entrepôt "${warehouse.name}" ?`,
      header: `Confirmer ${newStatusCode === 'ACTIF' ? 'l\'activation' : 'la désactivation'}`,
      icon: 'pi pi-question-circle',
      acceptLabel: `Oui, ${action}`,
      rejectLabel: 'Non, annuler',
      accept: () => {
        const updateData = {
          statusCode: newStatusCode
        };
        
        this.apiService.put<any>(`/warehouses/${warehouse.id}`, updateData).subscribe({
          next: (updatedWarehouse) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Statut modifié',
              detail: `L'entrepôt "${updatedWarehouse.name}" a été ${newStatus.toLowerCase()} avec succès.`,
              life: 4000
            });
            this.loadWarehouses(); // Recharger la liste
          },
          error: (error) => {
            const errorMessage = error.error?.message || 'Une erreur est survenue lors du changement de statut';
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: errorMessage,
              life: 5000
            });
          }
        });
      }
    });
  }

  showMenu(event: Event, warehouse: any) {
    // Vérifier que seul l'admin entreprise peut accéder au menu
    if (!this.authService.isAdminEntreprise()) {
      return;
    }

    this.selectedWarehouse = warehouse;
    const statusCode = warehouse.statusCode || (warehouse.status === 'Actif' ? 'ACTIF' : warehouse.status === 'Inactif' ? 'INACTIF' : 'MAINTENANCE');
    const isActive = statusCode === 'ACTIF';
    
    this.menuItems = [
      {
        label: 'Voir détails',
        icon: 'pi pi-eye',
        command: () => {
          this.viewWarehouseDetails(warehouse);
        }
      },
      {
        label: 'Modifier',
        icon: 'pi pi-pencil',
        command: () => {
          this.editWarehouse(warehouse);
        }
      },
      {
        label: isActive ? 'Désactiver' : 'Activer',
        icon: isActive ? 'pi pi-ban' : 'pi pi-check-circle',
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
    return !!(this.warehouse.name && this.warehouse.region && this.warehouse.statusCode);
  }

  viewWarehouseDetails(warehouse: any) {
    this.selectedWarehouseDetails = warehouse;
    this.displayDetailsDialog = true;
    this.loadWarehouseProducts(warehouse.id);
  }

  loadWarehouseProducts(warehouseId: number) {
    this.warehouseProducts = [];
    this.apiService.get<any[]>(`/warehouses/${warehouseId}/products`).subscribe({
      next: (products) => {
        this.warehouseProducts = products;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les produits de l\'entrepôt',
          life: 5000
        });
      }
    });
  }
}

