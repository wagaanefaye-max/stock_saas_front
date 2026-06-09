import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiService } from '../../services/api.service';
@Component({
  selector: 'app-inventories',
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
    DatePickerModule,
    TextareaModule,
    ToastModule,
    SelectButtonModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  templateUrl: './inventories.component.html',
  styleUrl: './inventories.component.scss'
})
export class InventoriesComponent implements OnInit {
  inventories: any[] = [];
  warehouses: any[] = [];
  /** Options pour le filtre entrepôt (Tous + liste des entrepôts) */
  warehouseFilterOptions: { label: string; value: number | null }[] = [];
  /** Filtre texte (client-side sur la liste chargée) */
  globalFilter = '';
  /** Filtres envoyés au backend */
  warehouseFilter: number | null = null;
  statusFilter: 'ALL' | 'DRAFT' | 'IN_PROGRESS' | 'CLOSED' = 'ALL';
  statusFilterOptions = [
    { label: 'Tous', value: 'ALL' },
    { label: 'En cours', value: 'IN_PROGRESS' },
    { label: 'Clôturé', value: 'CLOSED' },
    { label: 'Brouillon', value: 'DRAFT' }
  ];

  displayCreateDialog = false;
  displayDetailDialog = false;

  createForm: any = {
    warehouseId: null,
    inventoryDate: new Date(),
    notes: null
  };

  selectedInventory: any = null;
  savingLines = false;
  closing = false;

  constructor(
    private apiService: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadInventories();
    this.loadWarehouses();
  }

  loadWarehouses() {
    this.apiService.get<any[]>('/warehouses/simple').subscribe({
      next: (data) => {
        this.warehouses = (data || []).map((w: any) => ({ id: w.id, name: w.name }));
        this.warehouseFilterOptions = [
          { label: 'Tous les entrepôts', value: null },
          ...this.warehouses.map(w => ({ label: w.name, value: w.id }))
        ];
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les entrepôts'
        });
      }
    });
  }

  loadInventories() {
    const params: Record<string, string | number | null> = {};
    if (this.warehouseFilter != null) params['warehouseId'] = this.warehouseFilter;
    if (this.statusFilter !== 'ALL') params['status'] = this.statusFilter;
    this.apiService.get<any[]>('/inventories', params).subscribe({
      next: (data) => {
        this.inventories = (data || []).map(inv => ({
          id: inv.id,
          warehouseId: inv.warehouseId,
          warehouseName: inv.warehouseName,
          inventoryDate: inv.inventoryDate,
          status: inv.status,
          statusLabel: inv.statusLabel,
          createdByName: inv.createdByName,
          closedAt: inv.closedAt,
          notes: inv.notes,
          createdAt: inv.createdAt,
          lines: inv.lines || []
        }));
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les inventaires'
        });
      }
    });
  }

  openCreate() {
    this.createForm = {
      warehouseId: null,
      inventoryDate: new Date(),
      notes: null
    };
    this.displayCreateDialog = true;
  }

  createInventory() {
    if (!this.createForm.warehouseId || !this.createForm.inventoryDate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Veuillez sélectionner un entrepôt et une date'
      });
      return;
    }
    const date = this.createForm.inventoryDate instanceof Date
      ? this.createForm.inventoryDate
      : new Date(this.createForm.inventoryDate);
    const inventoryDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    this.apiService.post<any>('/inventories', {
      warehouseId: this.createForm.warehouseId,
      inventoryDate,
      notes: this.createForm.notes || null
    }).subscribe({
      next: (inv) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Inventaire créé'
        });
        this.displayCreateDialog = false;
        this.loadInventories();
        this.openDetail(inv);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error?.message || 'Création impossible'
        });
      }
    });
  }

  openDetail(inventory: any) {
    this.apiService.get<any>(`/inventories/${inventory.id}`).subscribe({
      next: (inv) => {
        this.selectedInventory = {
          ...inv,
          lines: (inv.lines || []).map((l: any) => ({
            ...l,
            countedQuantityEdit: l.countedQuantity != null ? l.countedQuantity : l.theoreticalQuantity
          }))
        };
        this.displayDetailDialog = true;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger l\'inventaire'
        });
      }
    });
  }

  /** Met à jour la quantité comptée d'une ligne (liaison explicite pour p-table). */
  updateLineCountedQuantity(productId: number, value: number | null) {
    if (!this.selectedInventory?.lines) return;
    const line = this.selectedInventory.lines.find((l: any) => l.productId === productId);
    if (line) line.countedQuantityEdit = value != null ? value : line.theoreticalQuantity;
  }

  saveLines() {
    if (!this.selectedInventory || this.selectedInventory.status === 'CLOSED') return;
    this.savingLines = true;
    const lines = (this.selectedInventory.lines || []).map((l: any) => ({
      productId: Number(l.productId),
      countedQuantity: l.countedQuantityEdit != null && l.countedQuantityEdit !== '' ? Number(l.countedQuantityEdit) : (l.theoreticalQuantity != null ? Number(l.theoreticalQuantity) : 0)
    }));
    this.apiService.patch<any>(`/inventories/${this.selectedInventory.id}/lines`, { lines }).subscribe({
      next: (inv) => {
        this.selectedInventory = {
          ...inv,
          lines: (inv.lines || []).map((l: any) => ({
            ...l,
            countedQuantityEdit: l.countedQuantity != null ? l.countedQuantity : l.theoreticalQuantity
          }))
        };
        this.savingLines = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Quantités enregistrées'
        });
        this.loadInventories();
      },
      error: () => {
        this.savingLines = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Enregistrement impossible'
        });
      }
    });
  }

  confirmCloseInventory() {
    if (!this.selectedInventory || this.selectedInventory.status === 'CLOSED') return;
    this.confirmationService.confirm({
      message: 'Les quantités comptées seront enregistrées, puis les écarts seront appliqués au stock (mouvements d\'ajustement). Cette action est irréversible. Clôturer l\'inventaire ?',
      header: 'Clôturer l\'inventaire',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, enregistrer et clôturer',
      rejectLabel: 'Annuler',
      accept: () => this.saveLinesThenClose()
    });
  }

  /** Enregistre les quantités puis clôture l'inventaire. */
  saveLinesThenClose() {
    if (!this.selectedInventory || this.selectedInventory.status === 'CLOSED') return;
    this.closing = true;
    const lines = (this.selectedInventory.lines || []).map((l: any) => ({
      productId: Number(l.productId),
      countedQuantity: l.countedQuantityEdit != null && l.countedQuantityEdit !== '' ? Number(l.countedQuantityEdit) : (l.theoreticalQuantity != null ? Number(l.theoreticalQuantity) : 0)
    }));
    this.apiService.patch<any>(`/inventories/${this.selectedInventory.id}/lines`, { lines }).subscribe({
      next: () => {
        this.apiService.post<any>(`/inventories/${this.selectedInventory.id}/close`, {}).subscribe({
          next: (inv) => {
            this.selectedInventory = inv;
            this.closing = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Quantités enregistrées et inventaire clôturé. Les ajustements de stock ont été appliqués.'
            });
            this.loadInventories();
          },
          error: (err) => {
            this.closing = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: err.error?.message || 'Clôture impossible'
            });
          }
        });
      },
      error: () => {
        this.closing = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible d\'enregistrer les quantités avant clôture'
        });
      }
    });
  }

  closeInventory() {
    if (!this.selectedInventory || this.selectedInventory.status === 'CLOSED') return;
    this.closing = true;
    this.apiService.post<any>(`/inventories/${this.selectedInventory.id}/close`, {}).subscribe({
      next: (inv) => {
        this.selectedInventory = inv;
        this.closing = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Inventaire clôturé. Les ajustements de stock ont été appliqués.'
        });
        this.loadInventories();
      },
      error: (err) => {
        this.closing = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error?.message || 'Clôture impossible'
        });
      }
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'secondary' | undefined {
    switch (status) {
      case 'CLOSED': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'DRAFT': return 'warn';
      default: return 'secondary';
    }
  }

  getDifferenceSeverity(diff: number): 'success' | 'danger' | 'info' | undefined {
    if (diff > 0) return 'success';
    if (diff < 0) return 'danger';
    return 'info';
  }

  canEdit(inv: any): boolean {
    return inv && inv.status !== 'CLOSED';
  }

  getLineDifference(line: any): number {
    const counted = line.countedQuantityEdit != null ? line.countedQuantityEdit : (line.countedQuantity ?? line.theoreticalQuantity);
    const theoretical = line.theoreticalQuantity ?? 0;
    return Number(counted) - Number(theoretical);
  }

  get filteredInventories(): any[] {
    const term = (this.globalFilter || '').toLowerCase().trim();
    if (!term) return this.inventories;
    return this.inventories.filter(
      inv =>
        (inv.warehouseName || '').toLowerCase().includes(term) ||
        (inv.statusLabel || '').toLowerCase().includes(term) ||
        (inv.createdByName || '').toLowerCase().includes(term)
    );
  }
}
