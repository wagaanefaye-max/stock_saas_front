export interface AppNavItem {
  label: string;
  mobileLabel?: string;
  icon: string;
  routerLink: string;
  queryParams?: Record<string, unknown>;
  /** Affiché directement dans la barre du bas (max 4 recommandé) */
  mobilePrimary?: boolean;
  /** Mots-clés pour la palette de commandes */
  searchTerms?: string[];
  /** Clé pour afficher un badge de notification sur l'entrée de menu */
  badgeKey?: 'pendingSubscriptions';
}

export interface AppShellConfig {
  layoutClass: string;
  roleBadge: string;
  navSectionLabel: string;
  items: AppNavItem[];
}

function item(
  label: string,
  icon: string,
  routerLink: string,
  opts: Partial<AppNavItem> = {}
): AppNavItem {
  return { label, icon, routerLink, ...opts };
}

export const COMPANY_ADMIN_NAV_CONFIG: AppShellConfig = {
  layoutClass: 'company-admin-layout',
  roleBadge: 'Entreprise',
  navSectionLabel: 'Navigation',
  items: [
    item('Accueil', 'pi pi-home', '/company-admin/dashboard', {
      mobileLabel: 'Accueil',
      mobilePrimary: true,
      searchTerms: ['dashboard', 'tableau de bord', 'accueil']
    }),
    item('Factures', 'pi pi-file-edit', '/company-admin/invoices', {
      mobileLabel: 'Factures',
      mobilePrimary: true,
      searchTerms: ['facture', 'invoice', 'vente', 'client']
    }),
    item('Stock', 'pi pi-box', '/company-admin/products', {
      mobileLabel: 'Stock',
      mobilePrimary: true,
      searchTerms: ['produit', 'catalogue', 'stock', 'article']
    }),
    item('Partenaires', 'pi pi-users', '/company-admin/partners', {
      mobileLabel: 'Partenaires',
      searchTerms: ['client', 'fournisseur', 'partenaire']
    }),
    item('Entrepôts', 'pi pi-warehouse', '/company-admin/warehouses', {
      mobileLabel: 'Dépôts',
      searchTerms: ['entrepôt', 'dépôt', 'warehouse']
    }),
    item('Mouvements', 'pi pi-sync', '/company-admin/movements', {
      mobileLabel: 'Mvts',
      mobilePrimary: true,
      searchTerms: ['mouvement', 'entrée', 'sortie', 'transfert']
    }),
    item('Inventaires', 'pi pi-clipboard', '/company-admin/inventories', {
      mobileLabel: 'Invent.',
      searchTerms: ['inventaire', 'comptage']
    }),
    item('Abonnement', 'pi pi-credit-card', '/company-admin/subscriptions', {
      mobileLabel: 'Offre',
      searchTerms: ['abonnement', 'offre', 'paiement', 'souscription']
    }),
    item('Paramètres', 'pi pi-cog', '/company-admin/settings', {
      mobileLabel: 'Réglages',
      searchTerms: ['paramètres', 'réglages', 'settings', 'entreprise']
    })
  ]
};

export const SUPER_ADMIN_NAV_CONFIG: AppShellConfig = {
  layoutClass: 'super-admin-layout',
  roleBadge: 'Super Admin',
  navSectionLabel: 'Plateforme',
  items: [
    item('Accueil', 'pi pi-th-large', '/super-admin/dashboard', {
      mobileLabel: 'Accueil',
      mobilePrimary: true,
      searchTerms: ['dashboard', 'accueil']
    }),
    item('Entreprises', 'pi pi-briefcase', '/super-admin/companies', {
      mobileLabel: 'Sociétés',
      mobilePrimary: true,
      searchTerms: ['entreprise', 'société', 'client']
    }),
    item('Souscriptions', 'pi pi-credit-card', '/super-admin/subscription-requests', {
      mobileLabel: 'Demandes',
      mobilePrimary: true,
      badgeKey: 'pendingSubscriptions',
      searchTerms: ['souscription', 'abonnement', 'demande', 'paiement']
    }),
    item('Utilisateurs', 'pi pi-user', '/super-admin/platform-users', {
      mobileLabel: 'Users',
      mobilePrimary: true,
      searchTerms: ['utilisateur', 'admin', 'compte']
    }),
    item('Paramètres', 'pi pi-sliders-h', '/super-admin/platform-settings', {
      mobileLabel: 'Réglages',
      mobilePrimary: true,
      searchTerms: ['paramètres', 'plateforme', 'configuration']
    })
  ]
};

export const GESTION_NAV_CONFIG: AppShellConfig = {
  layoutClass: 'gestion-layout',
  roleBadge: 'Gestion',
  navSectionLabel: 'Navigation',
  items: [
    item('Accueil', 'pi pi-th-large', '/gestion/dashboard', {
      mobileLabel: 'Accueil',
      mobilePrimary: true,
      searchTerms: ['accueil', 'dashboard']
    }),
    item('Produits', 'pi pi-shopping-bag', '/gestion/products', {
      mobileLabel: 'Produits',
      mobilePrimary: true,
      searchTerms: ['produit', 'stock']
    }),
    item('Entrepôts', 'pi pi-warehouse', '/gestion/warehouses', {
      mobileLabel: 'Dépôts',
      searchTerms: ['entrepôt', 'dépôt']
    }),
    item('Mouvements', 'pi pi-sync', '/gestion/movements', {
      mobileLabel: 'Mvts',
      mobilePrimary: true,
      searchTerms: ['mouvement']
    }),
    item('Inventaires', 'pi pi-clipboard', '/gestion/inventories', {
      mobileLabel: 'Invent.',
      mobilePrimary: true,
      searchTerms: ['inventaire']
    }),
    item('Paramètres', 'pi pi-sliders-h', '/gestion/settings', {
      mobileLabel: 'Réglages',
      searchTerms: ['paramètres', 'réglages']
    })
  ]
};

export const GESTIONNAIRE_NAV_CONFIG: AppShellConfig = {
  layoutClass: 'gestionnaire-layout',
  roleBadge: 'Gestionnaire',
  navSectionLabel: 'Gestion de stock',
  items: [
    item('Accueil', 'pi pi-th-large', '/gestionnaire/dashboard', {
      mobileLabel: 'Accueil',
      mobilePrimary: true,
      searchTerms: ['accueil']
    }),
    item('Produits', 'pi pi-shopping-bag', '/gestionnaire/products', {
      mobileLabel: 'Produits',
      mobilePrimary: true,
      searchTerms: ['produit']
    }),
    item('Entrepôts', 'pi pi-warehouse', '/gestionnaire/warehouses', {
      mobileLabel: 'Dépôts',
      searchTerms: ['entrepôt']
    }),
    item('Mouvements', 'pi pi-sync', '/gestionnaire/movements', {
      mobileLabel: 'Mvts',
      mobilePrimary: true,
      searchTerms: ['mouvement']
    }),
    item('Inventaires', 'pi pi-clipboard', '/gestionnaire/inventories', {
      mobileLabel: 'Invent.',
      mobilePrimary: true,
      searchTerms: ['inventaire']
    }),
    item('Paramètres', 'pi pi-sliders-h', '/gestionnaire/settings', {
      mobileLabel: 'Réglages',
      searchTerms: ['paramètres']
    })
  ]
};
