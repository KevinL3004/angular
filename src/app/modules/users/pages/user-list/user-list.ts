import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UsersService } from '../../../../core/services/users';
import { Usuario, ROL_LABELS } from '../../../../core/models/user.model';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';
import { ConfirmModal } from '../../../../shared/components/ui/confirm-modal/confirm-modal';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PageHeader, Loading, EmptyState, ConfirmModal],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList implements OnInit {
  usuarios: Usuario[] = [];
  loading = true;
  error = '';
  readonly rolLabels = ROL_LABELS;
  readonly roles = Object.keys(ROL_LABELS) as (keyof typeof ROL_LABELS)[];
  showModal = false;
  editando: Usuario | null = null;
  guardando = false;
  usuarioPendiente: Usuario | null = null;
  confirmandoEstado = false;
  formulario = this.formularioVacio();

  constructor(
    private readonly usersService: UsersService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    this.usersService.getAll().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
    ).subscribe({
      next: response => {
        this.usuarios = response.data ?? [];
      },
      error: () => {
        this.error = 'No se pudieron cargar los usuarios';
      },
    });
  }

  abrirCrear(): void {
    this.editando = null;
    this.formulario = this.formularioVacio();
    this.showModal = true;
  }

  abrirEditar(usuario: Usuario): void {
    this.editando = usuario;
    this.formulario = {
      username: usuario.username,
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo ?? '',
      rol: usuario.rol,
      password: '',
    };
    this.showModal = true;
  }

  guardar(): void {
    this.guardando = true;
    const request = this.editando
      ? this.usersService.actualizar(this.editando.id, {
          nombreCompleto: this.formulario.nombreCompleto,
          correo: this.formulario.correo || undefined,
          rol: this.formulario.rol,
          ...(this.formulario.password ? { password: this.formulario.password } : {}),
        })
      : this.usersService.crear({ ...this.formulario, correo: this.formulario.correo || undefined });

    request.pipe(finalize(() => {
      this.guardando = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.showModal = false;
        this.cargar();
      },
      error: (error) => {
        this.error = error?.error?.mensaje ?? 'No se pudo guardar el usuario';
        this.cdr.markForCheck();
      },
    });
  }

  cambiarEstado(usuario: Usuario): void {
    this.usuarioPendiente = usuario;
  }

  confirmarCambioEstado(): void {
    if (!this.usuarioPendiente || this.confirmandoEstado) return;
    const usuario = this.usuarioPendiente;
    const accion = usuario.activo ? 'desactivar' : 'activar';
    this.confirmandoEstado = true;
    this.usersService.actualizar(usuario.id, { activo: !usuario.activo }).pipe(finalize(() => {
      this.confirmandoEstado = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.usuarioPendiente = null; this.cargar(); },
      error: () => {
        this.error = `No se pudo ${accion} el usuario`;
        this.cdr.markForCheck();
      },
    });
  }

  private formularioVacio() {
    return { username: '', nombreCompleto: '', correo: '', rol: 'director' as keyof typeof ROL_LABELS, password: '' };
  }
}
