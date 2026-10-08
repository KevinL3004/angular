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
  menuSugerenciaId = '';
  opcionSugerenciaKey = '';
  sugerenciaCompra: any = null;
  calculandoSugerencia = false;

  plan = {
    escuelaId: '', asignacionId: '', semanaInicio: '',
    semanaFin: '', numEstudiantes: 0,
    items: [] as {
      alimentoId: string;
      cantidadAComprar: number;
      unidad: string;
      precioUnitarioQ: number;
      frecuenciaCompra?: string;
      fechaCompraSugerida?: string;
      observacionSugerencia?: string;
      nombreSugerido?: string;
    }[],
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
      items: [],
    };
    this.menuSugerenciaId = '';
    this.opcionSugerenciaKey = '';
    this.sugerenciaCompra = null;
    this.showModal = true;
  }

  get opcionesRacion(): { key: string; codigo: string; grupo: string }[] {
    const menu = this.menus.find(item => item.id === this.menuSugerenciaId);
    const opciones = new Map<string, { key: string; codigo: string; grupo: string }>();
    for (const item of menu?.itemsRacion ?? []) {
      const key = `${item.opcionCodigo}::${item.grupoBeneficiario}`;
      opciones.set(key, { key, codigo: item.opcionCodigo, grupo: item.grupoBeneficiario });
    }
    return [...opciones.values()];
  }

  generarSugerencia(): void {
    const opcion = this.opcionesRacion.find(item => item.key === this.opcionSugerenciaKey);
    if (!opcion || !this.menuSugerenciaId || this.plan.numEstudiantes < 1) return;
    this.calculandoSugerencia = true;
    this.menSvc.sugerirCompra(this.menuSugerenciaId, {
      opcionCodigo: opcion.codigo,
      grupoBeneficiario: opcion.grupo,
      estudiantes: Number(this.plan.numEstudiantes),
    }).pipe(finalize(() => {
      this.calculandoSugerencia = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: response => {
        this.sugerenciaCompra = response.data;
        this.plan.items = (response.data?.items ?? []).map((item: any) => {
          const alimento = this.alimentos.find(catalogo => catalogo.id === item.alimentoId)
            ?? this.alimentos.find(catalogo => this.normalizar(catalogo.nombre) === this.normalizar(item.alimentoNombre));
          const frequency = item.tipoCompra === 'no_perecedero'
            ? 'no_perecedero'
            : item.tipoCompra === 'perecedero'
              ? 'semanal'
              : 'por_definir';
          const precioPorUnidadCompatible = alimento
            && this.normalizar(alimento.unidadInventario ?? '') === this.normalizar(item.unidad);
          return {
            alimentoId: alimento?.id ?? '',
            nombreSugerido: item.alimentoNombre,
            cantidadAComprar: Number(item.cantidadTotal),
            unidad: item.unidad,
            precioUnitarioQ: precioPorUnidadCompatible ? Number(item.precioReferenciaQ) || 0 : 0,
            frecuenciaCompra: frequency,
            fechaCompraSugerida: frequency === 'semanal' ? this.plan.semanaInicio || undefined : undefined,
            observacionSugerencia: [
              item.alertaPrecio,
              !precioPorUnidadCompatible && item.precioReferenciaQ != null
                ? `Precio de catálogo por ${alimento?.unidadInventario ?? 'unidad distinta'}; no se aplicó a ${item.unidad}.`
                : null,
              frequency === 'semanal' ? 'Frecuencia inicial sugerida; confirmar según vida útil y prácticas de la OPF.' : null,
            ].filter(Boolean).join(' '),
          };
        });
        this.cdr.markForCheck();
      },
      error: error => this.mostrarMensaje(error?.error?.mensaje ?? 'No se pudo calcular la sugerencia desde el menú'),
    });
  }

  private normalizar(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
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
    this.plan.items.push({ alimentoId: '', cantidadAComprar: 0, unidad: 'lb', precioUnitarioQ: 0, frecuenciaCompra: 'por_definir' });
  }

  quitarItem(i: number): void {
    this.plan.items.splice(i, 1);
  }

  totalEstimado(): number {
    return this.plan.items.reduce((s, i) => s + (i.cantidadAComprar * (Number(i.precioUnitarioQ) || 0)), 0);
  }

  planValido(): boolean {
    return Boolean(this.plan.semanaInicio && this.plan.semanaFin && this.plan.semanaFin > this.plan.semanaInicio)
      && this.plan.numEstudiantes > 0
      && this.plan.items.length > 0
      && this.plan.items.every(item => Boolean(item.alimentoId && item.unidad.trim()) && Number(item.cantidadAComprar) > 0);
  }

  guardar(): void {
    if (!this.planValido()) {
      this.mostrarMensaje('Completa un rango de fechas válido, estudiantes y al menos un alimento con cantidad y unidad.');
      return;
    }
    if (this.plan.items.some(item => !item.alimentoId)) {
      this.mostrarMensaje('Vincula cada renglón sugerido con un alimento del catálogo o elimina los que no correspondan. El menú original seguirá disponible para consulta.');
      return;
    }
    this.guardando = true;
    const payload = {
      ...this.plan,
      items: this.plan.items.map(({ nombreSugerido, ...item }) => ({
        ...item,
        precioUnitarioQ: Number(item.precioUnitarioQ) > 0 ? Number(item.precioUnitarioQ) : undefined,
        fechaCompraSugerida: item.fechaCompraSugerida || undefined,
        observacionSugerencia: item.observacionSugerencia || undefined,
      })),
    };
    this.svc.crearPlan(payload).pipe(
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

  imprimirPlan(): void {
    window.print();
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