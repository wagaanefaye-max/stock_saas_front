/** Configuration SEO — pages publiques indexables par Google */

export interface SeoMeta {
  title: string;
  description: string;
  robots?: string;
  ogType?: string;
}

export const SEO_SITE_NAME = 'Stock SaaS';

export const SEO_DEFAULT: SeoMeta = {
  title: 'Stock SaaS — Gestion de stock et facturation en ligne | Sénégal',
  description:
    'Logiciel SaaS de gestion de stock, inventaire, facturation et entrepôts pour PME au Sénégal. Essai gratuit 1 mois, tarifs en FCFA, paiement Wave et Orange Money.',
  robots: 'index,follow',
  ogType: 'website'
};

/** Préfixes d’URL privées (application connectée) — noindex */
export const SEO_PRIVATE_PREFIXES = [
  '/company-admin',
  '/super-admin',
  '/gestionnaire',
  '/gestion'
];

/** Métadonnées par segment de route publique (premier segment sans query) */
export const SEO_BY_ROUTE: Record<string, SeoMeta> = {
  '': {
    title: 'Stock SaaS — Gestion de stock, factures et entrepôts | Sénégal',
    description:
      'Centralisez stock, mouvements, partenaires et facturation pour boutiques et commerces au Sénégal. Interface simple, FCFA, Wave & Orange Money. Essai gratuit 1 mois.',
    robots: 'index,follow',
    ogType: 'website'
  },
  login: {
    title: 'Connexion — Stock SaaS',
    description:
      'Connectez-vous à Stock SaaS pour gérer votre stock, vos factures et vos entrepôts en ligne.',
    robots: 'index,follow',
    ogType: 'website'
  },
  register: {
    title: 'Inscription — Essai gratuit 1 mois | Stock SaaS',
    description:
      'Créez votre compte Stock SaaS en 2 minutes. Essai gratuit d’un mois, sans carte bancaire. Gestion de stock pour PME au Sénégal.',
    robots: 'index,follow',
    ogType: 'website'
  },
  'forgot-password': {
    title: 'Mot de passe oublié — Stock SaaS',
    description: 'Réinitialisez votre mot de passe Stock SaaS.',
    robots: 'noindex,follow'
  },
  'verify-account': {
    title: 'Vérification du compte — Stock SaaS',
    description: 'Activez votre compte Stock SaaS.',
    robots: 'noindex,nofollow'
  },
  maintenance: {
    title: 'Maintenance — Stock SaaS',
    description: 'Stock SaaS est temporairement indisponible pour maintenance.',
    robots: 'noindex,nofollow'
  }
};

export const SEO_OG_IMAGE = 'https://sen-stocksaas.com/assets/logo.jpg';
