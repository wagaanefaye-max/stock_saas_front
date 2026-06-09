import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="list-skeleton" [attr.aria-busy]="true" aria-label="Chargement">
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
  `
})
export class ListSkeletonComponent {
  @Input() count = 6;

  get placeholders(): number[] {
    return Array.from({ length: Math.max(1, this.count) }, (_, i) => i);
  }
}
