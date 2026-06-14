import { Component, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnInit } from '@angular/core';
import { buildDoughnutChartOptions, buildLineChartOptions } from '../../utils/chart-options.util';
import { BRAND, CHART_PALETTE, MOVEMENT_SERIES, brandMovementPointDataset } from '../../utils/chart-colors.util';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { RequestCacheService } from '../../services/request-cache.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ChartModule, ButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  stats: any[] = [];
  recentMovements: any[] = [];

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private requestCache: RequestCacheService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.refreshChartOptions();
    this.loadStats();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.refreshChartOptions();
    this.cdr.markForCheck();
  }

  loadStats(forceRefresh = false) {
    if (forceRefresh) {
      this.requestCache.invalidate('gestionnaire-dashboard-stats');
    }

    this.requestCache
      .get('gestionnaire-dashboard-stats', () =>
        this.apiService.get<any>('/dashboard/stats').pipe(
          catchError(error => {
            console.error('Erreur lors du chargement des statistiques:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de charger les statistiques'
            });
            return of({
              totalProducts: 0,
              totalWarehouses: 0,
              monthlyMovements: 0,
              alerts: 0,
              monthlyMovementsData: [],
              productsByCategory: [],
              recentMovements: [],
              productsChange: '0%',
              warehousesChange: '0',
              movementsChange: '0%',
              alertsChange: '0'
            });
          })
        )
      )
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe(data => {
        const user = this.authService.getCurrentUser();
        const accessibleIds = this.authService.getAccessibleWarehouseIds();
        
        // Formater les valeurs avec des séparateurs de milliers
        const formatNumber = (num: number) => num.toLocaleString('fr-FR');
        
        if (this.authService.isAdminEntreprise()) {
          this.stats = [
            {
              title: 'Produits totaux',
              value: formatNumber(data.totalProducts || 0),
              icon: 'pi pi-box',
              color: 'var(--primary)',
              change: data.productsChange || '+0%'
            },
            {
              title: 'Entrepôts',
              value: formatNumber(data.totalWarehouses || 0),
              icon: 'pi pi-building',
              color: 'var(--secondary)',
              change: data.warehousesChange || '+0'
            },
            {
              title: 'Mouvements (mois)',
              value: formatNumber(data.monthlyMovements || 0),
              icon: 'pi pi-arrows-h',
              color: 'var(--warning)',
              change: data.movementsChange || '+0%'
            },
            {
              title: 'Alertes',
              value: formatNumber(data.alerts || 0),
              icon: 'pi pi-exclamation-triangle',
              color: 'var(--danger)',
              change: data.alertsChange || '0'
            }
          ];
        } else {
          const warehouseCount = accessibleIds === null ? data.totalWarehouses : (accessibleIds.length || 0);
          this.stats = [
            {
              title: 'Produits (mes entrepôts)',
              value: formatNumber(data.totalProducts || 0),
              icon: 'pi pi-box',
              color: 'var(--primary)',
              change: data.productsChange || '+0%'
            },
            {
              title: 'Entrepôts assignés',
              value: formatNumber(warehouseCount),
              icon: 'pi pi-building',
              color: 'var(--secondary)',
              change: ''
            },
            {
              title: 'Mouvements (mois)',
              value: formatNumber(data.monthlyMovements || 0),
              icon: 'pi pi-arrows-h',
              color: 'var(--warning)',
              change: data.movementsChange || '+0%'
            },
            {
              title: 'Alertes',
              value: formatNumber(data.alerts || 0),
              icon: 'pi pi-exclamation-triangle',
              color: 'var(--danger)',
              change: data.alertsChange || '0'
            }
          ];
        }
        
        // Mettre à jour les mouvements récents
        this.recentMovements = data.recentMovements || [];
        
        // Mettre à jour les graphiques avec les données réelles
        if (data.monthlyMovementsData && data.monthlyMovementsData.length > 0) {
          this.updateChartData(data.monthlyMovementsData);
        } else {
          // Initialiser avec des données vides si aucune donnée
          this.updateChartData([]);
        }
        
        if (data.productsByCategory && data.productsByCategory.length > 0) {
          this.updateCategoryChartData(data.productsByCategory);
        } else {
          // Initialiser avec des données vides si aucune donnée
          this.updateCategoryChartData([]);
        }
      });
  }
  
  updateChartData(monthlyData: any[]) {
    const emptyDatasets = [
      brandMovementPointDataset('Entrées', MOVEMENT_SERIES.entries, new Array(6).fill(0)),
      brandMovementPointDataset('Sorties', MOVEMENT_SERIES.exits, new Array(6).fill(0)),
      brandMovementPointDataset('Transferts', MOVEMENT_SERIES.transfers, new Array(6).fill(0)),
      brandMovementPointDataset('Ajustements', MOVEMENT_SERIES.adjustments, new Array(6).fill(0))
    ];

    if (monthlyData.length === 0) {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
      this.chartData = {
        labels: months,
        datasets: emptyDatasets
      };
    } else {
      this.chartData = {
        labels: monthlyData.map(d => d.month),
        datasets: [
          brandMovementPointDataset('Entrées', MOVEMENT_SERIES.entries, monthlyData.map(d => d.entries || 0)),
          brandMovementPointDataset('Sorties', MOVEMENT_SERIES.exits, monthlyData.map(d => d.exits || 0)),
          brandMovementPointDataset('Transferts', MOVEMENT_SERIES.transfers, monthlyData.map(d => d.transfers || 0)),
          brandMovementPointDataset('Ajustements', MOVEMENT_SERIES.adjustments, monthlyData.map(d => d.adjustments || 0))
        ]
      };
    }
  }
  
  updateCategoryChartData(categoryData: any[]) {
    if (categoryData.length === 0) {
      this.categoryChartData = {
        labels: ['Aucune catégorie'],
        datasets: [{
          data: [1],
          backgroundColor: [BRAND.border],
          borderWidth: 2,
          borderColor: BRAND.white
        }]
      };
    } else {
      this.categoryChartData = {
        labels: categoryData.map(d => d.category),
        datasets: [{
          data: categoryData.map(d => d.count || 0),
          backgroundColor: categoryData.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
          borderWidth: 2,
          borderColor: BRAND.white
        }]
      };
    }
  }

  chartData: any;
  chartOptions: any;
  categoryChartData: any;
  categoryChartOptions: any;

  refreshChartOptions(): void {
    this.chartOptions = {
      ...buildLineChartOptions({ legendPosition: 'bottom' })
    };
    this.categoryChartOptions = { ...buildDoughnutChartOptions() };
  }

  initCharts() {
    this.refreshChartOptions();

    this.chartData = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
      datasets: [
        brandMovementPointDataset('Entrées', MOVEMENT_SERIES.entries, [65, 59, 80, 81, 56, 55]),
        brandMovementPointDataset('Sorties', MOVEMENT_SERIES.exits, [28, 48, 40, 19, 86, 27])
      ]
    };

    this.categoryChartData = {
      labels: ['Électronique', 'Vêtements', 'Alimentaire', 'Autres'],
      datasets: [{
        data: [300, 450, 280, 204],
        backgroundColor: CHART_PALETTE.slice(0, 4),
        borderWidth: 2,
        borderColor: BRAND.white
      }]
    };

  }

  trackByStatTitle(_index: number, stat: { title: string }): string {
    return stat.title;
  }

  trackByMovementId(_index: number, movement: { id?: number }): number {
    return movement.id ?? _index;
  }
}

