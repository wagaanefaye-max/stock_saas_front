import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { AppPreloadStrategy } from './app/config/app-preload.strategy';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { PRIMENG_FR } from './app/config/primeng-fr.translation';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withPreloading(AppPreloadStrategy),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })
    ),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    ConfirmationService,
    providePrimeNG({
      translation: PRIMENG_FR,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
          cssLayer: false
        }
      }
    })
  ]
}).catch(err => console.error(err));

