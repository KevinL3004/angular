import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { ComprasService } from '../../../../core/services/compras';
import { EscuelasService } from '../../../../core/services/escuelas';
import { MenusService } from '../../../../core/services/menus';
import { AuthService } from '../../../../core/services/auth';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';
import { ConfirmModal } from '../../../../shared/components/ui/confirm-modal/confirm-modal';

@Component({
  selector: 'app-compra-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PageHeader, Loading, EmptyState, ConfirmModal],
  templateUrl: './compra-list.html',
  styleUrl: './compra-list.scss',
})
export class CompraList implements OnInit {
  escuelas: any[] = [];
  compras: any[] = [];
  planes: any[] = [];
  proveedores: any[] = [];
  alimentos: any[] = [];
  escuelaId = '';
  loading = true;
  showModal = false;
  compraDetalle: any = null;
  compraPendiente: any = null;
  accionPendiente: 'verificar' | 'rechazar' | null = null;
  actualizandoEstado = false;
  guardando = false;
  puedeRegistrar = false;
  puedeRevisar = false;
  error = '';
  nueva = this.formularioVacio();

  constructor(
    private readonly comprasService: ComprasService,
    private readonly escuelasService: EscuelasService,
    private readonly menusService: MenusService,
    private readonly auth: AuthService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    const rol = this.auth.rol();
    this.puedeRegistrar = ['tecnico_mineduc', 'director', 'secretaria_opf'].includes(rol ?? '');
    this.puedeRevisar = ['tecnico_mineduc', 'director'].includes(rol ?? '');
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
      error: () => { this.loading = false; this.error = 'No se pudieron cargar las escuelas'; this.cdr.markForCheck(); },
    });
    this.menusService.getAlimentos().subscribe({ next: response => { this.alimentos = response.data ?? []; this.cdr.markForCheck(); } });
  }

  cargar(): void {
    if (!this.escuelaId) return;
    this.loading = true;
    this.error = '';
    this.comprasService.getPlanes(this.escuelaId).subscribe({ next: response => { this.planes = response.data ?? []; this.cdr.markForCheck(); } });
    this.comprasService.getProveedores(this.escuelaId).subscribe({ next: response => { this.proveedores = response.data ?? []; this.cdr.markForCheck(); } });
    this.comprasService.getCompras(this.escuelaId).pipe(finalize(() => {
      this.loading = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: response => { this.compras = response.data ?? []; },
      error: () => { this.error = 'No se pudieron cargar las compras'; },
    });
  }

  abrirRegistro(): void {
    this.nueva = this.formularioVacio();
    this.nueva.fechaCompra = new Date().toISOString().slice(0, 10);
    this.showModal = true;
  }

  seleccionarPlan(): void {
    const plan = this.planes.find(item => item.id === this.nueva.planId);
    this.nueva.items = (plan?.items ?? []).map((item: any) => ({
      alimentoId: item.alimento?.id ?? item.alimentoId ?? '',
      cantidadComprada: Number(item.cantidadAComprar) || 0,
      unidad: item.unidad ?? '',
      precioUnitarioQ: Number(item.precioUnitarioQ) || 0,
    }));
  }

  agregarItem(): void {
    this.nueva.items.push({ alimentoId: '', cantidadComprada: 0, unidad: '', precioUnitarioQ: 0 });
  }

  quitarItem(index: number): void {
    this.nueva.items.splice(index, 1);
  }

  total(): number {
    return this.nueva.items.reduce((sum, item) => sum + Number(item.cantidadComprada) * Number(item.precioUnitarioQ), 0);
  }

  formularioValido(): boolean {
    return Boolean(this.nueva.planId && this.nueva.fechaCompra && this.nueva.items.length)
      && this.total() > 0
      && this.nueva.items.every(item => item.alimentoId && item.cantidadComprada > 0 && item.precioUnitarioQ > 0 && item.unidad.trim());
  }

  guardar(): void {
    this.guardando = true;
    const payload = {
      ...this.nueva,
      proveedorId: this.nueva.proveedorId || undefined,
      totalGastadoQ: Math.round(this.total() * 100) / 100,
      items: this.nueva.items.map(item => ({
        ...item,
        cantidadComprada: Number(item.cantidadComprada),
        precioUnitarioQ: Number(item.precioUnitarioQ),
      })),
    };
    this.comprasService.registrarCompra(payload).pipe(finalize(() => {
      this.guardando = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.showModal = false; this.cargar(); },
      error: error => { this.error = error?.error?.mensaje ?? 'No se pudo registrar la compra'; this.cdr.markForCheck(); },
    });
  }

  cambiarEstado(compra: any, accion: 'verificar' | 'rechazar'): void {
    this.compraPendiente = compra;
    this.accionPendiente = accion;
  }

  verDetalle(compra: any): void {
    this.compraDetalle = compra;
  }

  confirmarCambioEstado(): void {
    if (!this.compraPendiente || !this.accionPendiente || this.actualizandoEstado) return;
    const compra = this.compraPendiente;
    const accion = this.accionPendiente;
    const request = accion === 'verificar'
      ? this.comprasService.verificarCompra(compra.id)
      : this.comprasService.rechazarCompra(compra.id);
    this.actualizandoEstado = true;
    request.pipe(finalize(() => {
      this.actualizandoEstado = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.compraPendiente = null; this.accionPendiente = null; this.cargar(); },
      error: () => { this.error = 'No se pudo actualizar la compra'; this.cdr.markForCheck(); },
    });
  }

  private formularioVacio() {
    return {
      planId: '', proveedorId: '', fechaCompra: '', totalGastadoQ: 0,
      numeroFactura: '', observaciones: '',
      items: [] as { alimentoId: string; cantidadComprada: number; unidad: string; precioUnitarioQ: number }[],
    };
  }
}