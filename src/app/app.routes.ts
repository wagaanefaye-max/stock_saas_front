import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { superAdminGuard } from './guards/super-admin.guard';
import { adminEntrepriseGuard } from './guards/admin-entreprise.guard';
import { gestionnaireGuard } from './guards/gestionnaire.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-account',
    loadComponent: () => import('./pages/verify-account/verify-account.component').then(m => m.VerifyAccountComponent)
  },
  {
    path: 'gestionnaire',
    loadComponent: () => import('./layout/gestionnaire-layout/gestionnaire-layout.component').then(m => m.GestionnaireLayoutComponent),
    canActivate: [gestionnaireGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'warehouses',
        loadComponent: () => import('./pages/warehouses/warehouses.component').then(m => m.WarehousesComponent)
      },
      {
        path: 'movements',
        loadComponent: () => import('./pages/movements/movements.component').then(m => m.MovementsComponent)
      },
      {
        path: 'inventories',
        loadComponent: () => import('./pages/inventories/inventories.component').then(m => m.InventoriesComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  {
    path: 'gestion',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'warehouses',
        loadComponent: () => import('./pages/warehouses/warehouses.component').then(m => m.WarehousesComponent)
      },
      {
        path: 'movements',
        loadComponent: () => import('./pages/movements/movements.component').then(m => m.MovementsComponent)
      },
      {
        path: 'inventories',
        loadComponent: () => import('./pages/inventories/inventories.component').then(m => m.InventoriesComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  {
    path: 'company-admin',
    loadComponent: () => import('./layout/company-admin-layout/company-admin-layout.component').then(m => m.CompanyAdminLayoutComponent),
    canActivate: [adminEntrepriseGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/company-admin/dashboard/dashboard.component').then(m => m.CompanyAdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/company-admin/users/users.component').then(m => m.CompanyUsersComponent)
      },
      {
        path: 'partners',
        loadComponent: () => import('./pages/company-admin/partners/partners.component').then(m => m.PartnersComponent)
      },
      {
        path: 'invoices',
        loadComponent: () => import('./pages/company-admin/invoices/invoices.component').then(m => m.InvoicesComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'warehouses',
        loadComponent: () => import('./pages/warehouses/warehouses.component').then(m => m.WarehousesComponent)
      },
      {
        path: 'movements',
        loadComponent: () => import('./pages/movements/movements.component').then(m => m.MovementsComponent)
      },
      {
        path: 'inventories',
        loadComponent: () => import('./pages/inventories/inventories.component').then(m => m.InventoriesComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./pages/company-admin/subscriptions/subscriptions.component').then(m => m.CompanySubscriptionsComponent)
      }
    ]
  },
  {
    path: 'super-admin',
    loadComponent: () => import('./layout/super-admin-layout/super-admin-layout.component').then(m => m.SuperAdminLayoutComponent),
    canActivate: [superAdminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/super-admin/dashboard/dashboard.component').then(m => m.SuperAdminDashboardComponent)
      },
      {
        path: 'companies',
        loadComponent: () => import('./pages/super-admin/companies/companies.component').then(m => m.CompaniesComponent)
      },
      {
        path: 'platform-users',
        loadComponent: () => import('./pages/super-admin/platform-users/platform-users.component').then(m => m.PlatformUsersComponent)
      },
      {
        path: 'platform-settings',
        loadComponent: () => import('./pages/super-admin/platform-settings/platform-settings.component').then(m => m.PlatformSettingsComponent)
      },
      {
        path: 'subscription-requests',
        loadComponent: () => import('./pages/super-admin/subscription-requests/subscription-requests.component').then(m => m.SubscriptionRequestsComponent)
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
