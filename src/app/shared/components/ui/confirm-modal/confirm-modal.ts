import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-modal',
  imports: [MatIconModule],
  template: `
    @if (open()) {
      <div class="modal-bg" (click)="cancel()">
        <section
          class="modal confirm-modal"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-message"
          (click)="$event.stopPropagation()">
          <header class="modal-head">
            <h3 id="confirm-modal-title">{{ title() }}</h3>
            <button class="modal-close" type="button" aria-label="Cerrar" (click)="cancel()">
              <mat-icon>close</mat-icon>
            </button>
          </header>
          <div class="modal-body">
            <p id="confirm-modal-message">{{ message() }}</p>
          </div>
          <footer class="modal-foot">
            @if (!acknowledgement()) {
              <button class="btn-secondary" type="button" (click)="cancel()">Cancelar</button>
            }
            <button [class]="confirmClass()" type="button" (click)="confirmed.emit()">
              {{ confirmText() }}
            </button>
          </footer>
        </section>
      </div>
    }
  `,
  styles: [`
    .modal-bg {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(15, 23, 42, .48);
    }

    .confirm-modal {
      width: 440px;
      max-width: calc(100vw - 32px);
      overflow: hidden;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 24px 64px rgba(15, 23, 42, .24);
    }

    .modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 22px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-head h3 {
      margin: 0;
      color: #111827;
      font-size: 16px;
    }

    .modal-close {
      display: inline-flex;
      border: 0;
      background: transparent;
      color: #6b7280;
      cursor: pointer;
    }

    .modal-body {
      padding: 20px 22px;
    }

    .modal-body p {
      margin: 0;
      color: #4b5563;
      line-height: 1.55;
    }

    .modal-foot {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 22px;
      border-top: 1px solid #e5e7eb;
    }
  `],
})
export class ConfirmModal {
  readonly open = input(false);
  readonly title = input('Confirmar acción');
  readonly message = input('¿Deseas continuar?');
  readonly confirmText = input('Confirmar');
  readonly variant = input<'danger' | 'primary' | 'success'>('primary');
  readonly acknowledgement = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  confirmClass(): string {
    const variantClasses = {
      danger: 'btn-danger',
      primary: 'btn-primary',
      success: 'btn-success',
    };
    return variantClasses[this.variant()];
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
