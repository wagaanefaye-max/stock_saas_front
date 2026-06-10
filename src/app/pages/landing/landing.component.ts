import { AfterViewInit, Component, ElementRef, OnInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit, AfterViewInit {
  @ViewChildren('reveal') revealElements!: QueryList<ElementRef<HTMLElement>>;

  readonly currentYear = new Date().getFullYear();

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
    { num: '1', title: 'Créez votre compte', text: 'Inscription rapide avec essai gratuit d\'un mois.' },
    { num: '2', title: 'Configurez vos entrepôts', text: 'Ajoutez produits, partenaires et utilisateurs.' },
    { num: '3', title: 'Pilotez au quotidien', text: 'Stock, factures et rapports depuis n\'importe où.' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.redirectToDashboard();
    }
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.revealElements?.forEach((el) => el.nativeElement.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    this.revealElements?.forEach((el) => observer.observe(el.nativeElement));
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
