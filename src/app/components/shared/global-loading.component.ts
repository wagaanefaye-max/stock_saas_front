import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-global-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="global-loading" role="status" aria-live="polite" aria-label="Chargement">
      <div class="global-loading__backdrop"></div>
      <div class="global-loading__content">
        <div class="list-skeleton global-loading__skeleton">
          <div *ngFor="let _ of placeholders" class="list-skeleton__card">
            <div class="list-skeleton__line list-skeleton__line--title"></div>
            <div class="list-skeleton__line list-skeleton__line--short"></div>
            <div class="list-skeleton__line list-skeleton__line--medium"></div>
            <div class="list-skeleton__stats">
              <div class="list-skeleton__stat"></div>
              <div class="list-skeleton__stat"></div>
              <div class="list-skeleton__stat"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GlobalLoadingComponent {
  readonly placeholders = [0, 1, 2];
}
