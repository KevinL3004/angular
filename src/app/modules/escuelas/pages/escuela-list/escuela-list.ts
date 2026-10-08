import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EscuelasService } from '../../../../core/services/escuelas';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';
import { ConfirmModal } from '../../../../shared/components/ui/confirm-modal/confirm-modal';
import { AuthService } from '../../../../core/services/auth';
import { UsersService } from '../../../../core/services/users';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-escuela-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PageHeader, Loading, EmptyState, ConfirmModal],
  templateUrl: './escuela-list.html',
  styleUrls: ['./escuela-list.scss'],
})
export class EscuelaList implements OnInit {
  escuelas: any[] = [];
  loading = true;
  error = '';
  esTecnico = false;
  showModal = false;
  guardando = false;
  editando: any = null;
  formulario = this.formularioVacio();
  showUsuariosModal = false;
  escuelaUsuarios: any[] = [];
  usuariosDisponibles: any[] = [];
  usuarioId = '';
  escuelaSeleccionada: any = null;
  escuelaPendiente: any = null;
  desactivando = false;
  escuelaDetalle: any = null;

  constructor(
    private svc: EscuelasService,
    private auth: AuthService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef,
  ) {
    this.esTecnico = this.auth.rol() === 'tecnico_mineduc';
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.error = '';
    this.loading = true;
    this.svc.getAll().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
    ).subscribe({
      next: r => { this.escuelas = r.data ?? []; },
      error: () => { this.error = 'No se pudieron cargar las escuelas'; },
    });
  }

  desactivar(id: string): void {
    this.escuelaPendiente = this.escuelas.find(escuela => escuela.id === id) ?? null;
  }

  confirmarDesactivar(): void {
    if (!this.escuelaPendiente || this.desactivando) return;
    this.desactivando = true;
    this.svc.desactivar(this.escuelaPendiente.id).pipe(finalize(() => {
      this.desactivando = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.escuelaPendiente = null; this.cargar(); },
      error: error => { this.error = error?.error?.mensaje ?? 'No se pudo desactivar la escuela'; },
    });
  }

  abrirCrear(): void {
    this.editando = null;
    this.formulario = this.formularioVacio();
    this.showModal = true;
  }

  abrirEditar(escuela: any): void {
    this.editando = escuela;
    this.formulario = {
      codigoMineduc: escuela.codigoMineduc,
      nombre: escuela.nombre,
      municipio: escuela.municipio,
      departamento: escuela.departamento,
      direccion: escuela.direccion ?? '',
      matriculaActual: escuela.matriculaActual,
    };
    this.showModal = true;
  }

  verDetalle(escuela: any): void {
    this.escuelaDetalle = escuela;
  }

  guardar(): void {
    this.guardando = true;
    const request = this.editando
      ? this.svc.actualizar(this.editando.id, {
          nombre: this.formulario.nombre,
          municipio: this.formulario.municipio,
          departamento: this.formulario.departamento,
          direccion: this.formulario.direccion || undefined,
          matriculaActual: Number(this.formulario.matriculaActual),
        })
      : this.svc.crear({ ...this.formulario, matriculaActual: Number(this.formulario.matriculaActual) });
    request.pipe(finalize(() => {
      this.guardando = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.showModal = false; this.cargar(); },
      error: (error) => {
        this.error = error?.error?.mensaje ?? 'No se pudo guardar la escuela';
        this.cdr.markForCheck();
      },
    });
  }

  abrirUsuarios(escuela: any): void {
    this.escuelaSeleccionada = escuela;
    this.usuarioId = '';
    this.showUsuariosModal = true;
    this.cargarUsuariosEscuela();
  }

  cargarUsuariosEscuela(): void {
    if (!this.escuelaSeleccionada) return;
    this.svc.getUsuarios(this.escuelaSeleccionada.id).subscribe({
      next: response => {
        this.escuelaUsuarios = response.data ?? [];
        this.usersService.getAll().subscribe({
          next: users => {
            const asignados = new Set(this.escuelaUsuarios.map(link => link.usuario?.id));
            this.usuariosDisponibles = (users.data ?? []).filter(user => !asignados.has(user.id));
            this.cdr.markForCheck();
          },
        });
      },
      error: () => { this.error = 'No se pudieron cargar los usuarios de la escuela'; this.cdr.markForCheck(); },
    });
  }

  asignarUsuario(): void {
    if (!this.escuelaSeleccionada || !this.usuarioId) return;
    this.svc.asignarUsuario(this.escuelaSeleccionada.id, this.usuarioId).subscribe({
      next: () => { this.usuarioId = ''; this.cargarUsuariosEscuela(); },
      error: error => { this.error = error?.error?.mensaje ?? 'No se pudo asignar el usuario'; this.cdr.markForCheck(); },
    });
  }

  private formularioVacio() {
    return { codigoMineduc: '', nombre: '', municipio: '', departamento: '', direccion: '', matriculaActual: 0 };
  }
}