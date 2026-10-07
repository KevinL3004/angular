import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-wrap">
      <mat-spinner diameter="36"></mat-spinner>
      <span>Cargando...</span>
    </div>
  `,
  styles: [`
    .loading-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
      gap: 14px;
      color: #6b7280;
      font-size: 13px;
    }
  `],
})
export class Loading { }