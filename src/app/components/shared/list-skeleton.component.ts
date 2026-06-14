import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="list-skeleton"
      role="status"
      aria-live="polite"
      [attr.aria-label]="ariaLabel">
      <div class="list-skeleton__card" *ngFor="let _ of placeholders; trackBy: trackByIndex">
        <div class="list-skeleton__line list-skeleton__line--title"></div>
        <div class="list-skeleton__line list-skeleton__line--medium"></div>
        <div class="list-skeleton__line list-skeleton__line--short"></div>
        <div class="list-skeleton__stats">
          <span class="list-skeleton__stat"></span>
          <span class="list-skeleton__stat"></span>
          <span class="list-skeleton__stat"></span>
        </div>
      </div>
    </div>
  `
})
export class ListSkeletonComponent {
  @Input() count = 3;
  @Input() ariaLabel = 'Chargement de la liste…';

  get placeholders(): number[] {
    return Array.from({ length: Math.max(1, this.count) }, (_, index) => index);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
