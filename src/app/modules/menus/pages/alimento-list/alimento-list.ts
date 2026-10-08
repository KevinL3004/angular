import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { MenusService } from '../../../../core/services/menus';
import { AuthService } from '../../../../core/services/auth';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';
import { ConfirmModal } from '../../../../shared/components/ui/confirm-modal/confirm-modal';

@Component({
  selector: 'app-alimento-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, PageHeader, Loading, EmptyState, ConfirmModal],
  templateUrl: './alimento-list.html',
  styleUrls: ['./alimento-list.scss'],
})
export class AlimentoList implements OnInit {
  alimentos: any[] = [];
  loading = true;
  error = '';
  filtro = '';
  showModal = false;
  guardando = false;
  mensajeModal: { title: string; message: string } | null = null;
  puedeCrear = false;

  nuevo = {
    nombre: '', grupo: 'cereales', kcalPor100g: 0,
    proteinaG: 0, carbohidratosG: 0, grasasG: 0,
    precioRefQ: null as number | null,
    precioRefFuente: '', precioRefFecha: '', precioRefZona: '',
    tipoCompra: 'por_definir', origenCompra: 'por_definir', diasVidaUtil: null as number | null,
    unidadInventario: 'lb',
  };

  grupos = [
    'leguminosas', 'cereales', 'lacteos', 'carnes',
    'frutas', 'verduras', 'grasas_aceites', 'bebidas', 'otros',
  ];
  readonly tiposCompra = [
    { value: 'por_definir', label: 'Por definir' },
    { value: 'perecedero', label: 'Perecedero' },
    { value: 'no_perecedero', label: 'No perecedero' },
  ];
  readonly origenesCompra = [
    { value: 'por_definir', label: 'Por confirmar' },
    { value: 'agricultura_familiar', label: 'Agricultura familiar' },
    { value: 'procesado', label: 'Procesado' },
  ];

  constructor(
    private svc: MenusService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    const rol = this.auth.rol();
    this.puedeCrear = rol === 'tecnico_mineduc' || rol === 'director';
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.svc.getAlimentos().pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: r => { this.alimentos = r.data ?? []; },
      error: () => { this.error = 'No se pudieron cargar los alimentos'; },
    });
  }

  get alimentosFiltrados() {
    if (!this.filtro) return this.alimentos;
    const q = this.filtro.toLowerCase();
    return this.alimentos.filter(a =>
      a.nombre.toLowerCase().includes(q) ||
      a.grupo.toLowerCase().includes(q)
    );
  }

  guardar(): void {
    if (!this.nuevo.nombre) return;
    this.guardando = true;
    this.svc.crearAlimento(this.nuevo).pipe(
      finalize(() => { this.guardando = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: () => {
        this.showModal = false;
        this.nuevo = {
          nombre: '', grupo: 'cereales', kcalPor100g: 0,
          proteinaG: 0, carbohidratosG: 0, grasasG: 0,
          precioRefQ: null, precioRefFuente: '', precioRefFecha: '', precioRefZona: '',
          tipoCompra: 'por_definir', origenCompra: 'por_definir', diasVidaUtil: null,
          unidadInventario: 'lb',
        };
        this.cargar();
      },
      error: e => { this.mensajeModal = { title: 'No se pudo guardar el alimento', message: e?.error?.mensaje ?? 'Ocurrió un error al guardar el alimento.' }; },
    });
  }
}