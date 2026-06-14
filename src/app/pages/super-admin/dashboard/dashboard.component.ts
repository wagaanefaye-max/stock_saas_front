import { Component, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnInit } from '@angular/core';
import { buildBarChartOptions, buildDoughnutChartOptions, buildLineChartOptions } from '../../../utils/chart-options.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';
import { RequestCacheService } from '../../../services/request-cache.service';
import { catchError, finalize, of } from 'rxjs';

type SubscriptionChartFilter = 'ALL' | 'APPROVED' | 'REJECTED';

interface MonthlySubscriptionPoint {
  month: string;
  approvedCount: number;
  rejectedCount: number;
  pendingCount?: number;
}

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CardModule, ChartModule, SelectButtonModule, TagModule, ToastModule],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperAdminDashboardComponent implements OnInit {
  loading = true;
  stats: any[] = [];
  recentCompanies: any[] = [];

  chartData: any;
  chartOptions: any;
  planChartData: any;
  planChartOptions: any;
  subscriptionChartData: any;
  subscriptionChartOptions: any;
  monthlySubscriptionsRaw: MonthlySubscriptionPoint[] = [];
  subscriptionFilter: SubscriptionChartFilter = 'ALL';
  subscriptionFilterOptions: { label: string; value: SubscriptionChartFilter }[] = [
    { label: 'Toutes', value: 'ALL' },
    { label: 'Validées', value: 'APPROVED' },
    { label: 'Rejetées', value: 'REJECTED' }
  ];

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private requestCache: RequestCacheService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  get adminName(): string {
    return this.authService.getCurrentUser()?.name?.split(' ')[0] || '';
  }

  ngOnInit() {
    this.refreshChartOptions();
    this.updateSubscriptionChartData();
    this.loadStats();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.refreshChartOptions();
    this.cdr.markForCheck();
  }

  loadStats(forceRefresh = false) {
    if (forceRefresh) {
      this.requestCache.invalidate('super-admin-dashboard-stats');
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.requestCache
      .get('super-admin-dashboard-stats', () =>
        this.apiService.get<any>('/dashboard/super-admin/stats').pipe(
          catchError(error => {
            console.error('Erreur lors du chargement des statistiques:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de charger les statistiques'
            });
            return of({
              activeCompanies: 0,
              totalUsers: 0,
              monthlyRevenue: '0 FCFA',
              supportTickets: 0,
              monthlyCompaniesData: [],
              monthlySubscriptionsData: [],
              planDistribution: [],
              recentCompanies: [],
              companiesChange: 'Aucune nouvelle ce mois',
              usersChange: 'Aucun nouveau ce mois',
              revenueChange: 'Stable',
              ticketsChange: 'Stable'
            });
          })
        )
      )
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe(data => {
        // Formater les valeurs avec des séparateurs de milliers
        const formatNumber = (num: number) => num.toLocaleString('fr-FR');
        
        this.stats = [
          {
            title: 'Entreprises actives',
            value: formatNumber(data.activeCompanies || 0),
            icon: 'pi pi-building',
            color: 'var(--primary)',
            change: data.companiesChange || 'Aucune nouvelle ce mois'
          },
          {
            title: 'Utilisateurs totaux',
            value: formatNumber(data.totalUsers || 0),
            icon: 'pi pi-users',
            color: 'var(--secondary)',
            change: data.usersChange || 'Aucun nouveau ce mois'
          },
          {
            title: 'Revenus mensuels',
            value: data.monthlyRevenue || '0 FCFA',
            icon: 'pi pi-money-bill',
            color: 'var(--warning)',
            change: data.revenueChange || 'Stable'
          },
          {
            title: 'Souscriptions en attente',
            value: formatNumber(data.supportTickets || 0),
            icon: 'pi pi-clock',
            color: 'var(--danger)',
            change: data.ticketsChange || 'Stable'
          }
        ];
        
        // Mettre à jour les entreprises récentes
        this.recentCompanies = data.recentCompanies || [];
        
        // Mettre à jour les graphiques avec les données réelles
        if (data.monthlyCompaniesData && data.monthlyCompaniesData.length > 0) {
          this.updateChartData(data.monthlyCompaniesData);
        } else {
          this.updateChartData([]);
        }
        
        if (data.planDistribution && data.planDistribution.length > 0) {
          this.updatePlanChartData(data.planDistribution);
        } else {
          this.updatePlanChartData([]);
        }

        this.monthlySubscriptionsRaw = (data.monthlySubscriptionsData || []).map((d: MonthlySubscriptionPoint) => ({
          month: d.month,
          approvedCount: d.approvedCount ?? 0,
          rejectedCount: d.rejectedCount ?? 0,
          pendingCount: d.pendingCount ?? 0
        }));
        this.updateSubscriptionChartData();
        this.cdr.markForCheck();
      });
  }

  onSubscriptionFilterChange(): void {
    this.updateSubscriptionChartData();
    this.cdr.markForCheck();
  }

  updateSubscriptionChartData(): void {
    const months = this.monthlySubscriptionsRaw.length > 0
      ? this.monthlySubscriptionsRaw.map(d => d.month)
      : ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];

    const approvedData = this.monthlySubscriptionsRaw.length > 0
      ? this.monthlySubscriptionsRaw.map(d => d.approvedCount ?? 0)
      : new Array(months.length).fill(0);

    const rejectedData = this.monthlySubscriptionsRaw.length > 0
      ? this.monthlySubscriptionsRaw.map(d => d.rejectedCount ?? 0)
      : new Array(months.length).fill(0);

    const datasets: any[] = [];

    if (this.subscriptionFilter === 'ALL' || this.subscriptionFilter === 'APPROVED') {
      datasets.push({
        label: 'Validées',
        data: approvedData,
        backgroundColor: 'rgba(22, 163, 74, 0.85)',
        borderColor: '#16A34A',
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 48
      });
    }

    if (this.subscriptionFilter === 'ALL' || this.subscriptionFilter === 'REJECTED') {
      datasets.push({
        label: 'Rejetées',
        data: rejectedData,
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        borderColor: '#EF4444',
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 48
      });
    }

    this.subscriptionChartData = {
      labels: months,
      datasets
    };
  }

  updateChartData(monthlyData: any[]) {
    const colors = {
      primary: '#2563EB'
    };
    
    if (monthlyData.length === 0) {
      // Initialiser avec des données vides pour les 6 derniers mois
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
      this.chartData = {
        labels: months,
        datasets: [
          {
            label: 'Nouvelles entreprises',
            data: new Array(6).fill(0),
            fill: true,
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            borderColor: colors.primary,
            borderWidth: 3,
            tension: 0.4,
            pointBackgroundColor: colors.primary,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      };
    } else {
      this.chartData = {
        labels: monthlyData.map(d => d.month),
        datasets: [
          {
            label: 'Nouvelles entreprises',
            data: monthlyData.map(d => d.count || 0),
            fill: true,
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            borderColor: colors.primary,
            borderWidth: 3,
            tension: 0.4,
            pointBackgroundColor: colors.primary,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      };
    }
  }

  updatePlanChartData(planData: any[]) {
    const planColors: { [key: string]: string } = {
      'Gratuit': '#16A34A',
      'Premium': '#2563EB',
      'Standard': '#9333EA',
      'Basique': '#F59E0B',
      'Free': '#16A34A'
    };
    
    if (planData.length === 0) {
      this.planChartData = {
        labels: ['Aucun plan'],
        datasets: [{
          data: [1],
          backgroundColor: ['#E5E7EB'],
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 4
        }]
      };
    } else {
      this.planChartData = {
        labels: planData.map(d => d.plan),
        datasets: [{
          data: planData.map(d => d.count || 0),
          backgroundColor: planData.map(d => planColors[d.plan] || '#6366F1'),
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 4
        }]
      };
    }
  }

  private refreshChartOptions(): void {
    this.chartOptions = {
      ...buildLineChartOptions({ showLegend: false, beginAtZero: true })
    };
    this.planChartOptions = { ...buildDoughnutChartOptions() };
    this.subscriptionChartOptions = {
      ...buildBarChartOptions({ showLegend: true, beginAtZero: true })
    };
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  trackByStatTitle(_index: number, stat: { title: string }): string {
    return stat.title;
  }

  trackByCompanyId(_index: number, company: { id?: number }): number {
    return company.id ?? _index;
  }

  getStatusSeverity(status: string | null | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('actif') || normalized.includes('active')) return 'success';
    if (normalized.includes('essai') || normalized.includes('trial')) return 'info';
    if (normalized.includes('inactif') || normalized.includes('suspend')) return 'warn';
    if (normalized.includes('expir') || normalized.includes('supprim')) return 'danger';
    return 'secondary';
  }
}

