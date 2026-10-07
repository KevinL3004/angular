import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="empty">
      <mat-icon>{{ icon }}</mat-icon>
      <p class="empty-title">{{ title }}</p>
      <p class="empty-sub">{{ subtitle }}</p>
    </div>
  `,
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 0;
      color: #9ca3af;
      text-align: center;
      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    }
    .empty-title { font-size: 15px; font-weight: 600; color: #374151; margin: 0 0 6px; }
    .empty-sub   { font-size: 13px; color: #9ca3af; margin: 0; }
  `],
})
export class EmptyState {
  @Input() icon = 'inbox';
  @Input() title = 'Sin datos';
  @Input() subtitle = '';
}