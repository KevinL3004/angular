import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { MenusService } from '../../../../core/services/menus';
import { AuthService } from '../../../../core/services/auth';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';
import { ConfirmModal } from '../../../../shared/components/ui/confirm-modal/confirm-modal';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, PageHeader, Loading, EmptyState, ConfirmModal],
  templateUrl: './menu-list.html',
  styleUrls: ['./menu-list.scss'],
})
export class MenuList implements OnInit {
  menus: any[] = [];
  loading = true;
  error = '';
  esTecnico = false;
  showModal = false;
  guardando = false;
  menuDetalle: any = null;
  menuPendiente: any = null;
  accionPendiente: 'publicar' | 'vigente' | null = null;
  actualizandoEstado = false;
  alimentos: any[] = [];
  nuevo = this.menuVacio();
  readonly diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

  constructor(
    private svc: MenusService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.esTecnico = this.auth.rol() === 'tecnico_mineduc';
  }

  ngOnInit(): void {
    this.cargar();
    this.svc.getAlimentos().subscribe({ next: r => { this.alimentos = r.data ?? []; this.cdr.markForCheck(); } });
  }

  cargar(): void {
    this.loading = true;
    this.svc.getAll().pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: r => { this.menus = r.data ?? []; },
      error: () => { this.error = 'No se pudieron cargar los menús'; },
    });
  }

  pedirPublicar(menu: any): void {
    this.menuPendiente = menu;
    this.accionPendiente = 'publicar';
  }

  pedirMarcarVigente(menu: any): void {
    this.menuPendiente = menu;
    this.accionPendiente = 'vigente';
  }

  confirmarEstado(): void {
    if (!this.menuPendiente || !this.accionPendiente || this.actualizandoEstado) return;
    const request = this.accionPendiente === 'publicar'
      ? this.svc.publicar(this.menuPendiente.id)
      : this.svc.marcarVigente(this.menuPendiente.id);
    this.actualizandoEstado = true;
    request.pipe(finalize(() => {
      this.actualizandoEstado = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.menuPendiente = null; this.accionPendiente = null; this.cargar(); },
      error: error => { this.error = error?.error?.mensaje ?? 'No se pudo actualizar el menú'; },
    });
  }

  verDetalle(menu: any): void {
    this.menuDetalle = menu;
  }

  abrirCrear(): void {
    this.nuevo = this.menuVacio();
    this.showModal = true;
  }

  agregarDia(): void {
    this.nuevo.dias.push(this.diaVacio());
  }

  quitarDia(index: number): void {
    this.nuevo.dias.splice(index, 1);
  }

  agregarIngrediente(dia: any): void {
    dia.ingredientes.push({ alimentoId: '', cantidadPorEstudianteG: 0, unidad: 'g' });
  }

  guardar(): void {
    const dias = this.nuevo.dias.map((dia: any) => ({
      ...dia,
      kcalEstimadas: dia.kcalEstimadas ? Number(dia.kcalEstimadas) : undefined,
      ingredientes: dia.ingredientes.filter((item: any) => item.alimentoId && item.cantidadPorEstudianteG > 0)
        .map((item: any) => ({ ...item, cantidadPorEstudianteG: Number(item.cantidadPorEstudianteG) })),
    }));
    this.guardando = true;
    this.svc.crear({ ...this.nuevo, dias }).pipe(
      finalize(() => { this.guardando = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: () => { this.showModal = false; this.cargar(); },
      error: (error) => { this.error = error?.error?.mensaje ?? 'No se pudo crear el menú'; this.cdr.markForCheck(); },
    });
  }

  private menuVacio() {
    return { nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', dias: [] as any[] };
  }

  private diaVacio() {
    return { semanaNumero: 1, dia: 'lunes', descripcionRefaccion: '', kcalEstimadas: null as number | null, ingredientes: [] as any[] };
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      borrador: 'gray',
      publicado: 'blue',
      vigente: 'green',
      vencido: 'red',
    };
    return map[estado] ?? 'gray';
  }
}