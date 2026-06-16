import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { PaginatorModule } from 'primeng/paginator';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { finalize } from 'rxjs';
import {
  APP_DIALOG_BREAKPOINTS,
  APP_DIALOG_STYLE_DETAIL,
  APP_DIALOG_STYLE_LG,
  APP_DIALOG_STYLE_SM
} from '../../utils/dialog-mobile.util';
import { EmptyStateComponent } from '../../components/shared/empty-state.component';
import { ListSkeletonComponent } from '../../components/shared/list-skeleton.component';
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    CardModule,
    TagModule,
    SelectModule,
    InputNumberModule,
    TooltipModule,
    DatePickerModule,
    CheckboxModule,
    PaginatorModule,
    EmptyStateComponent,
    ListSkeletonComponent
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsComponent implements OnInit {
  readonly dialogStyle = APP_DIALOG_STYLE_LG;
  readonly dialogStyleSm = APP_DIALOG_STYLE_SM;
  readonly dialogStyleDetail = APP_DIALOG_STYLE_DETAIL;
  readonly dialogBreakpoints = APP_DIALOG_BREAKPOINTS;

  products: any[] = [];
  totalProducts = 0;
  rows = 10;
  first = 0;
  listLoading = true;
  listLoadError = false;
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  /** Filtres de recherche (envoyés à l'API) */
  filterName = '';
  filterReference = '';
  filterSku = '';
  filterCategoryCode: string | null = null;
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;
  filterLowStock = false;
  showFilterPanel = false;

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
    this.loadCategories();
    this.handleRouteQueryParams(this.route.snapshot.queryParams, true);

    this.route.queryParams.subscribe(params => {
      this.handleRouteQueryParams(params, false);
    });
  }

  private handleRouteQueryParams(params: Record<string, string>, isInitial: boolean): void {
    if (params['action'] === 'new' && this.authService.isAdminEntreprise()) {
      this.openNew();
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
      return;
    }

    const lowStock = params['lowStock'] === '1' || params['lowStock'] === 'true';
    if (lowStock) {
      this.filterLowStock = true;
      this.showFilterPanel = true;
      this.first = 0;
      this.loadProducts({ first: 0, rows: this.rows });
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
      return;
    }

    if (isInitial) {
      this.loadProducts({ first: 0, rows: this.rows });
    }
  }

  loadProducts(event?: { first: number; rows: number }) {
    const first = event?.first ?? this.first;
    const rows = event?.rows ?? this.rows;
    const page = first / rows;
    this.listLoading = true;
    this.listLoadError = false;
    this.cdr.markForCheck();
    const params: Record<string, string | number | undefined> = {
      page,
      size: rows
    };
    if (this.filterName?.trim()) params['name'] = this.filterName.trim();
    if (this.filterReference?.trim()) params['reference'] = this.filterReference.trim();
    if (this.filterSku?.trim()) params['sku'] = this.filterSku.trim();
    if (this.filterCategoryCode) params['categoryCode'] = this.filterCategoryCode;
    if (this.filterDateFrom) params['dateFrom'] = this.formatDateForApi(this.filterDateFrom);
    if (this.filterDateTo) params['dateTo'] = this.formatDateForApi(this.filterDateTo);
    if (this.filterLowStock) params['lowStock'] = 'true';

    this.apiService.get<{ content: any[]; totalElements: number }>('/products', params)
      .pipe(finalize(() => {
        this.listLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
      next: (data) => {
        this.products = (data?.content ?? []).map(p => ({
          ...p,
          status: p.statusLabel || (p.stock && p.stock > 0 ? 'En stock' : 'Rupture'),
          stock: p.stock || 0,
          warehouseStocks: p.warehouseStocks ?? [],
          price: p.price || 0,
          minThreshold: p.minThreshold ?? 0,
          lowStock: !!p.lowStock
        }));
        this.totalProducts = data?.totalElements ?? 0;
      },
      error: (error) => {
        this.listLoadError = true;
        this.products = [];
        this.totalProducts = 0;
        console.error('Erreur lors du chargement des produits', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les produits',
          life: 5000
        });
      }
    });
  }

  onProductsLazyLoad(event: any) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
    this.loadProducts({ first: this.first, rows: this.rows });
  }

  refreshProducts() {
    this.loadProducts({ first: this.first, rows: this.rows });
  }

  trackByProductId(_index: number, product: { id?: number }): number {
    return product.id ?? _index;
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.filterName?.trim() ||
      this.filterReference?.trim() ||
      this.filterSku?.trim() ||
      this.filterCategoryCode ||
      this.filterDateFrom ||
      this.filterDateTo ||
      this.filterLowStock
    );
  }

  private formatDateForApi(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  onGlobalFilterChange() {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.filterName = this.globalFilter.trim();
      this.first = 0;
      this.loadProducts({ first: 0, rows: this.rows });
    }, 350);
  }

  applyFilters() {
    this.first = 0;
    this.loadProducts({ first: 0, rows: this.rows });
  }

  resetFilters() {
    this.filterName = '';
    this.filterReference = '';
    this.filterSku = '';
    this.filterCategoryCode = null;
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.filterLowStock = false;
    this.globalFilter = '';
    this.first = 0;
    this.loadProducts({ first: 0, rows: this.rows });
  }

  loadCategories() {
    this.apiService.get<{ code: string; label: string }[]>('/categories')
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
      next: (categories) => {
        this.categories = categories || [];
        // Si création d'un nouveau produit sans catégorie choisie, sélectionner GENERAL par défaut.
        if (!this.product.id && !this.product.categoryCode && this.categories.length > 0) {
          const general = this.categories.find(c => c.code === 'GENERAL' || c.label?.toUpperCase() === 'GENERAL');
          if (general) {
            this.product.categoryCode = general.code;
          } else {
            this.product.categoryCode = this.categories[0].code;
          }
        }
      },
      error: () => {
        this.categories = [];
      }
    });
  }

  loadWarehouses() {
    if (this.warehouses.length === 0){

      this.apiService.get<any[]>('/warehouses/simple')
        .pipe(finalize(() => this.cdr.markForCheck()))
        .subscribe({
        next: (warehouses) => {
          // Le backend retourne déjà uniquement id et name
          this.warehouses = warehouses;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des entrepôts', error);
          // En cas d'erreur, utiliser une liste vide ou des valeurs par défaut
          this.warehouses = [];
          this.messageService.add({
            severity: 'warn',
            summary: 'Avertissement',
            detail: 'Impossible de charger la liste des entrepôts',
            life: 3000
          });
        }
      });
    }

  }

  selectedProducts: any[] = [];
  displayDialog = false;
  detailDialogVisible = false;
  detailLoading = false;
  selectedProduct: any | null = null;
  product: any = {};
  globalFilter = '';

  /** Catégories de produits (référence tp_category) */
  categories: { code: string; label: string }[] = [];
  displayCategoryDialog = false;
  newCategory = { code: '', label: '' };
  /** Liste des entrepôts disponibles (chargée depuis l'API) */
  warehouses: any[] = [];

  isLowStock(product: { lowStock?: boolean; stock?: number; minThreshold?: number }): boolean {
    if (product.lowStock) {
      return true;
    }
    const min = Number(product.minThreshold) || 0;
    const stock = Number(product.stock) || 0;
    return min > 0 && stock <= min;
  }

  getSeverity(status: string): 'success' | 'danger' | undefined {
    if (!status) return undefined;
    const statusLower = status.toLowerCase();
    if (statusLower.includes('stock') || statusLower === 'en_stock') {
      return 'success';
    }
    if (statusLower.includes('rupture') || statusLower === 'rupture') {
      return 'danger';
    }
    return undefined;
  }

  openNew() {
    this.product = {
      quantity: null,
      minThreshold: null,
      purchasePrice: null,
      price: null
    };
    // Si les catégories sont déjà chargées, sélectionner GENERAL par défaut.
    if (this.categories.length > 0) {
      const general = this.categories.find(c => c.code === 'GENERAL' || c.label?.toUpperCase() === 'GENERAL');
      if (general) {
        this.product.categoryCode = general.code;
      } else {
        this.product.categoryCode = this.categories[0].code;
      }
    }
    // Charger entrepôts (pour s'assurer que warehouseId existe bien)
    this.loadWarehouses();
    this.displayDialog = true;
  }

  openCreateCategoryDialog() {
    this.newCategory = { code: '', label: '' };
    this.displayCategoryDialog = true;
  }

  createCategory() {
    if (!this.newCategory.code?.trim() || !this.newCategory.label?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le code et le libellé de la catégorie sont obligatoires.',
        life: 4000
      });
      return;
    }

    const payload: { label: string; code: string } = {
      label: this.newCategory.label.trim(),
      code: this.newCategory.code.trim()
    };

    this.apiService.post<{ code: string; label: string }>('/categories', payload).subscribe({
      next: (created) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Catégorie créée',
          detail: `La catégorie "${created.label}" a été ajoutée.`,
          life: 3000
        });
        this.displayCategoryDialog = false;
        this.newCategory = { code: '', label: '' };
        this.loadCategories();
        this.product.categoryCode = created.code;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error?.error?.message || 'Impossible de créer la catégorie.',
          life: 5000
        });
      }
    });
  }

  editProduct(product: any) {
    this.closeDetail();
    this.loadWarehouses();
    this.apiService.get<any>(`/products/${product.id}`).subscribe({
      next: (p) => {
        this.product = {
          id: p.id,
          reference: p.reference,
          name: p.name,
          categoryCode: p.categoryCode ?? p.category ?? null,
          description: p.description ?? null,
          price: p.price ?? 0,
           purchasePrice: p.purchasePrice ?? 0,
          quantity: p.stock ?? p.quantity ?? 0,
          warehouseId: p.warehouseId ?? null,
          minThreshold: p.minThreshold ?? 0
        };
        this.displayDialog = true;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger le détail du produit',
          life: 4000
        });
      }
    });
  }

  openDetail(product: any) {
    this.detailDialogVisible = true;
    this.selectedProduct = this.normalizeProductDetail(product);
    this.detailLoading = true;
    this.cdr.markForCheck();

    this.apiService.get<any>(`/products/${product.id}`)
      .pipe(finalize(() => {
        this.detailLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
      next: (p) => {
        this.selectedProduct = this.normalizeProductDetail(p);
        this.cdr.markForCheck();
      },
      error: () => {
        this.detailDialogVisible = false;
        this.selectedProduct = null;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger le détail du produit',
          life: 4000
        });
        this.cdr.markForCheck();
      }
    });
  }

  private normalizeProductDetail(p: any): any {
    return {
      ...p,
      status: p.statusLabel || p.statusCode || p.status || 'N/A',
      stock: p.stock ?? 0,
      warehouseStocks: p.warehouseStocks ?? [],
      price: p.price ?? 0,
      purchasePrice: p.purchasePrice ?? 0,
      minThreshold: p.minThreshold ?? 0,
      lowStock: !!p.lowStock
    };
  }

  closeDetail(): void {
    this.detailDialogVisible = false;
    this.selectedProduct = null;
    this.detailLoading = false;
    this.cdr.markForCheck();
  }

  editFromDetail(): void {
    if (!this.selectedProduct) return;
    const product = { ...this.selectedProduct };
    this.closeDetail();
    this.editProduct(product);
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatMoney(value: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value) || 0) + ' F';
  }

  hasUpdatedAt(product: { createdAt?: string | null; updatedAt?: string | null }): boolean {
    if (!product.updatedAt) return false;
    if (!product.createdAt) return true;
    return new Date(product.updatedAt).getTime() > new Date(product.createdAt).getTime();
  }

  saveProduct() {
    if (!this.product.name) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Champs manquants',
        detail: 'Veuillez remplir le nom du produit pour continuer.',
        life: 5000
      });
      return;
    }

    if (!this.product.id && !this.isCreateNumericFieldsValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'La quantité initiale, le seuil minimum, le prix d\'achat et le prix de vente doivent être supérieurs à 0.',
        life: 5000
      });
      return;
    }
    
    const productData: any = {
      name: this.product.name,
      categoryCode: this.product.categoryCode || null,
      description: this.product.description || null,
      price: this.product.price ?? 0,
      purchasePrice: this.product.purchasePrice ?? 0,
      warehouseId: this.product.warehouseId || null,
      quantity: this.product.quantity != null ? this.product.quantity : 0,
      minThreshold: this.product.minThreshold != null ? this.product.minThreshold : 0
    };

    if (this.isLossPricing()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Avertissement',
        detail: 'Le prix de vente est inférieur au prix d\'achat. Cette vente se fera à perte.',
        life: 4500
      });
    }

    if (!this.product.id) {
      // Création
      this.apiService.post<any>('/products', productData).subscribe({
        next: (createdProduct) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Produit ajouté',
            detail: `Le produit "${createdProduct.name}" a été ajouté avec succès !`,
            life: 4000
          });
          this.displayDialog = false;
          this.product = {};
          this.refreshProducts(); // Recharger la liste
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Une erreur est survenue lors de la création du produit';
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
      this.apiService.put<any>(`/products/${this.product.id}`, productData).subscribe({
        next: (updatedProduct) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Produit modifié',
            detail: `Les informations du produit "${updatedProduct.name}" ont été mises à jour.`,
            life: 4000
          });
          this.displayDialog = false;
          this.product = {};
          this.refreshProducts(); // Recharger la liste
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Une erreur est survenue lors de la mise à jour du produit';
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

  deleteProduct(product: any) {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ? Cette action est irréversible.`,
      header: 'Confirmer la suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Non, annuler',
      accept: () => {
        this.apiService.delete(`/products/${product.id}`).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Produit supprimé',
              detail: `Le produit "${product.name}" a été supprimé.`,
              life: 4000
            });
            this.refreshProducts(); // Recharger la liste
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
  
  getWarehouseName(warehouseId: number): string {
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : `Entrepôt ${warehouseId}`;
  }
  
  isFormValid(): boolean {
    if (!this.product.name?.trim()) {
      return false;
    }
    if (this.product.id) {
      return this.product.quantity !== undefined
        && this.product.quantity !== null
        && this.product.quantity >= 0;
    }
    return this.isCreateNumericFieldsValid();
  }

  isCreatingProduct(): boolean {
    return !this.product.id;
  }

  private isPositiveNumber(value: unknown): boolean {
    const n = Number(value);
    return Number.isFinite(n) && n > 0;
  }

  private isCreateNumericFieldsValid(): boolean {
    return this.isPositiveNumber(this.product.quantity)
      && this.isPositiveNumber(this.product.minThreshold)
      && this.isPositiveNumber(this.product.purchasePrice)
      && this.isPositiveNumber(this.product.price);
  }

  isLossPricing(): boolean {
    return this.isLossPricingFor(this.product);
  }

  isLossPricingFor(product: { purchasePrice?: number; price?: number }): boolean {
    const purchase = Number(product.purchasePrice ?? 0);
    const selling = Number(product.price ?? 0);
    return purchase > 0 && selling >= 0 && selling < purchase;
  }

}

