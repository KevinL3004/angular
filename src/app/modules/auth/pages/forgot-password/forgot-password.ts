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
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
})
export class ForgotPassword {
  form: FormGroup;
  loading = false;
  enviado = false;
  error = '';
  mensaje = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = '';

    this.http.post<any>(
      `${environment.apiUrl}/auth/forgot-password`,
      { username: this.form.value.username }
    ).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
    ).subscribe({
      next: (res) => {
        if (res.respuesta === 'success') {
          this.enviado = true;
          this.mensaje = res.mensaje;
          // En desarrollo el token viene en la respuesta
          if (res.data?.reset_token) {
            // Guardarlo temporalmente para ir a reset
            sessionStorage.setItem('reset_username', this.form.value.username);
            sessionStorage.setItem('reset_token', res.data.reset_token);
          }
        } else {
          this.error = res.mensaje;
        }
      },
      error: (err) => {
        this.error = err?.error?.mensaje ?? 'Error de conexión';
      },
    });
  }

  irAReset(): void {
    this.router.navigate(['/auth/reset-password']);
  }
}