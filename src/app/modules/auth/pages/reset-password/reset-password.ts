import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../../../environments/environment';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
})
export class ResetPassword {
  form: FormGroup;
  loading = false;
  exito = false;
  error = '';
  showPass = false;
  showPass2 = false;

  private username = sessionStorage.getItem('reset_username') ?? '';
  private token = sessionStorage.getItem('reset_token') ?? '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    // Si no hay token en sesión, redirigir
    if (!this.token) this.router.navigate(['/auth/forgot-password']);

    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordsMatch });
  }

  passwordsMatch(g: FormGroup) {
    const p1 = g.get('newPassword')?.value;
    const p2 = g.get('confirmPassword')?.value;
    return p1 === p2 ? null : { noMatch: true };
  }

  submit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = '';

    const resetToken = `${this.username}:${this.token}`;

    this.http.post<any>(
      `${environment.apiUrl}/auth/reset-password`,
      { resetToken, newPassword: this.form.value.newPassword }
    ).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
    ).subscribe({
      next: (res) => {
        if (res.respuesta === 'success') {
          this.exito = true;
          sessionStorage.removeItem('reset_username');
          sessionStorage.removeItem('reset_token');
          setTimeout(() => this.router.navigate(['/auth/login']), 2500);
        } else {
          this.error = res.mensaje;
        }
      },
      error: (err) => {
        this.error = err?.error?.mensaje ?? 'Token inválido o expirado';
      },
    });
  }
}