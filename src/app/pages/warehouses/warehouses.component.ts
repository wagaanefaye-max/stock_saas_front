import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
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
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { finalize } from 'rxjs';
import {
  APP_DIALOG_BREAKPOINTS,
  APP_DIALOG_STYLE
} from '../../utils/dialog-mobile.util';
import { EmptyStateComponent } from '../../components/shared/empty-state.component';
import { ListSkeletonComponent } from '../../components/shared/list-skeleton.component';

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
    PaginatorModule,
    TooltipModule,
    EmptyStateComponent,
    ListSkeletonComponent
  ],
  templateUrl: './warehouses.component.html',
  styleUrl: './warehouses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehousesComponent implements OnInit {
  warehouses: any[] = [];
  displayDialog = false;
  displayDetailsDialog = false;
  warehouseProductsLoading = false;
  listLoading = true;
  listLoadError = false;
  warehouse: any = {};
  selectedWarehouseDetails: any = null;
  warehouseProducts: any[] = [];
  globalFilter = '';
  readonly dialogStyle = APP_DIALOG_STYLE;
  /** Modal détail entrepôt — plus large pour le tableau produits */
  readonly dialogStyleDetail = {
    width: '94vw',
    maxWidth: '76rem',
    maxHeight: '90vh'
  };
  readonly dialogBreakpoints = APP_DIALOG_BREAKPOINTS;
  readonly dialogDetailBreakpoints = {
    '1400px': '74rem',
    '1200px': '68rem',
    '960px': '92vw',
    '640px': '96vw'
  };
  rows = 10;
  first = 0;

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
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
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
    this.listLoading = true;
    this.listLoadError = false;
    this.cdr.markForCheck();
    this.apiService.get<any[]>('/warehouses')
      .pipe(finalize(() => {
        this.listLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
      next: (warehouses) => {
        this.warehouses = warehouses.map(w => ({
          ...w,
          status: w.statusLabel || (w.statusCode === 'Actif' ? 'Actif' : w.statusCode === 'Inactif' ? 'Inactif' : 'Maintenance')
        }));
      },
      error: (error) => {
        this.listLoadError = true;
        this.warehouses = [];
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

  get hasActiveFilters(): boolean {
    return !!this.globalFilter?.trim();
  }

  resetFilters(): void {
    this.globalFilter = '';
    this.first = 0;
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
    return this.filteredWarehouses.slice(this.first, this.first + this.rows);
  }

  get paginatedWarehousesNonAdmin(): any[] {
    return this.warehouses.slice(this.first, this.first + this.rows);
  }

  onGlobalFilterChange(): void {
    this.first = 0;
  }

  onPageChange(event: { first?: number; rows?: number }): void {
    this.first = event.first ?? 0;
    if (event.rows != null) {
      this.rows = event.rows;
    }
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
      statusCode: this.resolveStatusCode(warehouse),
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

  private resolveStatusCode(warehouse: any): 'ACTIF' | 'INACTIF' | 'MAINTENANCE' {
    const raw = String(warehouse.statusCode ?? warehouse.statusLabel ?? warehouse.status ?? '').trim().toUpperCase();
    if (raw === 'INACTIF' || raw.includes('INACTIF')) {
      return 'INACTIF';
    }
    if (raw === 'MAINTENANCE' || raw.includes('MAINTENANCE')) {
      return 'MAINTENANCE';
    }
    return 'ACTIF';
  }

  toggleWarehouseStatus(warehouse: any) {
    // Vérifier que seul l'admin entreprise peut changer le statut d'un entrepôt
    if (!this.authService.isAdminEntreprise()) {
      return;
    }
    
    const currentStatusCode = this.resolveStatusCode(warehouse);
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

  isWarehouseActive(warehouse: any): boolean {
    return this.resolveStatusCode(warehouse) === 'ACTIF';
  }

  isFormValid(): boolean {
    return !!(this.warehouse.name && this.warehouse.region && this.warehouse.statusCode);
  }

  viewWarehouseDetails(warehouse: any) {
    this.selectedWarehouseDetails = warehouse;
    this.displayDetailsDialog = true;
    this.loadWarehouseProducts(warehouse.id);
  }

  closeDetails(): void {
    this.displayDetailsDialog = false;
    this.selectedWarehouseDetails = null;
    this.warehouseProducts = [];
    this.warehouseProductsLoading = false;
  }

  editFromDetails(): void {
    if (!this.selectedWarehouseDetails || !this.authService.isAdminEntreprise()) {
      return;
    }
    const warehouse = { ...this.selectedWarehouseDetails };
    this.closeDetails();
    this.editWarehouse(warehouse);
  }

  get warehouseLowStockCount(): number {
    return this.warehouseProducts.filter(p => p.lowStock).length;
  }

  get warehouseTotalQuantity(): number {
    return this.warehouseProducts.reduce(
      (sum, p) => sum + (Number(p.quantity) || 0),
      0
    );
  }

  formatMoney(value: number | null | undefined): string {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return '—';
    }
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' F';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
  }

  hasUpdatedAt(warehouse: { createdAt?: string; updatedAt?: string } | null): boolean {
    if (!warehouse?.updatedAt || !warehouse?.createdAt) {
      return false;
    }
    return new Date(warehouse.updatedAt).getTime() > new Date(warehouse.createdAt).getTime();
  }

  saveProductThreshold(product: { productId: number; minThreshold?: number; lowStock?: boolean }) {
    if (!this.selectedWarehouseDetails?.id) {
      return;
    }
    const warehouseId = this.selectedWarehouseDetails.id;
    const minThreshold = product.minThreshold != null ? product.minThreshold : 0;
    this.apiService.put<any>(
      `/warehouses/${warehouseId}/products/${product.productId}/threshold`,
      { minThreshold }
    ).subscribe({
      next: (updated) => {
        product.minThreshold = updated.minThreshold ?? minThreshold;
        product.lowStock = !!updated.lowStock;
        this.messageService.add({
          severity: 'success',
          summary: 'Seuil enregistré',
          detail: 'Le seuil minimum a été mis à jour.',
          life: 3000
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error?.error?.message || 'Impossible de mettre à jour le seuil.',
          life: 5000
        });
      }
    });
  }

  loadWarehouseProducts(warehouseId: number) {
    this.warehouseProducts = [];
    this.warehouseProductsLoading = true;
    this.apiService.get<any[]>(`/warehouses/${warehouseId}/products`)
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
      next: (products) => {
        this.warehouseProducts = (products || []).map(p => ({
          ...p,
          lowStock: !!p.lowStock
        }));
        this.warehouseProductsLoading = false;
      },
      error: (error) => {
        this.warehouseProductsLoading = false;
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

  trackByWarehouseId(_index: number, warehouse: { id?: number }): number {
    return warehouse.id ?? _index;
  }

  trackByProductId(_index: number, product: { id?: number; productId?: number }): number {
    return product.id ?? product.productId ?? _index;
  }
}

