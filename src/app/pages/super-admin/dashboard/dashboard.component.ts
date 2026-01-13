import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class SuperAdminDashboardComponent implements OnInit {
  stats = [
    {
      title: 'Entreprises actives',
      value: '24',
      icon: 'pi pi-building',
      color: 'var(--primary)',
      change: '+3 ce mois'
    },
    {
      title: 'Utilisateurs totaux',
      value: '1,234',
      icon: 'pi pi-users',
      color: 'var(--secondary)',
      change: '+12%'
    },
    {
      title: 'Revenus mensuels',
      value: '45,600 €',
      icon: 'pi pi-euro',
      color: 'var(--warning)',
      change: '+8%'
    },
    {
      title: 'Tickets support',
      value: '8',
      icon: 'pi pi-ticket',
      color: 'var(--danger)',
      change: '-2'
    }
  ];

  chartData: any;
  chartOptions: any;
  planChartData: any;
  planChartOptions: any;

  constructor(public authService: AuthService) {}

  getEmail(index: number): string {
    return `contact@entreprise${index}.com`;
  }

  ngOnInit() {
    // Palette de couleurs pour différencier les entités
    const colors = {
      primary: '#2563EB',      // Bleu
      secondary: '#16A34A',     // Vert
      warning: '#F59E0B',       // Orange
      danger: '#DC2626',        // Rouge
      info: '#06B6D4',          // Cyan
      purple: '#9333EA'         // Violet
    };

    this.chartData = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
      datasets: [
        {
          label: 'Nouvelles entreprises',
          data: [2, 3, 4, 3, 5, 4],
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

    this.chartOptions = {
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    // Graphique en doughnut pour les plans
    this.planChartData = {
      labels: ['Free', 'Premium', 'Standard', 'Basique'],
      datasets: [{
        data: [5, 8, 12, 4],
        backgroundColor: [
          '#16A34A',  // Vert - Free
          '#2563EB',  // Bleu - Premium
          '#9333EA',  // Violet - Standard
          '#F59E0B'   // Orange - Basique
        ],
        borderWidth: 3,
        borderColor: '#fff',
        hoverOffset: 4
      }]
    };

    this.planChartOptions = {
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

