import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';

@Component({
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  form: FormGroup;
  loading = false;
  error = '';
  showPass = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    // Si ya tiene sesión, redirigir
    if (this.auth.loggedIn()) this.router.navigate(['/dashboard']);

    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = '';

    const { username, password } = this.form.value;

    this.auth.login(username, password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.respuesta === 'success') {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = res.mensaje;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.mensaje ?? 'Error de conexión con el servidor';
      },
    });
  }
}