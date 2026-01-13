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

  constructor(public authService: AuthService) {}

  getEmail(index: number): string {
    return `contact@entreprise${index}.com`;
  }

  ngOnInit() {
    this.chartData = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
      datasets: [
        {
          label: 'Nouvelles entreprises',
          data: [2, 3, 4, 3, 5, 4],
          fill: true,
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          borderColor: 'var(--primary)',
          tension: 0.4
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
  }
}

