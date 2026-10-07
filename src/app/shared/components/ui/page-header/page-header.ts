import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-sub" *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
      gap: 16px;
    }
    .page-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px;
    }
    .page-sub {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    .header-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
  `],
})
export class PageHeader {
  @Input() title = '';
  @Input() subtitle = '';
}