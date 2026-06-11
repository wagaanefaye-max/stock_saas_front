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
  monthlyMovementsData: { month: string; entries: number; exits: number }[];
  productsByCategory: { category: string; count: number }[];
  recentMovements: {
    id: number;
    date: string;
    productName: string;
    movementType: string;
    quantity: number;
    warehouseName: string;
  }[];
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

  invoices: DashboardInvoice[] = [];
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
      invoices: this.apiService.get<DashboardInvoice[]>('/invoices').pipe(catchError(() => of([]))),
      products: this.apiService.get<DashboardProduct[]>('/products').pipe(catchError(() => of([]))),
      stats: this.apiService.get<DashboardStats>('/dashboard/stats').pipe(catchError(() => of(null))),
      subscription: this.subscriptionService.getStatus().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ invoices, products, stats, subscription }) => {
        this.invoices = invoices || [];
        this.subscriptionStatus = subscription;
        this.applyStats(stats);
        this.applyProducts(products || []);
        this.computeInvoiceKpis();
        this.buildInvoiceLists();
        this.buildSalesByMonthChart();
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
  }

  private applyProducts(products: DashboardProduct[]): void {
    const lowStock = products.filter(p => p.lowStock || this.isProductLowStock(p));
    this.lowStockProducts = lowStock.length;
    this.lowStockItems = lowStock
      .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0))
      .slice(0, 8);
  }

  private computeInvoiceKpis(): void {
    this.paidInvoices = this.invoices.filter(i => i.status === 'PAID').length;
    this.draftInvoices = this.invoices.filter(i => i.status === 'DRAFT').length;
    this.sentInvoices = this.invoices.filter(i => i.status === 'SENT').length;
    this.cancelledInvoices = this.invoices.filter(i => i.status === 'CANCELLED').length;

    this.paidRevenue = this.invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    this.pendingRevenue = this.invoices
      .filter(i => i.status === 'SENT')
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  }

  private buildInvoiceLists(): void {
    const sorted = [...this.invoices].sort(
      (a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
    );
    this.recentInvoices = sorted.slice(0, 5);
    this.pendingInvoices = sorted
      .filter(i => i.status === 'SENT' || i.status === 'DRAFT')
      .slice(0, 5);
  }

  private buildSalesByMonthChart(): void {
    const monthlyMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, 0);
    }

    this.invoices
      .filter(i => i.status === 'PAID' && !!i.invoiceDate)
      .forEach(i => {
        const d = new Date(i.invoiceDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap.has(key)) {
          monthlyMap.set(key, (monthlyMap.get(key) || 0) + (Number(i.total) || 0));
        }
      });

    const labels = Array.from(monthlyMap.keys()).map(k => {
      const [y, m] = k.split('-');
      return `${m}/${y.slice(2)}`;
    });

    this.salesByMonthData = {
      labels,
      datasets: [
        {
          label: 'Ventes payées (FCFA)',
          data: Array.from(monthlyMap.values()),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          tension: 0.3,
          fill: true
        }
      ]
    };
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
    if (!monthlyData.length) {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
      this.movementsChartData = {
        labels: months,
        datasets: [
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
          }
        ]
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

  private isProductLowStock(product: DashboardProduct): boolean {
    const min = Number(product.minThreshold) || 0;
    const stock = Number(product.stock) || 0;
    return min > 0 && stock <= min;
  }
}
