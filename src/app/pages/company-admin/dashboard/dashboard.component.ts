import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-company-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class CompanyAdminDashboardComponent implements OnInit {
  stats = [
    {
      title: 'Utilisateurs actifs',
      value: '24',
      icon: 'pi pi-users',
      color: 'var(--primary)',
      change: '+3 ce mois'
    },
    {
      title: 'Produits totaux',
      value: '1,234',
      icon: 'pi pi-box',
      color: 'var(--secondary)',
      change: '+12%'
    },
    {
      title: 'Entrepôts',
      value: '8',
      icon: 'pi pi-building',
      color: 'var(--warning)',
      change: '+2'
    },
    {
      title: 'Mouvements (mois)',
      value: '456',
      icon: 'pi pi-arrows-h',
      color: 'var(--danger)',
      change: '+8%'
    }
  ];

  chartData: any;
  chartOptions: any;

  constructor(public authService: AuthService) {}

  ngOnInit() {
    // Palette de couleurs pour différencier les types de mouvements
    const colors = {
      primary: '#2563EB',      // Bleu - Entrées
      secondary: '#16A34A',     // Vert - Sorties
      warning: '#F59E0B',       // Orange - Transferts
      danger: '#DC2626',        // Rouge - Ajustements
      info: '#06B6D4'           // Cyan - Autres
    };

    this.chartData = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
      datasets: [
        {
          label: 'Entrées',
          data: [45, 39, 50, 51, 36, 35],
          fill: true,
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
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
          data: [20, 20, 30, 30, 20, 20],
          fill: true,
          backgroundColor: 'rgba(220, 38, 38, 0.15)',
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
      }
    };
  }
}
