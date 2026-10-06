import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponse, Usuario, ROL_PERMISOS } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  // Signals reactivos
  private _usuario = signal<Usuario | null>(this._loadUsuario());
  private _token = signal<string | null>(localStorage.getItem('access_token'));

  usuario = this._usuario.asReadonly();
  token = this._token.asReadonly();
  loggedIn = computed(() => !!this._token());
  rol = computed(() => this._usuario()?.rol ?? null);

  constructor(private http: HttpClient, private router: Router) { }

  login(username: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.api}/auth/login`, { username, password }
    ).pipe(
      tap(res => {
        if (res.respuesta === 'success') {
          this._guardarSesion(res.data);
        }
      })
    );
  }

  logout(): void {
    const token = this._token();
    if (token) {
      this.http.post(`${this.api}/auth/logout`, {}).subscribe();
    }
    this._limpiarSesion();
    this.router.navigate(['/auth/login']);
  }

  tienePermiso(modulo: string): boolean {
    const rol = this.rol();
    if (!rol) return false;
    return ROL_PERMISOS[rol]?.includes(modulo) ?? false;
  }

  private _guardarSesion(data: AuthResponse): void {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    this._token.set(data.access_token);
    this._usuario.set(data.usuario);
  }

  private _limpiarSesion(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('usuario');
    this._token.set(null);
    this._usuario.set(null);
  }

  private _loadUsuario(): Usuario | null {
    const raw = localStorage.getItem('usuario');
    return raw ? JSON.parse(raw) : null;
  }
}