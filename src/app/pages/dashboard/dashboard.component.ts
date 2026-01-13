import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  stats: any[] = [];

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.loadStats();
    this.initCharts();
  }

  loadStats() {
    const user = this.authService.getCurrentUser();
    const accessibleIds = this.authService.getAccessibleWarehouseIds();
    
    // Calculer les statistiques selon les entrepôts accessibles
    if (this.authService.isAdminEntreprise()) {
      // Admin entreprise : toutes les statistiques
      this.stats = [
        {
          title: 'Produits totaux',
          value: '1,234',
          icon: 'pi pi-box',
          color: 'var(--primary)',
          change: '+12%'
        },
        {
          title: 'Entrepôts',
          value: '13',
          icon: 'pi pi-building',
          color: 'var(--secondary)',
          change: '+2'
        },
        {
          title: 'Mouvements (mois)',
          value: '456',
          icon: 'pi pi-arrows-h',
          color: 'var(--warning)',
          change: '+8%'
        },
        {
          title: 'Alertes',
          value: '12',
          icon: 'pi pi-exclamation-triangle',
          color: 'var(--danger)',
          change: '-3'
        }
      ];
    } else {
      // Gestionnaire/Utilisateur : statistiques filtrées selon les entrepôts assignés
      const warehouseCount = accessibleIds === null ? 13 : (accessibleIds.length || 0);
      this.stats = [
        {
          title: 'Produits (mes entrepôts)',
          value: '456',
          icon: 'pi pi-box',
          color: 'var(--primary)',
          change: '+8%'
        },
        {
          title: 'Entrepôts assignés',
          value: warehouseCount.toString(),
          icon: 'pi pi-building',
          color: 'var(--secondary)',
          change: ''
        },
        {
          title: 'Mouvements (mois)',
          value: '128',
          icon: 'pi pi-arrows-h',
          color: 'var(--warning)',
          change: '+5%'
        },
        {
          title: 'Alertes',
          value: '5',
          icon: 'pi pi-exclamation-triangle',
          color: 'var(--danger)',
          change: '-2'
        }
      ];
    }
  }

  chartData: any;
  chartOptions: any;
  categoryChartData: any;
  categoryChartOptions: any;

  initCharts() {
    // Palette de couleurs pour différencier les entités
    const colors = {
      primary: '#2563EB',      // Bleu - Entrées
      secondary: '#16A34A',     // Vert - Sorties
      warning: '#F59E0B',       // Orange - Transferts
      danger: '#DC2626',        // Rouge - Ajustements
      info: '#06B6D4',          // Cyan - Autres
      purple: '#9333EA',        // Violet - Autres entités
      pink: '#EC4899',          // Rose - Autres entités
      indigo: '#6366F1'         // Indigo - Autres entités
    };

    this.chartData = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
      datasets: [
        {
          label: 'Entrées',
          data: [65, 59, 80, 81, 56, 55],
          fill: true,
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          borderColor: colors.primary,
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: colors.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        },
        {
          label: 'Sorties',
          data: [28, 48, 40, 19, 86, 27],
          fill: true,
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderColor: colors.danger,
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: colors.danger,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }
      ]
    };

    this.chartOptions = {
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
              weight: '500'
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };

    // Graphique en doughnut pour les catégories
    this.categoryChartData = {
      labels: ['Électronique', 'Vêtements', 'Alimentaire', 'Autres'],
      datasets: [{
        data: [300, 450, 280, 204],
        backgroundColor: [
          '#2563EB',  // Bleu - Électronique
          '#16A34A',  // Vert - Vêtements
          '#F59E0B',  // Orange - Alimentaire
          '#6366F1'   // Indigo - Autres
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    this.categoryChartOptions = {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12,
              weight: '500'
            }
          }
        }
      }
    };
  }
}

