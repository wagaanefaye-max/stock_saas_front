import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="app-empty-state">
      <i [class]="icon"></i>
      <p>{{ message }}</p>
      <button
        *ngIf="actionLabel"
        pButton
        [label]="actionLabel"
        [icon]="actionIcon"
        class="p-button-sm"
        (click)="action.emit()">
      </button>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon = 'pi pi-inbox';
  @Input() message = 'Aucun élément trouvé';
  @Input() actionLabel = '';
  @Input() actionIcon = 'pi pi-plus';
  @Output() action = new EventEmitter<void>();
}
