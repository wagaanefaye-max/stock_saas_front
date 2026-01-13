import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ChartModule, ButtonModule, DropdownModule, TagModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  // Graphiques
  stockValueChartData: any;
  stockValueChartOptions: any;
  movementsChartData: any;
  movementsChartOptions: any;
  warehouseDistributionChartData: any;
  warehouseDistributionChartOptions: any;
  
  // Données
  accessibleWarehouses: any[] = [];
  topProducts: any[] = [];
  monthlyStats: any[] = [
    { label: 'Mouvements totaux', value: '0', icon: 'pi pi-arrows-h', color: 'var(--primary)' },
    { label: 'Valeur moyenne', value: '0 €', icon: 'pi pi-euro', color: 'var(--secondary)' },
    { label: 'Produits actifs', value: '0', icon: 'pi pi-box', color: 'var(--warning)' },
    { label: 'Taux de rotation', value: '0x', icon: 'pi pi-refresh', color: 'var(--info)' }
  ];
  warehouseStats: any[] = [];
  
  // Filtres
  selectedPeriod = { label: '12 derniers mois', value: '12' };
  periods = [
    { label: '3 derniers mois', value: '3' },
    { label: '6 derniers mois', value: '6' },
    { label: '12 derniers mois', value: '12' },
    { label: 'Année complète', value: 'all' }
  ];
  
  selectedWarehouse: any = null; // null = tous les entrepôts
  warehouseFilterOptions: any[] = [];

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.loadAccessibleWarehouses();
    this.initCharts();
    this.loadData();
  }

  loadAccessibleWarehouses() {
    const accessibleIds = this.authService.getAccessibleWarehouseIds();
    
    // Liste des entrepôts par défaut (à remplacer par un appel API)
    const allWarehouses = [
      { id: 1, name: 'Entrepôt Central Dakar', location: 'Dakar', region: 'Dakar' },
      { id: 2, name: 'Entrepôt Nord', location: 'Thiès', region: 'Thiès' },
      { id: 3, name: 'Entrepôt Sud', location: 'Ziguinchor', region: 'Ziguinchor' },
      { id: 4, name: 'Entrepôt Est', location: 'Tambacounda', region: 'Tambacounda' },
      { id: 5, name: 'Entrepôt Ouest', location: 'Saint-Louis', region: 'Saint-Louis' },
      { id: 6, name: 'Entrepôt Kaolack', location: 'Kaolack', region: 'Kaolack' },
      { id: 7, name: 'Entrepôt Kolda', location: 'Kolda', region: 'Kolda' },
      { id: 8, name: 'Entrepôt Louga', location: 'Louga', region: 'Louga' },
      { id: 9, name: 'Entrepôt Fatick', location: 'Fatick', region: 'Fatick' },
      { id: 10, name: 'Entrepôt Matam', location: 'Matam', region: 'Matam' },
      { id: 11, name: 'Entrepôt Kaffrine', location: 'Kaffrine', region: 'Kaffrine' },
      { id: 12, name: 'Entrepôt Sédhiou', location: 'Sédhiou', region: 'Sédhiou' },
      { id: 13, name: 'Entrepôt Kédougou', location: 'Kédougou', region: 'Kédougou' }
    ];

    if (accessibleIds === null) {
      // Super Admin ou Admin Entreprise : tous les entrepôts
      this.accessibleWarehouses = allWarehouses;
    } else {
      // Gestionnaire/Utilisateur : seulement les entrepôts assignés
      this.accessibleWarehouses = allWarehouses.filter(w => accessibleIds.includes(w.id));
    }

    // Options pour le filtre d'entrepôt
    this.warehouseFilterOptions = [
      { label: 'Tous les entrepôts', value: null },
      ...this.accessibleWarehouses.map(w => ({
        label: `${w.name} (${w.location})`,
        value: w
      }))
    ];
  }

  initCharts() {
    this.updateCharts();
  }

  updateCharts() {
    // Palette de couleurs
    const colors = {
      primary: '#2563EB',
      secondary: '#16A34A',
      warning: '#F59E0B',
      danger: '#DC2626',
      info: '#06B6D4',
      purple: '#9333EA',
      indigo: '#6366F1',
      pink: '#EC4899',
      teal: '#14B8A6',
      amber: '#F59E0B'
    };

    const colorArray = [
      colors.primary,
      colors.secondary,
      colors.warning,
      colors.danger,
      colors.info,
      colors.purple,
      colors.indigo,
      colors.pink,
      colors.teal,
      colors.amber
    ];

    // Déterminer les entrepôts à afficher
    const warehousesToShow = this.selectedWarehouse 
      ? [this.selectedWarehouse] 
      : this.accessibleWarehouses;

    // Graphique 1: Valeur du stock (12 mois) - par entrepôt si plusieurs
    if (warehousesToShow.length === 1 || this.selectedWarehouse) {
      // Un seul entrepôt : ligne simple
      const warehouse = warehousesToShow[0];
      this.stockValueChartData = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      datasets: [
        {
            label: `Valeur du stock - ${warehouse.name}`,
            data: [45000, 42000, 55000, 58000, 40000, 38000, 48000, 52000, 56000, 54000, 62000, 65000],
          fill: true,
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            borderColor: colors.primary,
            borderWidth: 3,
            tension: 0.4,
            pointBackgroundColor: colors.primary,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      };
    } else {
      // Plusieurs entrepôts : une ligne par entrepôt
      const datasets = warehousesToShow.slice(0, 5).map((warehouse, index) => {
        const baseValue = 30000 + (index * 10000);
        return {
          label: warehouse.name.split(' ')[1] || warehouse.name,
          data: [
            baseValue, baseValue * 0.9, baseValue * 1.2, baseValue * 1.3,
            baseValue * 0.8, baseValue * 0.85, baseValue * 1.1, baseValue * 1.15,
            baseValue * 1.25, baseValue * 1.2, baseValue * 1.35, baseValue * 1.4
          ].map(v => Math.floor(v)),
          fill: false,
          borderColor: colorArray[index % colorArray.length],
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: colorArray[index % colorArray.length],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5
        };
      });

      this.stockValueChartData = {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        datasets: datasets
      };
    }

    this.stockValueChartOptions = {
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
          beginAtZero: false,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            callback: function(value: any) {
              return value.toLocaleString('fr-FR') + ' €';
            }
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

    // Graphique 2: Mouvements par type (agrégé ou par entrepôt)
    if (warehousesToShow.length === 1 || this.selectedWarehouse) {
      // Un seul entrepôt : mouvements par type
      this.movementsChartData = {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
        datasets: [
          {
            label: 'Entrées',
            data: [45, 38, 52, 48, 35, 42],
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
            data: [28, 32, 35, 30, 25, 28],
            fill: true,
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderColor: colors.danger,
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: colors.danger,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
          },
          {
            label: 'Transferts',
            data: [12, 15, 18, 14, 10, 12],
            fill: true,
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderColor: colors.warning,
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: colors.warning,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
          }
        ]
      };
    } else {
      // Plusieurs entrepôts : comparaison des mouvements totaux
      const datasets = warehousesToShow.slice(0, 5).map((warehouse, index) => {
        const baseValue = 50 + (index * 20);
        return {
          label: warehouse.name.split(' ')[1] || warehouse.name,
          data: [
            baseValue, baseValue * 0.9, baseValue * 1.1, baseValue * 1.05,
            baseValue * 0.85, baseValue * 0.95
          ].map(v => Math.floor(v)),
          fill: true,
          backgroundColor: colorArray[index % colorArray.length] + '20',
          borderColor: colorArray[index % colorArray.length],
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: colorArray[index % colorArray.length],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 3
        };
      });

      this.movementsChartData = {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
        datasets: datasets
      };
    }

    this.movementsChartOptions = {
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

    // Graphique 3: Répartition par entrepôt (si plusieurs entrepôts)
    if (this.accessibleWarehouses.length > 1 && !this.selectedWarehouse) {
      const warehouseData = this.accessibleWarehouses.slice(0, 8).map((w, i) => ({
        name: w.name,
        value: Math.floor(Math.random() * 50000) + 20000
      }));

      this.warehouseDistributionChartData = {
        labels: warehouseData.map(w => {
          const parts = w.name.split(' ');
          return parts.length > 1 ? parts[1] : w.name;
        }),
        datasets: [{
          data: warehouseData.map(w => w.value),
          backgroundColor: warehouseData.map((_, i) => colorArray[i % colorArray.length]),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 4
        }]
      };

      this.warehouseDistributionChartOptions = {
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 11,
                weight: '500'
              },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = warehouseData[context.dataIndex].name;
                const value = context.parsed;
                return `${label}: ${value.toLocaleString('fr-FR')} €`;
              }
            }
          }
        }
      };
    } else {
      this.warehouseDistributionChartData = null;
    }
  }

  onWarehouseFilterChange() {
    this.updateCharts();
    this.loadData();
  }

  loadData() {
    // Vérifier que les entrepôts sont chargés
    if (!this.accessibleWarehouses || this.accessibleWarehouses.length === 0) {
      // Si aucun entrepôt, initialiser avec des valeurs par défaut
      this.monthlyStats = [
        { label: 'Mouvements totaux', value: '0', icon: 'pi pi-arrows-h', color: 'var(--primary)' },
        { label: 'Valeur moyenne', value: '0 €', icon: 'pi pi-euro', color: 'var(--secondary)' },
        { label: 'Produits actifs', value: '0', icon: 'pi pi-box', color: 'var(--warning)' },
        { label: 'Taux de rotation', value: '0x', icon: 'pi pi-refresh', color: 'var(--info)' }
      ];
      this.topProducts = [];
      this.warehouseStats = [];
      return;
    }

    const warehousesToShow = this.selectedWarehouse 
      ? [this.selectedWarehouse] 
      : this.accessibleWarehouses;

    // Top 5 produits (filtrés par entrepôt si sélectionné)
    const allProducts = [
      { rank: 1, name: 'Produit A', warehouse: 'Entrepôt Central Dakar', warehouseId: 1, value: 12500, quantity: 450 },
      { rank: 2, name: 'Produit B', warehouse: 'Entrepôt Nord', warehouseId: 2, value: 9800, quantity: 320 },
      { rank: 3, name: 'Produit C', warehouse: 'Entrepôt Sud', warehouseId: 3, value: 8700, quantity: 280 },
      { rank: 4, name: 'Produit D', warehouse: 'Entrepôt Central Dakar', warehouseId: 1, value: 7200, quantity: 240 },
      { rank: 5, name: 'Produit E', warehouse: 'Entrepôt Nord', warehouseId: 2, value: 6500, quantity: 210 },
      { rank: 6, name: 'Produit F', warehouse: 'Entrepôt Est', warehouseId: 4, value: 5800, quantity: 190 },
      { rank: 7, name: 'Produit G', warehouse: 'Entrepôt Ouest', warehouseId: 5, value: 5200, quantity: 170 },
      { rank: 8, name: 'Produit H', warehouse: 'Entrepôt Kaolack', warehouseId: 6, value: 4800, quantity: 160 },
      { rank: 9, name: 'Produit I', warehouse: 'Entrepôt Kolda', warehouseId: 7, value: 4200, quantity: 140 },
      { rank: 10, name: 'Produit J', warehouse: 'Entrepôt Louga', warehouseId: 8, value: 3800, quantity: 130 }
    ];

    if (this.selectedWarehouse) {
      this.topProducts = allProducts
        .filter(p => p.warehouseId === this.selectedWarehouse.id)
        .slice(0, 5)
        .map((p, i) => ({ ...p, rank: i + 1 }));
    } else {
      // Agrégation de tous les entrepôts
      this.topProducts = allProducts
        .filter(p => warehousesToShow.some(w => w.id === p.warehouseId))
        .slice(0, 5)
        .map((p, i) => ({ ...p, rank: i + 1 }));
    }

    // Statistiques mensuelles (agrégées ou par entrepôt)
    if (this.selectedWarehouse) {
      // Statistiques pour un entrepôt spécifique
      const baseMovements = 120 + Math.floor(Math.random() * 80);
      const baseValue = 25000 + Math.floor(Math.random() * 15000);
      const baseProducts = 200 + Math.floor(Math.random() * 100);
      
      this.monthlyStats = [
        { label: 'Mouvements totaux', value: baseMovements.toString(), icon: 'pi pi-arrows-h', color: 'var(--primary)' },
        { label: 'Valeur moyenne', value: `${baseValue.toLocaleString('fr-FR')} €`, icon: 'pi pi-euro', color: 'var(--secondary)' },
        { label: 'Produits actifs', value: baseProducts.toString(), icon: 'pi pi-box', color: 'var(--warning)' },
        { label: 'Taux de rotation', value: (2.0 + Math.random() * 0.5).toFixed(1) + 'x', icon: 'pi pi-refresh', color: 'var(--info)' }
      ];
    } else {
      // Statistiques agrégées pour tous les entrepôts
      const totalMovements = warehousesToShow.length * 85;
      const avgValue = Math.floor((warehousesToShow.length * 28000) / warehousesToShow.length);
      const totalProducts = warehousesToShow.length * 165;
      
      this.monthlyStats = [
        { label: 'Mouvements totaux', value: totalMovements.toString(), icon: 'pi pi-arrows-h', color: 'var(--primary)' },
        { label: 'Valeur moyenne', value: `${avgValue.toLocaleString('fr-FR')} €`, icon: 'pi pi-euro', color: 'var(--secondary)' },
        { label: 'Produits actifs', value: totalProducts.toString(), icon: 'pi pi-box', color: 'var(--warning)' },
        { label: 'Taux de rotation', value: '2.3x', icon: 'pi pi-refresh', color: 'var(--info)' }
      ];
    }

    // Statistiques par entrepôt (toujours afficher tous les entrepôts accessibles)
    this.warehouseStats = warehousesToShow.map((w, i) => {
      const baseStock = 20000 + (i * 5000) + Math.floor(Math.random() * 10000);
      const baseMovements = 50 + (i * 10) + Math.floor(Math.random() * 50);
      const baseProducts = 100 + (i * 20) + Math.floor(Math.random() * 100);
      const baseUsage = 50 + (i * 5) + Math.floor(Math.random() * 30);
      
      return {
        name: w.name,
        location: w.location,
        stockValue: baseStock,
        movements: baseMovements,
        products: baseProducts,
        usage: Math.min(100, baseUsage)
      };
    });
  }

  exportPDF() {
    // TODO: Implémenter l'export PDF
    console.log('Export PDF...');
  }

  isAdminEntreprise(): boolean {
    return this.authService.isAdminEntreprise();
  }
}

