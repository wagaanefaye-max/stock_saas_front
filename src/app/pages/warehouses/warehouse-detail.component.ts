import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ListSkeletonComponent } from '../../components/shared/list-skeleton.component';
import { EmptyStateComponent } from '../../components/shared/empty-state.component';

@Component({
  selector: 'app-warehouse-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    TableModule,
    TagModule,
    InputNumberModule,
    TooltipModule,
    ListSkeletonComponent,
    EmptyStateComponent
  ],
  templateUrl: './warehouse-detail.component.html',
  styleUrl: './warehouse-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehouseDetailComponent implements OnInit {
  warehouse: any = null;
  warehouseProducts: any[] = [];
  pageLoading = true;
  pageLoadError = false;
  productsLoading = false;

  private warehouseId = 0;

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id || Number.isNaN(id)) {
        this.router.navigate([this.warehousesListPath]);
        return;
      }
      this.warehouseId = id;
      this.loadWarehouse();
    });
  }

  get warehousesListPath(): string {
    const url = this.router.url;
    if (url.includes('/company-admin/')) {
      return '/company-admin/warehouses';
    }
    if (url.includes('/gestionnaire/')) {
      return '/gestionnaire/warehouses';
    }
    return '/gestion/warehouses';
  }

  loadWarehouse(): void {
    this.pageLoading = true;
    this.pageLoadError = false;
    this.warehouse = null;
    this.cdr.markForCheck();

    this.apiService.get<any>(`/warehouses/${this.warehouseId}`)
      .pipe(finalize(() => {
        this.pageLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (data) => {
          this.warehouse = {
            ...data,
            status: data.statusLabel || data.status
          };
          this.loadWarehouseProducts();
        },
        error: () => {
          this.pageLoadError = true;
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger l\'entrepôt',
            life: 5000
          });
        }
      });
  }

  loadWarehouseProducts(): void {
    this.productsLoading = true;
    this.warehouseProducts = [];
    this.cdr.markForCheck();

    this.apiService.get<any[]>(`/warehouses/${this.warehouseId}/products`)
      .pipe(finalize(() => {
        this.productsLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (products) => {
          this.warehouseProducts = (products || []).map((p) => ({
            ...p,
            lowStock: !!p.lowStock
          }));
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les produits de l\'entrepôt',
            life: 5000
          });
        }
      });
  }

  editWarehouse(): void {
    if (!this.authService.isAdminEntreprise() || !this.warehouse?.id) {
      return;
    }
    this.router.navigate([this.warehousesListPath], {
      queryParams: { edit: this.warehouse.id }
    });
  }

  saveProductThreshold(product: { productId: number; minThreshold?: number; lowStock?: boolean }): void {
    if (!this.warehouse?.id) {
      return;
    }
    const minThreshold = product.minThreshold != null ? product.minThreshold : 0;
    this.apiService.put<any>(
      `/warehouses/${this.warehouse.id}/products/${product.productId}/threshold`,
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
        this.cdr.markForCheck();
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

  get warehouseLowStockCount(): number {
    return this.warehouseProducts.filter((p) => p.lowStock).length;
  }

  get warehouseTotalQuantity(): number {
    return this.warehouseProducts.reduce(
      (sum, p) => sum + (Number(p.quantity) || 0),
      0
    );
  }

  getSeverity(status: string): 'success' | 'warn' | 'danger' | undefined {
    if (!status) {
      return undefined;
    }
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
}
