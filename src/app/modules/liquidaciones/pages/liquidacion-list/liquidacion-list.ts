import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { LiquidacionesService } from '../../../../core/services/liquidaciones';
import { ComprasService } from '../../../../core/services/compras';
import { EscuelasService } from '../../../../core/services/escuelas';
import { AuthService } from '../../../../core/services/auth';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';
import { ConfirmModal } from '../../../../shared/components/ui/confirm-modal/confirm-modal';

@Component({
  selector: 'app-liquidacion-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PageHeader, Loading, EmptyState, ConfirmModal],
  templateUrl: './liquidacion-list.html',
  styleUrls: ['./liquidacion-list.scss'],
})
export class LiquidacionList implements OnInit {
  liquidaciones: any[] = [];
  escuelas: any[] = [];
  asignaciones: any[] = [];
  escuelaId = '';
  loading = true;
  error = '';
  showModal = false;
  showObservarModal = false;
  liquidacionDetalle: any = null;
  liquidacionPendiente: any = null;
  accionPendiente: 'enviar' | 'aprobar' | null = null;
  actualizandoEstado = false;
  guardandoObservacion = false;
  mensajeModal: { title: string; message: string } | null = null;
  observandoId = '';
  observaciones = '';
  guardando = false;
  esTecnico = false;
  esDirectora = false;
  puedeGenerar = false;

  nueva = { escuelaId: '', asignacionId: '', observaciones: '' };

  constructor(
    private svc: LiquidacionesService,
    private compSvc: ComprasService,
    private escSvc: EscuelasService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    const rol = this.auth.rol();
    this.esTecnico = rol === 'tecnico_mineduc';
    this.esDirectora = rol === 'director' || rol === 'secretaria_opf';
    this.puedeGenerar = ['tecnico_mineduc', 'director', 'secretaria_opf'].includes(rol ?? '');
  }

  ngOnInit(): void {
    this.escSvc.getAll().subscribe(r => {
      this.escuelas = r.data ?? [];
      if (this.escuelas.length) {
        this.escuelaId = this.escuelas[0].id;
        this.cargar();
      }
      this.cdr.markForCheck();
    });
  }

  cargar(): void {
    if (!this.escuelaId) return;
    this.loading = true;
    this.error = '';

    this.compSvc.getAsignaciones(this.escuelaId).subscribe(r => {
      this.asignaciones = r.data ?? [];
      this.cdr.markForCheck();
    });

    this.svc.getByEscuela(this.escuelaId).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: r => { this.liquidaciones = r.data ?? []; },
      error: () => { },
    });
  }

  abrirModal(): void {
    this.nueva = { escuelaId: this.escuelaId, asignacionId: '', observaciones: '' };
    this.showModal = true;
  }

  generar(): void {
    if (!this.nueva.asignacionId) {
      this.mostrarMensaje('Selecciona una asignación de presupuesto antes de generar la liquidación.');
      return;
    }
    this.guardando = true;
    this.svc.generar(this.nueva).pipe(
      finalize(() => { this.guardando = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: () => { this.showModal = false; this.cargar(); },
      error: e => { this.mostrarMensaje(e?.error?.mensaje ?? 'No se pudo generar la liquidación'); },
    });
  }

  pedirEnvio(liquidacion: any): void {
    this.liquidacionPendiente = liquidacion;
    this.accionPendiente = 'enviar';
  }

  pedirAprobacion(liquidacion: any): void {
    this.liquidacionPendiente = liquidacion;
    this.accionPendiente = 'aprobar';
  }

  confirmarEstado(): void {
    if (!this.liquidacionPendiente || !this.accionPendiente || this.actualizandoEstado) return;
    const request = this.accionPendiente === 'enviar'
      ? this.svc.enviar(this.liquidacionPendiente.id)
      : this.svc.aprobar(this.liquidacionPendiente.id);
    this.actualizandoEstado = true;
    request.pipe(finalize(() => {
      this.actualizandoEstado = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.liquidacionPendiente = null; this.accionPendiente = null; this.cargar(); },
      error: error => { this.error = error?.error?.mensaje ?? 'No se pudo actualizar la liquidación'; },
    });
  }

  verDetalle(liquidacion: any): void {
    this.liquidacionDetalle = liquidacion;
  }

  abrirObservar(id: string): void {
    this.observandoId = id;
    this.observaciones = '';
    this.showObservarModal = true;
  }

  guardarObservacion(): void {
    if (!this.observaciones.trim()) return;
    if (this.guardandoObservacion) return;
    this.guardandoObservacion = true;
    this.svc.observar(this.observandoId, this.observaciones.trim()).pipe(finalize(() => {
      this.guardandoObservacion = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.showObservarModal = false; this.cargar(); },
      error: error => { this.mostrarMensaje(error?.error?.mensaje ?? 'No se pudo observar la liquidación'); },
    });
  }

  mostrarMensaje(message: string): void {
    this.mensajeModal = { title: 'No se pudo completar', message };
  }

  estadoClass(e: string): string {
    const m: Record<string, string> = { borrador: 'gray', enviada: 'blue', aprobada: 'green', observada: 'yellow' };
    return m[e] ?? 'gray';
  }

  pctEjecucion(l: any): number {
    const asig = Number(l.totalAsignadoQ);
    if (!asig) return 0;
    return Math.min(100, Math.round(Number(l.totalGastadoQ) / asig * 100));
  }
}