import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, ButtonModule, DropdownModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  chartData: any;
  chartOptions: any;

  ngOnInit() {
    this.chartData = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      datasets: [
        {
          label: 'Valeur du stock',
          data: [65000, 59000, 80000, 81000, 56000, 55000, 70000, 75000, 82000, 78000, 90000, 95000],
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
          beginAtZero: false
        }
      }
    };
  }
}

