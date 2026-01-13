import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  stats = [
    {
      title: 'Produits totaux',
      value: '1,234',
      icon: 'pi pi-box',
      color: 'var(--primary)',
      change: '+12%'
    },
    {
      title: 'Entrepôts',
      value: '8',
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

  chartData: any;
  chartOptions: any;

  ngOnInit() {
    this.chartData = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
      datasets: [
        {
          label: 'Entrées',
          data: [65, 59, 80, 81, 56, 55],
          fill: false,
          borderColor: 'var(--primary)',
          tension: 0.4
        },
        {
          label: 'Sorties',
          data: [28, 48, 40, 19, 86, 27],
          fill: false,
          borderColor: 'var(--danger)',
          tension: 0.4
        }
      ]
    };

    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            usePointStyle: true
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
  }
}

