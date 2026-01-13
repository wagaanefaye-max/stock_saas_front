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
import { PlatformUsersComponent } from './pages/super-admin/platform-users/platform-users.component';
import { PlatformSettingsComponent } from './pages/super-admin/platform-settings/platform-settings.component';
import { CompanyAdminDashboardComponent } from './pages/company-admin/dashboard/dashboard.component';
import { CompanyUsersComponent } from './pages/company-admin/users/users.component';
import { CompanyAdminLayoutComponent } from './layout/company-admin-layout/company-admin-layout.component';
import { GestionnaireLayoutComponent } from './layout/gestionnaire-layout/gestionnaire-layout.component';

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
    path: 'gestionnaire',
    component: GestionnaireLayoutComponent,
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
    path: 'gestion',
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
    path: 'company-admin',
    component: CompanyAdminLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: CompanyAdminDashboardComponent
      },
      {
        path: 'users',
        component: CompanyUsersComponent
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
        path: 'platform-settings',
        component: PlatformSettingsComponent
      }
    ]
  },
  {
    path: '',
    redirectTo: 'gestionnaire/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'gestionnaire/dashboard'
  }
];

