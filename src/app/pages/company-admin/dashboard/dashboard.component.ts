import { Component, HostListener, OnInit } from '@angular/core';
import { buildDoughnutChartOptions, buildLineChartOptions } from '../../../utils/chart-options.util';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../services/api.service';

interface DashboardInvoice {
  id: number;
  status: string;
  total: number;
  invoiceDate: string;
  clientName?: string | null;
}

interface DashboardProduct {
  id: number;
  stock?: number | null;
  minThreshold?: number | null;
  lowStock?: boolean;
}

@Component({
  selector: 'app-company-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastModule, CardModule, ChartModule],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class CompanyAdminDashboardComponent implements OnInit {
  invoices: DashboardInvoice[] = [];
  products: DashboardProduct[] = [];

  totalInvoices = 0;
  paidInvoices = 0;
  unpaidInvoices = 0;
  paidRevenue = 0;
  lowStockProducts = 0;

  salesByMonthData: any;
  statusChartData: any;
  chartOptions: any;
  doughnutChartOptions: any;

  constructor(
    private apiService: ApiService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.refreshChartOptions();
    this.loadDashboardData();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.refreshChartOptions();
  }

  private loadDashboardData(): void {
    this.apiService.get<DashboardInvoice[]>('/invoices').subscribe({
      next: (invoices) => {
        this.invoices = invoices || [];
        this.computeInvoiceKpis();
        this.buildSalesByMonthChart();
        this.buildStatusChart();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les données des ventes.'
        });
      }
    });

    this.apiService.get<DashboardProduct[]>('/products').subscribe({
      next: (products) => {
        this.products = products || [];
        this.lowStockProducts = this.products.filter(p =>
          p.lowStock || this.isProductLowStock(p)
        ).length;
      },
      error: () => {
        this.lowStockProducts = 0;
      }
    });
  }

  private computeInvoiceKpis(): void {
    this.totalInvoices = this.invoices.length;
    this.paidInvoices = this.invoices.filter(i => i.status === 'PAID').length;
    this.unpaidInvoices = this.totalInvoices - this.paidInvoices;
    this.paidRevenue = this.invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);
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
    const values = Array.from(monthlyMap.values());

    this.salesByMonthData = {
      labels,
      datasets: [
        {
          label: 'Ventes payées (FCFA)',
          data: values,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  }

  private buildStatusChart(): void {
    const paid = this.paidInvoices;
    const unpaid = this.unpaidInvoices;
    this.statusChartData = {
      labels: ['Payées', 'Impayées'],
      datasets: [
        {
          data: [paid, unpaid],
          backgroundColor: ['#16a34a', '#f59e0b']
        }
      ]
    };
  }

  private refreshChartOptions(): void {
    this.chartOptions = {
      ...buildLineChartOptions({ legendPosition: 'bottom' })
    };
    this.doughnutChartOptions = { ...buildDoughnutChartOptions() };
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value || 0);
  }

  private isProductLowStock(product: DashboardProduct): boolean {
    const min = Number(product.minThreshold) || 0;
    const stock = Number(product.stock) || 0;
    return min > 0 && stock <= min;
  }
}
