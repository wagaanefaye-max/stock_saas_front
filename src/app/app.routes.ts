import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { LayoutComponent } from './layout/layout.component';
import { SuperAdminLayoutComponent } from './layout/super-admin-layout/super-admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductsComponent } from './pages/products/products.component';
import { WarehousesComponent } from './pages/warehouses/warehouses.component';
import { MovementsComponent } from './pages/movements/movements.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { SuperAdminDashboardComponent } from './pages/super-admin/dashboard/dashboard.component';
import { CompaniesComponent } from './pages/super-admin/companies/companies.component';
import { SystemUsersComponent } from './pages/super-admin/system-users/system-users.component';
import { PlatformUsersComponent } from './pages/super-admin/platform-users/platform-users.component';
import { PlatformSettingsComponent } from './pages/super-admin/platform-settings/platform-settings.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'products',
        component: ProductsComponent
      },
      {
        path: 'warehouses',
        component: WarehousesComponent
      },
      {
        path: 'movements',
        component: MovementsComponent
      },
      {
        path: 'reports',
        component: ReportsComponent
      },
      {
        path: 'settings',
        component: SettingsComponent
      }
    ]
  },
  {
    path: 'super-admin',
    component: SuperAdminLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: SuperAdminDashboardComponent
      },
      {
        path: 'companies',
        component: CompaniesComponent
      },
      {
        path: 'platform-users',
        component: PlatformUsersComponent
      },
      {
        path: 'system-users',
        component: SystemUsersComponent
      },
      {
        path: 'platform-settings',
        component: PlatformSettingsComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

