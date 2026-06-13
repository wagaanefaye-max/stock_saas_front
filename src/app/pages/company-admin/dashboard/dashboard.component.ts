import { Component, HostListener, OnInit } from '@angular/core';
import { buildDoughnutChartOptions, buildLineChartOptions } from '../../../utils/chart-options.util';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { SubscriptionService, SubscriptionStatus } from '../../../services/subscription.service';

interface DashboardInvoice {
  id: number;
  status: string;
  statusLabel?: string;
  total: number;
  invoiceDate: string;
  invoiceNumber?: string;
  clientName?: string | null;
}

interface DashboardProduct {
  id: number;
  name?: string;
  stock?: number | null;
  minThreshold?: number | null;
  lowStock?: boolean;
}

interface DashboardStats {
  totalProducts: number;
  totalWarehouses: number;
  monthlyMovements: number;
  alerts: number;
  activeUsers: number;
  monthlyMovementsData: { month: string; entries: number; exits: number; transfers: number; adjustments: number }[];
  productsByCategory: { category: string; count: number }[];
  recentMovements: {
    id: number;
    date: string;
    productName: string;
    movementType: string;
    quantity: number;
    warehouseName: string;
  }[];
  paidRevenue?: number;
  pendingRevenue?: number;
  paidInvoicesCount?: number;
  draftInvoicesCount?: number;
  sentInvoicesCount?: number;
  cancelledInvoicesCount?: number;
  salesByMonth?: { monthKey: string; label: string; amount: number }[];
  pendingInvoices?: DashboardInvoice[];
  recentInvoices?: DashboardInvoice[];
  lowStockItems?: DashboardProduct[];
}

interface DashboardStatCard {
  title: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
  alert?: boolean;
}

@Component({
  selector: 'app-company-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastModule, CardModule, ChartModule, TagModule],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class CompanyAdminDashboardComponent implements OnInit {
  loading = true;

  lowStockItems: DashboardProduct[] = [];
  recentInvoices: DashboardInvoice[] = [];
  pendingInvoices: DashboardInvoice[] = [];
  recentMovements: DashboardStats['recentMovements'] = [];

  subscriptionStatus: SubscriptionStatus | null = null;

  totalProducts = 0;
  totalWarehouses = 0;
  monthlyMovements = 0;
  stockAlerts = 0;

  paidInvoices = 0;
  draftInvoices = 0;
  sentInvoices = 0;
  cancelledInvoices = 0;
  paidRevenue = 0;
  pendingRevenue = 0;
  lowStockProducts = 0;

  salesStats: DashboardStatCard[] = [];
  stockStats: DashboardStatCard[] = [];

  salesByMonthData: any;
  statusChartData: any;
  movementsChartData: any;
  chartOptions: any;
  doughnutChartOptions: any;
  movementsChartOptions: any;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private messageService: MessageService
  ) {}

  get companyName(): string {
    return this.authService.getCurrentUser()?.companyName || 'votre entreprise';
  }

  ngOnInit(): void {
    this.refreshChartOptions();
    this.loadDashboardData();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.refreshChartOptions();
  }

  private loadDashboardData(): void {
    this.loading = true;

    forkJoin({
      stats: this.apiService.get<DashboardStats>('/dashboard/stats').pipe(catchError(() => of(null))),
      subscription: this.subscriptionService.getStatus().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ stats, subscription }) => {
        this.subscriptionStatus = subscription;
        this.applyStats(stats);
        this.buildStatCards();
        this.buildStatusChart();
        this.buildMovementsChart(stats?.monthlyMovementsData || []);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger le tableau de bord.'
        });
      }
    });
  }

  private applyStats(stats: DashboardStats | null): void {
    if (!stats) {
      return;
    }
    this.totalProducts = stats.totalProducts || 0;
    this.totalWarehouses = stats.totalWarehouses || 0;
    this.monthlyMovements = stats.monthlyMovements || 0;
    this.stockAlerts = stats.alerts || 0;
    this.recentMovements = stats.recentMovements || [];

    this.paidRevenue = Number(stats.paidRevenue) || 0;
    this.pendingRevenue = Number(stats.pendingRevenue) || 0;
    this.paidInvoices = stats.paidInvoicesCount || 0;
    this.draftInvoices = stats.draftInvoicesCount || 0;
    this.sentInvoices = stats.sentInvoicesCount || 0;
    this.cancelledInvoices = stats.cancelledInvoicesCount || 0;

    this.pendingInvoices = stats.pendingInvoices || [];
    this.recentInvoices = stats.recentInvoices || [];
    this.lowStockItems = (stats.lowStockItems || []).map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock != null ? Number(p.stock) : null,
      minThreshold: p.minThreshold != null ? Number(p.minThreshold) : null,
      lowStock: true
    }));
    this.lowStockProducts = this.stockAlerts || this.lowStockItems.length;

    this.buildSalesByMonthChart(stats.salesByMonth || []);
  }

  private buildSalesByMonthChart(salesByMonth: NonNullable<DashboardStats['salesByMonth']>): void {
    if (!salesByMonth.length) {
      this.salesByMonthData = {
        labels: [],
        datasets: [
          {
            label: 'Ventes payées (FCFA)',
            data: [],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            tension: 0.3,
            fill: true
          }
        ]
      };
      return;
    }

    this.salesByMonthData = {
      labels: salesByMonth.map(m => m.label),
      datasets: [
        {
          label: 'Ventes payées (FCFA)',
          data: salesByMonth.map(m => Number(m.amount) || 0),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  }

  private buildStatCards(): void {
    const alertCount = this.stockAlerts || this.lowStockProducts;

    this.salesStats = [
      {
        title: 'Ventes encaissées',
        value: `${this.formatMoney(this.paidRevenue)} F`,
        sub: `${this.paidInvoices} facture(s) payée(s)`,
        icon: 'pi pi-wallet',
        color: '#16a34a'
      },
      {
        title: 'Impayées',
        value: `${this.formatMoney(this.pendingRevenue)} F`,
        sub: `${this.sentInvoices} envoyée(s)`,
        icon: 'pi pi-clock',
        color: '#f59e0b'
      },
      {
        title: 'Brouillons',
        value: String(this.draftInvoices),
        sub: 'À finaliser',
        icon: 'pi pi-pencil',
        color: '#64748b'
      },
      {
        title: 'Factures payées',
        value: String(this.paidInvoices),
        sub: 'Total validé',
        icon: 'pi pi-check-circle',
        color: '#2563eb'
      }
    ];

    this.stockStats = [
      {
        title: 'Produits',
        value: String(this.totalProducts),
        sub: 'Dans le catalogue',
        icon: 'pi pi-box',
        color: '#2563eb'
      },
      {
        title: 'Entrepôts',
        value: String(this.totalWarehouses),
        sub: 'Points de stockage',
        icon: 'pi pi-building',
        color: '#7c3aed'
      },
      {
        title: 'Mouvements (mois)',
        value: String(this.monthlyMovements),
        sub: 'Ce mois-ci',
        icon: 'pi pi-sync',
        color: '#0891b2'
      },
      {
        title: 'Alertes stock bas',
        value: String(alertCount),
        sub: alertCount > 0 ? 'À réapprovisionner' : 'Tout est OK',
        icon: 'pi pi-exclamation-triangle',
        color: alertCount > 0 ? '#dc2626' : '#16a34a',
        alert: alertCount > 0
      }
    ];
  }

  private buildStatusChart(): void {
    this.statusChartData = {
      labels: ['Payées', 'Brouillons', 'Envoyées', 'Annulées'],
      datasets: [
        {
          data: [this.paidInvoices, this.draftInvoices, this.sentInvoices, this.cancelledInvoices],
          backgroundColor: ['#16a34a', '#94a3b8', '#f59e0b', '#dc2626']
        }
      ]
    };
  }

  private buildMovementsChart(monthlyData: DashboardStats['monthlyMovementsData']): void {
    const emptyMovementDatasets = [
      {
        label: 'Entrées',
        data: new Array(6).fill(0),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Sorties',
        data: new Array(6).fill(0),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.08)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Transferts',
        data: new Array(6).fill(0),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.08)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Ajustements',
        data: new Array(6).fill(0),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        tension: 0.3,
        fill: true
      }
    ];

    if (!monthlyData.length) {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
      this.movementsChartData = {
        labels: months,
        datasets: emptyMovementDatasets
      };
      return;
    }

    this.movementsChartData = {
      labels: monthlyData.map(d => d.month),
      datasets: [
        {
          label: 'Entrées',
          data: monthlyData.map(d => d.entries || 0),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Sorties',
          data: monthlyData.map(d => d.exits || 0),
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Transferts',
          data: monthlyData.map(d => d.transfers || 0),
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.08)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Ajustements',
          data: monthlyData.map(d => d.adjustments || 0),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  }

  private refreshChartOptions(): void {
    this.chartOptions = { ...buildLineChartOptions({ legendPosition: 'bottom' }) };
    this.doughnutChartOptions = { ...buildDoughnutChartOptions() };
    this.movementsChartOptions = { ...buildLineChartOptions({ legendPosition: 'bottom' }) };
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value || 0);
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  }

  getInvoiceStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'PAID': return 'success';
      case 'SENT': return 'warn';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  }

  getInvoiceStatusLabel(inv: DashboardInvoice): string {
    return inv.statusLabel || this.defaultStatusLabel(inv.status);
  }

  private defaultStatusLabel(status: string): string {
    switch (status) {
      case 'PAID': return 'Payée';
      case 'SENT': return 'Envoyée';
      case 'CANCELLED': return 'Annulée';
      default: return 'Brouillon';
    }
  }
}
