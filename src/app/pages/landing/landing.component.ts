import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('reveal') revealElements!: QueryList<ElementRef<HTMLElement>>;

  showSplash = true;
  splashExiting = false;
  landingRevealed = false;

  private splashTimers: ReturnType<typeof setTimeout>[] = [];
  private scrollObserver?: IntersectionObserver;

  readonly appName = 'Stock SaaS';
  readonly currentYear = new Date().getFullYear();
  readonly contact = environment.landingContact;
  readonly whatsappLink = `https://wa.me/${environment.landingContact.whatsapp}?text=${encodeURIComponent('Bonjour, je souhaite en savoir plus sur Stock SaaS.')}`;

  readonly sectors = [
    {
      icon: 'pi pi-shopping-bag',
      title: 'Boutiques & supérettes',
      description: 'Riz, huile, sucre, boissons — suivez les ventes et les ruptures au quotidien.',
      example: 'Ex. : boutique à Parcelles, HLM ou Médina'
    },
    {
      icon: 'pi pi-wrench',
      title: 'Quincailleries',
      description: 'Ciment, fer, peinture, outillage — stock multi-dépôts par magasin ou entrepôt.',
      example: 'Ex. : dépôt Colobane, succursale Pikine'
    },
    {
      icon: 'pi pi-heart',
      title: 'Pharmacies & parapharmacies',
      description: 'Alertes stock bas, traçabilité des entrées et facturation client intégrée.',
      example: 'Ex. : officine Dakar ou Thiès'
    },
    {
      icon: 'pi pi-truck',
      title: 'Grossistes & importateurs',
      description: 'Entrepôts à Dakar, Thiès ou Saint-Louis — mouvements et inventaires centralisés.',
      example: 'Ex. : dépôt portuaire + point de vente'
    },
    {
      icon: 'pi pi-star',
      title: 'Restaurants & snacks',
      description: 'Matières premières, sorties journalières et contrôle des coûts en FCFA.',
      example: 'Ex. : snack, fast-food, traiteur'
    },
    {
      icon: 'pi pi-map',
      title: 'Multi-régions',
      description: 'Pilotez plusieurs sites dans les 14 régions du Sénégal depuis un seul compte.',
      example: 'Dakar · Thiès · Ziguinchor · Saint-Louis…'
    }
  ];

  readonly paymentMethods = [
    {
      name: 'Wave',
      description: 'Paiement mobile instantané, très utilisé au Sénégal.',
      accent: 'wave'
    },
    {
      name: 'Orange Money',
      description: 'Réglez votre abonnement depuis votre téléphone.',
      accent: 'om'
    }
  ];

  readonly faqItems = [
    {
      question: 'Est-ce que je peux payer avec Wave ou Orange Money ?',
      answer: 'Oui. L\'abonnement se règle par Wave ou Orange Money après votre essai gratuit d\'un mois. Pas de carte bancaire obligatoire.'
    },
    {
      question: 'Puis-je gérer plusieurs magasins ou entrepôts ?',
      answer: 'Oui. Vous pouvez créer plusieurs entrepôts (Dakar, Thiès, etc.) et suivre le stock de chaque site séparément.'
    },
    {
      question: 'Mon gestionnaire peut-il voir seulement son entrepôt ?',
      answer: 'Oui. Le rôle gestionnaire limite l\'accès aux entrepôts qui lui sont assignés — idéal pour les équipes terrain.'
    },
    {
      question: 'Les prix sont-ils bien en FCFA ?',
      answer: 'Tous les tarifs et factures sont en franc CFA (FCFA). Aucune conversion en dollars ou euros.'
    },
    {
      question: 'L\'essai gratuit engage-t-il à quelque chose ?',
      answer: 'Non. Vous disposez d\'un mois complet pour tester toutes les fonctionnalités, sans engagement ni carte bancaire.'
    },
    {
      question: 'Comment contacter le support ?',
      answer: 'Par WhatsApp ou e-mail depuis le bas de cette page. Nous répondons aux horaires de Dakar (GMT).'
    }
  ];

  readonly features = [
    {
      icon: 'pi pi-box',
      title: 'Stock en temps réel',
      description: 'Suivez vos produits, quantités et alertes de rupture depuis chaque entrepôt.'
    },
    {
      icon: 'pi pi-file',
      title: 'Facturation intégrée',
      description: 'Créez des factures, générez des PDF et partagez-les à vos clients en un clic.'
    },
    {
      icon: 'pi pi-arrows-h',
      title: 'Mouvements & inventaires',
      description: 'Entrées, sorties, transferts et inventaires clôturés avec traçabilité complète.'
    },
    {
      icon: 'pi pi-users',
      title: 'Multi-utilisateurs',
      description: 'Rôles adaptés : administrateur, gestionnaire — chacun voit ce dont il a besoin.'
    },
    {
      icon: 'pi pi-building',
      title: 'Multi-entrepôts',
      description: 'Pilotez plusieurs sites et régions depuis une seule plateforme.'
    },
    {
      icon: 'pi pi-shield',
      title: 'SaaS sécurisé',
      description: 'Données isolées par entreprise, hébergement cloud et accès protégé.'
    }
  ];

  readonly steps = [
    { num: '1', title: 'Créez votre compte', text: 'Inscription en 2 minutes — essai gratuit d\'un mois, sans carte.' },
    { num: '2', title: 'Ajoutez vos produits', text: 'Riz, huile, matériaux… et votre entrepôt à Dakar ou ailleurs.' },
    { num: '3', title: 'Facturez & déstockez', text: 'Une facture payée met à jour le stock automatiquement.' },
    { num: '4', title: 'Payez en mobile money', text: 'Abonnement en Wave ou Orange Money quand l\'essai se termine.' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.showSplash = false;
      this.landingRevealed = true;
      this.redirectToDashboard();
      return;
    }

    this.startSplash();
  }

  ngAfterViewInit(): void {
    if (this.landingRevealed) {
      this.initScrollReveal();
    }
  }

  ngOnDestroy(): void {
    this.splashTimers.forEach(clearTimeout);
    this.scrollObserver?.disconnect();
    this.lockBodyScroll(false);
  }

  private startSplash(): void {
    this.lockBodyScroll(true);

    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const displayMs = reducedMotion ? 500 : 2400;
    const exitMs = reducedMotion ? 200 : 700;

    this.splashTimers.push(
      setTimeout(() => {
        this.splashExiting = true;
        this.splashTimers.push(
          setTimeout(() => {
            this.showSplash = false;
            this.landingRevealed = true;
            this.lockBodyScroll(false);
            setTimeout(() => this.initScrollReveal(), 50);
          }, exitMs)
        );
      }, displayMs)
    );
  }

  private initScrollReveal(): void {
    if (this.scrollObserver) {
      return;
    }

    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.revealElements?.forEach((el) => el.nativeElement.classList.add('is-visible'));
      return;
    }

    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.scrollObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    this.revealElements?.forEach((el) => this.scrollObserver!.observe(el.nativeElement));
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private lockBodyScroll(lock: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  private redirectToDashboard(): void {
    if (this.authService.isSuperAdmin()) {
      this.router.navigate(['/super-admin/dashboard']);
    } else if (this.authService.isAdminEntreprise()) {
      this.router.navigate(['/company-admin/dashboard']);
    } else if (this.authService.isGestionnaire()) {
      this.router.navigate(['/gestionnaire/dashboard']);
    } else {
      this.router.navigate(['/gestion/dashboard']);
    }
  }
}
