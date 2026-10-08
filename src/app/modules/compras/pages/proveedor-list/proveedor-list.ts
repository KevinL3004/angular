import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { ComprasService } from '../../../../core/services/compras';
import { EscuelasService } from '../../../../core/services/escuelas';
import { AuthService } from '../../../../core/services/auth';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';
import { ConfirmModal } from '../../../../shared/components/ui/confirm-modal/confirm-modal';

@Component({
  selector: 'app-proveedor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PageHeader, Loading, EmptyState, ConfirmModal],
  templateUrl: './proveedor-list.html',
  styleUrl: './proveedor-list.scss',
})
export class ProveedorList implements OnInit {
  escuelas: any[] = [];
  proveedores: any[] = [];
  escuelaId = '';
  loading = true;
  guardando = false;
  showModal = false;
  proveedorPendiente: any = null;
  actualizandoEstado = false;
  error = '';
  puedeCrear = false;
  puedeToggle = false;
  nuevo = this.vacio();

  constructor(
    private readonly compras: ComprasService,
    private readonly escuelasService: EscuelasService,
    private readonly auth: AuthService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    const rol = this.auth.rol();
    this.puedeCrear = ['tecnico_mineduc', 'director', 'secretaria_opf'].includes(rol ?? '');
    this.puedeToggle = ['tecnico_mineduc', 'director'].includes(rol ?? '');
  }

  ngOnInit(): void {
    this.escuelasService.getAll().subscribe({
      next: response => {
        this.escuelas = response.data ?? [];
        if (this.escuelas.length) {
          this.escuelaId = this.escuelas[0].id;
          this.cargar();
        } else {
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: () => { this.error = 'No se pudieron cargar las escuelas'; this.loading = false; this.cdr.markForCheck(); },
    });
  }

  cargar(): void {
    if (!this.escuelaId) return;
    this.loading = true;
    this.error = '';
    this.compras.getProveedores(this.escuelaId).pipe(finalize(() => {
      this.loading = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: response => { this.proveedores = response.data ?? []; },
      error: () => { this.error = 'No se pudieron cargar los proveedores'; },
    });
  }

  abrirCrear(): void {
    this.nuevo = this.vacio();
    this.showModal = true;
  }

  guardar(): void {
    this.guardando = true;
    this.compras.crearProveedor({ ...this.nuevo, escuelaId: this.escuelaId }).pipe(finalize(() => {
      this.guardando = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.showModal = false; this.cargar(); },
      error: error => { this.error = error?.error?.mensaje ?? 'No se pudo guardar el proveedor'; this.cdr.markForCheck(); },
    });
  }

  toggle(proveedor: any): void {
    this.proveedorPendiente = proveedor;
  }

  confirmarCambioEstado(): void {
    if (!this.proveedorPendiente || this.actualizandoEstado) return;
    this.actualizandoEstado = true;
    this.compras.toggleProveedor(this.proveedorPendiente.id).pipe(finalize(() => {
      this.actualizandoEstado = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.proveedorPendiente = null; this.cargar(); },
      error: error => { this.error = error?.error?.mensaje ?? 'No se pudo actualizar el proveedor'; },
    });
  }

  private vacio() {
    return { nombre: '', contacto: '', telefono: '', nit: '', productosQueProvee: '' };
  }
}