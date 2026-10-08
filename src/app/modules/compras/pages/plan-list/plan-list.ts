import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { ComprasService } from '../../../../core/services/compras';
import { EscuelasService } from '../../../../core/services/escuelas';
import { MenusService } from '../../../../core/services/menus';
import { AuthService } from '../../../../core/services/auth';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, PageHeader, Loading, EmptyState],
  templateUrl: './plan-list.html',
  styleUrls: ['./plan-list.scss'],
})
export class PlanList implements OnInit {
  planes: any[] = [];
  escuelas: any[] = [];
  alimentos: any[] = [];
  asignacion: any = null;
  escuelaId = '';
  loading = true;
  showModal = false;
  guardando = false;
  resumen: any = null;

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
  }

  cargar(): void {
    if (!this.escuelaId) return;
    this.loading = true;

    this.svc.getAsignacionActiva(this.escuelaId).subscribe(r => {
      this.asignacion = r.data;
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
    if (!this.asignacion) { alert('No hay asignación activa para esta escuela'); return; }
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
      error: (e) => { alert(e?.error?.mensaje ?? 'Error al guardar'); },
    });
  }

  aprobar(id: string): void {
    this.svc.aprobarPlan(id).subscribe({ next: () => this.cargar() });
  }

  estadoClass(e: string): string {
    const m: Record<string, string> = { borrador: 'gray', optimizado: 'blue', aprobado: 'green', ejecutado: 'purple' };
    return m[e] ?? 'gray';
  }
}