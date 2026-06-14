import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

export interface OnboardingStepView {
  id: string;
  title: string;
  description: string;
  routerLink: string;
  queryParams?: Record<string, string>;
  done: boolean;
}

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './onboarding-checklist.component.html',
  styleUrl: './onboarding-checklist.component.scss'
})
export class OnboardingChecklistComponent {
  @Input() steps: OnboardingStepView[] = [];
  @Output() dismiss = new EventEmitter<void>();

  get completedCount(): number {
    return this.steps.filter((step) => step.done).length;
  }

  get progressPercent(): number {
    if (this.steps.length === 0) {
      return 0;
    }
    return Math.round((this.completedCount / this.steps.length) * 100);
  }

  get allDone(): boolean {
    return this.steps.length > 0 && this.completedCount === this.steps.length;
  }

  trackByStepId(_index: number, step: OnboardingStepView): string {
    return step.id;
  }

  onDismiss(): void {
    this.dismiss.emit();
  }
}
