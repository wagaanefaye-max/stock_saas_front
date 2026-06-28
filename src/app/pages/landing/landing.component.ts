import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LandingChatbotComponent } from '../../components/shared/landing-chatbot.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, LandingChatbotComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('reveal') revealElements!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('heroChartCanvas') heroChartCanvas?: ElementRef<HTMLCanvasElement>;

  showSplash = true;
  splashExiting = false;
  landingRevealed = false;

  private splashTimers: ReturnType<typeof setTimeout>[] = [];
  private scrollObserver?: IntersectionObserver;
  private chartRaf = 0;
  private chartResizeObs?: ResizeObserver;
  private readonly heroChartBase = [0.42, 0.58, 0.52, 0.74, 0.68, 0.82, 0.76, 0.88];

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
    this.stopHeroChart();
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
            setTimeout(() => {
              this.initScrollReveal();
              this.initHeroChart();
            }, 50);
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

  private initHeroChart(): void {
    const canvas = this.heroChartCanvas?.nativeElement;
    if (!canvas || typeof window === 'undefined') {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const parent = canvas.parentElement;
    if (!parent) {
      return;
    }

    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    this.chartResizeObs?.disconnect();
    this.chartResizeObs = new ResizeObserver(resize);
    this.chartResizeObs.observe(parent);

    if (reducedMotion) {
      this.drawHeroChart(canvas, this.heroChartBase, 0);
      return;
    }

    let tick = 0;
    const animate = (): void => {
      tick += 0.018;
      const data = this.heroChartBase.map((value, index) => {
        const wave = Math.sin(tick + index * 0.75) * 0.035;
        return Math.min(0.95, Math.max(0.25, value + wave));
      });
      this.drawHeroChart(canvas, data, tick);
      this.chartRaf = requestAnimationFrame(animate);
    };
    animate();
  }

  private stopHeroChart(): void {
    if (this.chartRaf) {
      cancelAnimationFrame(this.chartRaf);
      this.chartRaf = 0;
    }
    this.chartResizeObs?.disconnect();
    this.chartResizeObs = undefined;
  }

  private drawHeroChart(canvas: HTMLCanvasElement, values: number[], tick: number): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const dpr = canvas.width / (canvas.clientWidth || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const padX = 8;
    const padTop = 22;
    const padBottom = 8;
    const chartH = height - padTop - padBottom;
    const chartW = width - padX * 2;

    ctx.clearRect(0, 0, width, height);

    const points = values.map((value, index) => ({
      x: padX + (index / (values.length - 1)) * chartW,
      y: padTop + chartH * (1 - value)
    }));

    const gradient = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.28)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padBottom);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, height - padBottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#2563EB';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (tick > 0) {
      const pulse = 4 + Math.sin(tick * 2) * 1.5;
      ctx.beginPath();
      ctx.arc(last.x, last.y, pulse + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}
