import { Component, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnInit } from '@angular/core';
import { buildDoughnutChartOptions, buildLineChartOptions } from '../../../utils/chart-options.util';
import { BRAND, MOVEMENT_SERIES, brandLineDataset, chartFill } from '../../../utils/chart-colors.util';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { RequestCacheService } from '../../../services/request-cache.service';
import { AuthService } from '../../../services/auth.service';
import { SubscriptionService, SubscriptionStatus } from '../../../services/subscription.service';
import { OnboardingService } from '../../../services/onboarding.service';
import {
  OnboardingChecklistComponent,
  OnboardingStepView
} from '../../../components/shared/onboarding-checklist.component';

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
  routerLink?: string;
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-company-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ChartModule, TagModule, OnboardingChecklistComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyAdminDashboardComponent implements OnInit {
  loading = true;

  lowStockItems: DashboardProduct[] = [];
  recentInvoices: DashboardInvoice[] = [];
  pendingInvoices: DashboardInvoice[] = [];
  recentMovements: DashboardStats['recentMovements'] = [];

  subscriptionStatus: SubscriptionStatus | null = null;
  showOnboarding = false;
  onboardingSteps: OnboardingStepView[] = [];

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
    private onboardingService: OnboardingService,
    private requestCache: RequestCacheService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
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
    this.cdr.markForCheck();
  }

  private loadDashboardData(forceRefresh = false): void {
    if (forceRefresh) {
      this.requestCache.invalidate('company-admin-dashboard-stats');
      this.requestCache.invalidate('company-admin-subscription-status');
    }

    this.loading = true;
    this.cdr.markForCheck();

    const includeOnboarding = this.onboardingService.shouldShowForAdmin();

    forkJoin({
      stats: this.requestCache.get('company-admin-dashboard-stats', () =>
        this.apiService.get<DashboardStats>('/dashboard/stats').pipe(catchError(() => of(null)))
      ),
      subscription: this.requestCache.get('company-admin-subscription-status', () =>
        this.subscriptionService.getStatus().pipe(catchError(() => of(null)))
      ),
      partners: includeOnboarding
        ? this.apiService.get<{ totalElements: number }>('/partners', { page: 0, size: 1 }).pipe(
            catchError(() => of({ totalElements: 0 }))
          )
        : of({ totalElements: 0 })
    })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
      next: ({ stats, subscription, partners }) => {
        this.subscriptionStatus = subscription;
        this.applyStats(stats);
        this.buildStatCards();
        this.buildStatusChart();
        this.buildMovementsChart(stats?.monthlyMovementsData || []);
        if (includeOnboarding) {
          this.buildOnboardingSteps(stats, partners?.totalElements ?? 0);
          this.showOnboarding = true;
        } else {
          this.showOnboarding = false;
          this.onboardingSteps = [];
        }
        this.cdr.markForCheck();
      },
      error: () => {
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
            borderColor: BRAND.primary,
            backgroundColor: chartFill(BRAND.primary, 0.2),
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
          borderColor: BRAND.primary,
          backgroundColor: chartFill(BRAND.primary, 0.2),
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
        color: BRAND.secondary,
        routerLink: '/company-admin/invoices',
        queryParams: { status: 'PAID' }
      },
      {
        title: 'Impayées',
        value: `${this.formatMoney(this.pendingRevenue)} F`,
        sub: `${this.sentInvoices} envoyée(s)`,
        icon: 'pi pi-clock',
        color: BRAND.warning,
        routerLink: '/company-admin/invoices',
        queryParams: { status: 'UNPAID' },
        alert: this.sentInvoices > 0
      },
      {
        title: 'Brouillons',
        value: String(this.draftInvoices),
        sub: 'À finaliser',
        icon: 'pi pi-pencil',
        color: BRAND.textMuted,
        routerLink: '/company-admin/invoices',
        queryParams: { status: 'DRAFT' },
        alert: this.draftInvoices > 0
      },
      {
        title: 'Factures payées',
        value: String(this.paidInvoices),
        sub: 'Total validé',
        icon: 'pi pi-check-circle',
        color: BRAND.primary,
        routerLink: '/company-admin/invoices',
        queryParams: { status: 'PAID' }
      }
    ];

    this.stockStats = [
      {
        title: 'Produits',
        value: String(this.totalProducts),
        sub: 'Dans le catalogue',
        icon: 'pi pi-box',
        color: BRAND.primary,
        routerLink: '/company-admin/products'
      },
      {
        title: 'Entrepôts',
        value: String(this.totalWarehouses),
        sub: 'Points de stockage',
        icon: 'pi pi-building',
        color: BRAND.secondary,
        routerLink: '/company-admin/warehouses'
      },
      {
        title: 'Mouvements (mois)',
        value: String(this.monthlyMovements),
        sub: 'Ce mois-ci',
        icon: 'pi pi-sync',
        color: BRAND.warning,
        routerLink: '/company-admin/movements'
      },
      {
        title: 'Alertes stock bas',
        value: String(alertCount),
        sub: alertCount > 0 ? 'À réapprovisionner' : 'Tout est OK',
        icon: 'pi pi-exclamation-triangle',
        color: alertCount > 0 ? BRAND.danger : BRAND.secondary,
        alert: alertCount > 0,
        routerLink: '/company-admin/products',
        queryParams: { lowStock: '1' }
      }
    ];
  }

  private buildStatusChart(): void {
    this.statusChartData = {
      labels: ['Payées', 'Brouillons', 'Envoyées', 'Annulées'],
      datasets: [
        {
          data: [this.paidInvoices, this.draftInvoices, this.sentInvoices, this.cancelledInvoices],
          backgroundColor: [BRAND.secondary, BRAND.textMuted, BRAND.warning, BRAND.danger]
        }
      ]
    };
  }

  private buildMovementsChart(monthlyData: DashboardStats['monthlyMovementsData']): void {
    const emptyMovementDatasets = [
      brandLineDataset('Entrées', MOVEMENT_SERIES.entries, new Array(6).fill(0)),
      brandLineDataset('Sorties', MOVEMENT_SERIES.exits, new Array(6).fill(0)),
      brandLineDataset('Transferts', MOVEMENT_SERIES.transfers, new Array(6).fill(0)),
      brandLineDataset('Ajustements', MOVEMENT_SERIES.adjustments, new Array(6).fill(0))
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
        brandLineDataset('Entrées', MOVEMENT_SERIES.entries, monthlyData.map(d => d.entries || 0)),
        brandLineDataset('Sorties', MOVEMENT_SERIES.exits, monthlyData.map(d => d.exits || 0)),
        brandLineDataset('Transferts', MOVEMENT_SERIES.transfers, monthlyData.map(d => d.transfers || 0)),
        brandLineDataset('Ajustements', MOVEMENT_SERIES.adjustments, monthlyData.map(d => d.adjustments || 0))
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

  dismissOnboarding(): void {
    this.onboardingService.dismiss();
    this.showOnboarding = false;
    this.cdr.markForCheck();
  }

  private buildOnboardingSteps(stats: DashboardStats | null, partnersTotal: number): void {
    const warehouses = stats?.totalWarehouses ?? 0;
    const products = stats?.totalProducts ?? 0;
    const teamMembers = stats?.activeUsers ?? 0;
    const invoices =
      (stats?.paidInvoicesCount ?? 0) +
      (stats?.draftInvoicesCount ?? 0) +
      (stats?.sentInvoicesCount ?? 0);

    this.onboardingSteps = [
      {
        id: 'warehouse',
        title: 'Créer un entrepôt',
        description: 'Définissez au moins un dépôt pour gérer votre stock.',
        routerLink: '/company-admin/warehouses',
        queryParams: { action: 'new' },
        done: warehouses >= 1
      },
      {
        id: 'product',
        title: 'Ajouter un produit',
        description: 'Constituez votre catalogue avec vos articles.',
        routerLink: '/company-admin/products',
        queryParams: { action: 'new' },
        done: products >= 1
      },
      {
        id: 'partner',
        title: 'Ajouter un client',
        description: 'Enregistrez un client pour facturer plus vite.',
        routerLink: '/company-admin/partners',
        done: partnersTotal >= 1
      },
      {
        id: 'invoice',
        title: 'Créer une facture',
        description: 'Émettez votre première facture client.',
        routerLink: '/company-admin/invoices',
        done: invoices >= 1
      },
      {
        id: 'team',
        title: 'Inviter un gestionnaire',
        description: 'Donnez accès à un collaborateur pour le stock.',
        routerLink: '/company-admin/users',
        done: teamMembers >= 2
      }
    ];
  }

  onStatCardClick(stat: DashboardStatCard): void {
    if (!stat.routerLink) {
      return;
    }
    this.router.navigate([stat.routerLink], {
      queryParams: stat.queryParams
    });
  }

  trackByStatTitle(_index: number, stat: DashboardStatCard): string {
    return stat.title;
  }

  trackByProductId(_index: number, item: { productId?: number; id?: number }): number {
    return item.productId ?? item.id ?? _index;
  }

  trackByInvoiceId(_index: number, inv: { id?: number }): number {
    return inv.id ?? _index;
  }

  trackByMovementId(_index: number, m: { id?: number }): number {
    return m.id ?? _index;
  }
}
