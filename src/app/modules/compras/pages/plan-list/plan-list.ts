import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize, Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { ComprasService } from '../../../../core/services/compras';
import { EscuelasService } from '../../../../core/services/escuelas';
import { MenusService } from '../../../../core/services/menus';
import { AuthService } from '../../../../core/services/auth';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';
import { ConfirmModal } from '../../../../shared/components/ui/confirm-modal/confirm-modal';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, PageHeader, Loading, EmptyState, ConfirmModal],
  templateUrl: './plan-list.html',
  styleUrls: ['./plan-list.scss'],
})
export class PlanList implements OnInit {
  planes: any[] = [];
  escuelas: any[] = [];
  alimentos: any[] = [];
  menus: any[] = [];
  asignaciones: any[] = [];
  asignacion: any = null;
  escuelaId = '';
  loading = true;
  showModal = false;
  guardando = false;
  resumen: any = null;
  showAsignacionModal = false;
  planDetalle: any = null;
  accionConfirmacion: { title: string; message: string; confirmText: string; variant: 'danger' | 'primary' | 'success'; run: () => Observable<ApiResponse<any>> } | null = null;
  procesandoAccion = false;
  mensajeModal: { title: string; message: string } | null = null;
  guardandoAsignacion = false;
  puedeAsignar = false;
  puedeCrearPlan = false;
  puedeAprobarPlan = false;
  nuevaAsignacion = this.asignacionVacia();

  plan = {
    escuelaId: '', asignacionId: '', semanaInicio: '',
    semanaFin: '', numEstudiantes: 0,
    items: [] as { alimentoId: string; cantidadAComprar: number; unidad: string; precioUnitarioQ: number }[],
  };

  constructor(
    private svc: ComprasService,
    private escSvc: EscuelasService,
    private menSvc: MenusService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.escSvc.getAll().subscribe(r => {
      this.escuelas = r.data ?? [];
      if (this.escuelas.length) {
        this.escuelaId = this.escuelas[0].id;
        this.cargar();
      }
      this.cdr.markForCheck();
    });
    this.menSvc.getAlimentos().subscribe(r => {
      this.alimentos = r.data ?? [];
    });
    this.menSvc.getAll().subscribe(r => {
      this.menus = r.data ?? [];
      this.cdr.markForCheck();
    });
    const rol = this.auth.rol();
    this.puedeAsignar = rol === 'tecnico_mineduc';
    this.puedeCrearPlan = ['tecnico_mineduc', 'director', 'secretaria_opf'].includes(rol ?? '');
    this.puedeAprobarPlan = ['tecnico_mineduc', 'director'].includes(rol ?? '');
  }

  cargar(): void {
    if (!this.escuelaId) return;
    this.loading = true;

    this.svc.getAsignacionActiva(this.escuelaId).subscribe(r => {
      this.asignacion = r.data;
      this.cdr.markForCheck();
    });
    this.svc.getAsignaciones(this.escuelaId).subscribe(r => {
      this.asignaciones = r.data ?? [];
      this.cdr.markForCheck();
    });

    this.svc.getResumen(this.escuelaId).subscribe(r => {
      this.resumen = r.data;
      this.cdr.markForCheck();
    });

    this.svc.getPlanes(this.escuelaId).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: r => { this.planes = r.data ?? []; },
      error: () => { },
    });
  }

  abrirModal(): void {
    if (!this.asignacion) {
      this.mostrarMensaje('No hay asignación activa para esta escuela. Crea una asignación antes de generar el plan.');
      return;
    }
    const esc = this.escuelas.find(e => e.id === this.escuelaId);
    this.plan = {
      escuelaId: this.escuelaId,
      asignacionId: this.asignacion.id,
      semanaInicio: '', semanaFin: '',
      numEstudiantes: esc?.matriculaActual ?? 0,
      items: [{ alimentoId: '', cantidadAComprar: 0, unidad: 'lb', precioUnitarioQ: 0 }],
    };
    this.showModal = true;
  }

  abrirAsignacion(): void {
    this.nuevaAsignacion = { ...this.asignacionVacia(), escuelaId: this.escuelaId };
    this.showAsignacionModal = true;
  }

  guardarAsignacion(): void {
    this.guardandoAsignacion = true;
    this.svc.crearAsignacion({
      ...this.nuevaAsignacion,
      montoTotalQ: Number(this.nuevaAsignacion.montoTotalQ),
      notas: this.nuevaAsignacion.notas || undefined,
    }).pipe(finalize(() => {
      this.guardandoAsignacion = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.showAsignacionModal = false; this.cargar(); },
      error: error => { this.mostrarMensaje(error?.error?.mensaje ?? 'No se pudo crear la asignación'); },
    });
  }

  pedirCerrarAsignacion(asignacion: any): void {
    this.accionConfirmacion = {
      title: 'Cerrar asignación',
      message: `¿Cerrar la asignación de Q ${Number(asignacion.montoTotalQ).toFixed(2)} para ${asignacion.menu?.nombre ?? 'este período'}?`,
      confirmText: 'Cerrar asignación',
      variant: 'danger',
      run: () => this.svc.cerrarAsignacion(asignacion.id),
    };
  }

  agregarItem(): void {
    this.plan.items.push({ alimentoId: '', cantidadAComprar: 0, unidad: 'lb', precioUnitarioQ: 0 });
  }

  quitarItem(i: number): void {
    this.plan.items.splice(i, 1);
  }

  totalEstimado(): number {
    return this.plan.items.reduce((s, i) => s + (i.cantidadAComprar * i.precioUnitarioQ), 0);
  }

  guardar(): void {
    this.guardando = true;
    this.svc.crearPlan(this.plan).pipe(
      finalize(() => { this.guardando = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: () => { this.showModal = false; this.cargar(); },
      error: e => { this.mostrarMensaje(e?.error?.mensaje ?? 'No se pudo guardar el plan'); },
    });
  }

  pedirAprobar(plan: any): void {
    this.accionConfirmacion = {
      title: 'Aprobar plan de compra',
      message: `¿Aprobar el plan del ${plan.semanaInicio} al ${plan.semanaFin}?`,
      confirmText: 'Aprobar plan',
      variant: 'success',
      run: () => this.svc.aprobarPlan(plan.id),
    };
  }

  confirmarAccion(): void {
    if (!this.accionConfirmacion || this.procesandoAccion) return;
    const accion = this.accionConfirmacion;
    this.procesandoAccion = true;
    accion.run().pipe(finalize(() => {
      this.procesandoAccion = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.accionConfirmacion = null; this.cargar(); },
      error: error => {
        this.mostrarMensaje(error?.error?.mensaje ?? 'No se pudo completar la acción');
      },
    });
  }

  verPlan(plan: any): void {
    this.planDetalle = plan;
  }

  mostrarMensaje(message: string): void {
    this.mensajeModal = { title: 'No se pudo completar', message };
  }

  estadoClass(e: string): string {
    const m: Record<string, string> = { borrador: 'gray', optimizado: 'blue', aprobado: 'green', ejecutado: 'purple' };
    return m[e] ?? 'gray';
  }

  private asignacionVacia() {
    return { escuelaId: '', menuId: '', montoTotalQ: 0, periodoInicio: '', periodoFin: '', notas: '' };
  }
}