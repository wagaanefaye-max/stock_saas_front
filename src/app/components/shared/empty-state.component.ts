import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="app-empty-state" role="status">
      <i [class]="icon" aria-hidden="true"></i>
      <p>{{ message }}</p>
      <div class="app-empty-state__actions" *ngIf="actionLabel || secondaryActionLabel">
        <button
          *ngIf="secondaryActionLabel"
          pButton
          type="button"
          [label]="secondaryActionLabel"
          [icon]="secondaryActionIcon"
          class="p-button-outlined p-button-sm"
          (click)="secondaryAction.emit()">
        </button>
        <button
          *ngIf="actionLabel"
          pButton
          type="button"
          [label]="actionLabel"
          [icon]="actionIcon"
          class="p-button-sm"
          (click)="action.emit()">
        </button>
      </div>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon = 'pi pi-inbox';
  @Input() message = 'Aucun élément trouvé';
  @Input() actionLabel = '';
  @Input() actionIcon = 'pi pi-plus';
  @Input() secondaryActionLabel = '';
  @Input() secondaryActionIcon = 'pi pi-refresh';
  @Output() action = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();
}
