import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { APP_DIALOG_BREAKPOINTS, APP_DIALOG_STYLE_XL } from '../../utils/dialog-mobile.util';
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
    SelectModule,
    InputNumberModule,
    InputTextModule,
    SelectButtonModule,
    DatePickerModule,
    TextareaModule,
    ToastModule,
    PaginatorModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './movements.component.html',
  styleUrl: './movements.component.scss'
})
export class MovementsComponent implements OnInit {
  readonly dialogStyle = APP_DIALOG_STYLE_XL;
  readonly dialogBreakpoints = APP_DIALOG_BREAKPOINTS;

  movements: any[] = [];
  totalMovements = 0;
  rows = 10;
  first = 0;
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;
  selectedMovements: any[] = [];
  globalFilter = '';
  typeFilter = 'ALL';
  typeFilterChipOptions = [
    { label: 'Tous', value: 'ALL' },
    { label: 'Entrée', value: 'ENTREE' },
    { label: 'Sortie', value: 'SORTIE' },
    { label: 'Transfert', value: 'TRANSFERT' },
    { label: 'Ajust.', value: 'AJUSTEMENT' }
  ];
  
  // Liste des entrepôts accessibles pour le formulaire
  accessibleWarehouses: any[] = [];
  
  // Liste des produits disponibles
  products: any[] = [];

  displayDialog = false;
  movement: any = {};
  types: any[] = [];

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadAccessibleWarehouses();
    this.loadProducts();
    this.loadMovementTypes();

    // Vérifier si on doit ouvrir le formulaire automatiquement
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
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

  loadMovementTypes() {
    this.apiService.get<any[]>('/movements/types').subscribe({
      next: (data) => {
        this.types = data.map(t => {
          // Convertir le code du backend vers le format interne (majuscules)
          const internalCode = this.convertToInternalCode(t.code);
          return {
            label: t.label,
            value: internalCode,
            allowsNegative: t.allowsNegative,
            requiresDestination: t.requiresDestination,
            description: t.description
          };
        });
        // Si aucun type n'est chargé, définir le premier comme défaut
        if (this.types.length > 0 && !this.movement.typeCode) {
          this.movement.typeCode = this.types[0].value;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des types de mouvements', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les types de mouvements'
        });
      }
    });
  }

  convertToInternalCode(backendCode: string): string {
    switch (backendCode) {
      case 'Entrée':
        return 'ENTREE';
      case 'Sortie':
        return 'SORTIE';
      case 'Transfert':
        return 'TRANSFERT';
      case 'Ajustement':
        return 'AJUSTEMENT';
      default:
        return backendCode;
    }
  }

  loadMovements(event?: { first: number; rows: number }) {
    const first = event?.first ?? this.first;
    const rows = event?.rows ?? this.rows;
    const page = first / rows;
    const params: Record<string, string | number> = {
      page,
      size: rows
    };
    if (this.typeFilter && this.typeFilter !== 'ALL') {
      params['type'] = this.typeFilter;
    }
    if (this.globalFilter?.trim()) {
      params['search'] = this.globalFilter.trim();
    }
    this.apiService.get<{ content: any[]; totalElements: number }>('/movements', params).subscribe({
      next: (data) => {
        this.movements = (data?.content ?? []).map(m => ({
          id: m.id,
          date: m.date,
          product: m.productName,
          productId: m.productId,
          productSku: m.productSku,
          type: m.typeLabel || m.typeCode,
          typeCode: m.typeCode,
          quantity: m.quantity,
          warehouse: m.warehouseName,
          warehouseId: m.warehouseId,
          warehouseDestination: m.destinationWarehouseName,
          warehouseDestinationId: m.destinationWarehouseId,
          user: m.userName,
          userId: m.userId,
          justification: m.justification,
          createdAt: m.createdAt
        }));
        this.totalMovements = data?.totalElements ?? 0;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des mouvements', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les mouvements',
          life: 5000
        });
      }
    });
  }

  onMovementsLazyLoad(event: any) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
    this.loadMovements({ first: this.first, rows: this.rows });
  }

  private refreshMovements() {
    this.loadMovements({ first: this.first, rows: this.rows });
  }

  onTypeFilterChange() {
    this.first = 0;
    this.loadMovements({ first: 0, rows: this.rows });
  }

  onSearchInput() {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.first = 0;
      this.loadMovements({ first: 0, rows: this.rows });
    }, 400);
  }

  trackByMovementId(_index: number, movement: { id?: number }): number {
    return movement.id ?? _index;
  }

  loadAccessibleWarehouses() {
    this.apiService.get<any[]>('/warehouses/simple').subscribe({
      next: (data) => {
        this.accessibleWarehouses = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des entrepôts', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les entrepôts'
        });
      }
    });
  }

  loadProducts() {
    // Charger tous les produits de l'entreprise sans filtrage par entrepôt
    // car les produits sont globaux, seul le stock est par entrepôt
    this.apiService.get<any[]>('/products?all=true').subscribe({
      next: (data) => {
        this.products = data.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku
        }));
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les produits'
        });
      }
    });
  }

  getSeverity(type: string): 'success' | 'danger' | 'info' | 'warn' | undefined {
    switch (type) {
      case 'ENTREE':
      case 'Entrée':
        return 'success';
      case 'SORTIE':
      case 'Sortie':
        return 'danger';
      case 'TRANSFERT':
      case 'Transfert':
        return 'info';
      case 'AJUSTEMENT':
      case 'Ajustement':
        return 'warn';
      default:
        return undefined;
    }
  }

  openNew() {
    // Utiliser le premier type disponible ou 'ENTREE' par défaut
    const defaultType = this.types.length > 0 ? this.types[0].value : 'ENTREE';
    this.movement = {
      typeCode: defaultType,
      warehouseId: null,
      destinationWarehouseId: null,
      date: new Date(),
      quantity: 1
    };
    this.displayDialog = true;
  }

  onWarehouseChange() {
    // Réinitialiser l'entrepôt de destination si l'entrepôt d'origine change et qu'il était sélectionné
    if (this.movement.destinationWarehouseId === this.movement.warehouseId) {
      this.movement.destinationWarehouseId = null;
    }
  }

  saveMovement() {
    if (!this.movement.typeCode || !this.movement.productId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Veuillez remplir tous les champs obligatoires (type, produit)'
      });
      return;
    }

    // Trouver le type de mouvement sélectionné
    const selectedType = this.getSelectedMovementType();
    
    if (selectedType?.requiresDestination && !this.movement.destinationWarehouseId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Pour un transfert, vous devez choisir l\'entrepôt de destination'
      });
      return;
    }

    // Validation : pour un transfert, l'entrepôt d'origine et de destination doivent être différents
    if (selectedType?.requiresDestination && this.movement.warehouseId && this.movement.warehouseId === this.movement.destinationWarehouseId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'L\'entrepôt d\'origine et l\'entrepôt de destination doivent être différents'
      });
      return;
    }

    if (!selectedType?.allowsNegative && (!this.movement.quantity || this.movement.quantity <= 0)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'La quantité doit être supérieure à 0'
      });
      return;
    }

    // Préparer la date
    let movementDate: string;
    if (this.movement.date instanceof Date) {
      const year = this.movement.date.getFullYear();
      const month = String(this.movement.date.getMonth() + 1).padStart(2, '0');
      const day = String(this.movement.date.getDate()).padStart(2, '0');
      movementDate = `${year}-${month}-${day}`;
    } else if (typeof this.movement.date === 'string') {
      movementDate = this.movement.date;
    } else {
      movementDate = new Date().toISOString().split('T')[0];
    }

    const request = {
      typeCode: this.movement.typeCode,
      productId: this.movement.productId,
      quantity: this.movement.quantity,
      date: movementDate,
      warehouseId: selectedType?.value === 'TRANSFERT' ? null : this.movement.warehouseId,
      destinationWarehouseId: selectedType?.requiresDestination ? this.movement.destinationWarehouseId : null,
      justification: this.movement.justification || null
    };

    this.apiService.post<any>('/movements', request).subscribe({
      next: (data) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Mouvement créé avec succès'
        });
        this.displayDialog = false;
        this.movement = {};
        this.refreshMovements();
      },
      error: (error) => {
        console.error('Erreur lors de la création du mouvement', error);
        const errorMessage = error.error?.message || error.message || 'Une erreur est survenue lors de la création du mouvement';
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: errorMessage
        });
      }
    });
  }

  getSelectedMovementType(): any {
    return this.types.find(t => t.value === this.movement.typeCode);
  }

  getMinQuantity(): number {
    const selectedType = this.getSelectedMovementType();
    return selectedType?.allowsNegative ? -999999 : 1;
  }

  allowsNegativeQuantity(): boolean {
    const selectedType = this.getSelectedMovementType();
    return selectedType?.allowsNegative || false;
  }

  getSourceWarehouseLabel(): string {
    if (this.movement.typeCode !== 'TRANSFERT') {
      return '';
    }
    if (this.movement.warehouseId && this.accessibleWarehouses?.length) {
      const w = this.accessibleWarehouses.find((wh: any) => wh.id === this.movement.warehouseId);
      return w?.name || 'Entrepôt source';
    }
    return 'Déterminé automatiquement selon le stock du produit';
  }

  onProductChange() {
    if (!this.movement.productId) {
      this.movement.warehouseId = null;
      return;
    }
    this.apiService.get<any>(`/products/${this.movement.productId}`).subscribe({
      next: (p) => {
        if (p && p.warehouseId) {
          this.movement.warehouseId = p.warehouseId;
        } else {
          this.movement.warehouseId = null;
        }
      },
      error: () => {
        this.movement.warehouseId = null;
      }
    });
  }

  requiresDestination(): boolean {
    const selectedType = this.getSelectedMovementType();
    return selectedType?.requiresDestination || false;
  }

  getAvailableDestinationWarehouses(): any[] {
    // Pour un transfert, exclure l'entrepôt d'origine de la liste des destinations possibles
    if (this.requiresDestination() && this.movement.warehouseId) {
      return this.accessibleWarehouses.filter(w => w.id !== this.movement.warehouseId);
    }
    return this.accessibleWarehouses;
  }

  isFormValid(): boolean {
    if (!this.movement.typeCode || !this.movement.productId) {
      return false;
    }

    const selectedType = this.getSelectedMovementType();
    // Pour les types autres que TRANSFERT, l'entrepôt source doit être renseigné
    if (selectedType?.value !== 'TRANSFERT' && !this.movement.warehouseId) {
      return false;
    }
    
    // Vérifier la quantité selon le type
    if (selectedType?.allowsNegative) {
      // Pour AJUSTEMENT, la quantité peut être négative
      if (!this.movement.quantity || this.movement.quantity === 0) {
        return false;
      }
    } else {
      // Pour les autres types, la quantité doit être positive
      if (!this.movement.quantity || this.movement.quantity <= 0) {
        return false;
      }
    }

    // Vérifier l'entrepôt de destination si requis
    if (selectedType?.requiresDestination && !this.movement.destinationWarehouseId) {
      return false;
    }

    // Pour un transfert, l'entrepôt d'origine et de destination doivent être différents
    if (selectedType?.requiresDestination && this.movement.warehouseId === this.movement.destinationWarehouseId) {
      return false;
    }

    return true;
  }
}

