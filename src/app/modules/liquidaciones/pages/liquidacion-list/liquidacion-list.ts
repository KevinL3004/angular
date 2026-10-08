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

@Component({
  selector: 'app-liquidacion-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PageHeader, Loading, EmptyState],
  templateUrl: './liquidacion-list.html',
  styleUrls: ['./liquidacion-list.scss'],
})
export class LiquidacionList implements OnInit {
  liquidaciones: any[] = [];
  escuelas: any[] = [];
  asignaciones: any[] = [];
  escuelaId = '';
  loading = true;
  showModal = false;
  guardando = false;
  esTecnico = false;
  esDirectora = false;

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
    if (!this.nueva.asignacionId) { alert('Selecciona una asignación'); return; }
    this.guardando = true;
    this.svc.generar(this.nueva).pipe(
      finalize(() => { this.guardando = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: () => { this.showModal = false; this.cargar(); },
      error: (e) => { alert(e?.error?.mensaje ?? 'Error al generar'); },
    });
  }

  enviar(id: string): void {
    this.svc.enviar(id).subscribe({ next: () => this.cargar() });
  }

  aprobar(id: string): void {
    this.svc.aprobar(id).subscribe({ next: () => this.cargar() });
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