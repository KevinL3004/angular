import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { InventarioService } from '../../../../core/services/inventario';
import { EscuelasService } from '../../../../core/services/escuelas';
import { AuthService } from '../../../../core/services/auth';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';
import { ConfirmModal } from '../../../../shared/components/ui/confirm-modal/confirm-modal';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-inventario-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PageHeader, Loading, EmptyState, ConfirmModal],
  templateUrl: './inventario-list.html',
  styleUrls: ['./inventario-list.scss'],
})
export class InventarioList implements OnInit {
  inventario: any[] = [];
  escuelas: any[] = [];
  escuelaId = '';
  filtro = '';
  loading = false;
  showModal = false;
  showStockModal = false;
  stockItem: any = null;
  nuevoStockMinimo = 0;
  guardandoMovimiento = false;
  guardandoStock = false;
  mensajeModal: { title: string; message: string } | null = null;
  puedeMover = false;
  mov = { tipo: 'ingreso', cantidad: 0, motivo: '', alimentoId: '', escuelaId: '' };

  constructor(
    private svc: InventarioService,
    private escSvc: EscuelasService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.puedeMover = ['tecnico_mineduc', 'director', 'docente_encargado'].includes(this.auth.rol() ?? '');
    this.escSvc.getAll().subscribe({
      next: r => {
        this.escuelas = r.data ?? [];
        if (this.escuelas.length) {
          this.escuelaId = this.escuelas[0].id;
          this.cdr.markForCheck();
          this.cargar();
        } else {
          this.cdr.markForCheck();
        }
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  cargar(): void {
    if (!this.escuelaId) return;
    this.loading = true;
    this.svc.getByEscuela(this.escuelaId).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
    ).subscribe({
      next: r => { this.inventario = r.data ?? []; },
      error: () => undefined,
    });
  }

  get inventarioFiltrado() {
    if (!this.filtro) return this.inventario;
    const q = this.filtro.toLowerCase();
    return this.inventario.filter(i =>
      i.alimento?.nombre?.toLowerCase().includes(q)
    );
  }

  nivelClass(item: any): string {
    const r = Number(item.existenciaActual) / (Number(item.stockMinimo) || 1);
    if (Number(item.existenciaActual) === 0) return 'red';
    if (r <= 0.5) return 'red';
    if (r <= 1) return 'yellow';
    return 'green';
  }

  nivelLabel(item: any): string {
    const r = Number(item.existenciaActual) / (Number(item.stockMinimo) || 1);
    if (Number(item.existenciaActual) === 0) return 'Agotado';
    if (r <= 0.5) return 'Crítico';
    if (r <= 1) return 'Bajo';
    return 'Normal';
  }

  pct(item: any): number {
    const min = Number(item.stockMinimo);
    if (!min) return 100;
    return Math.min(100, Math.round(Number(item.existenciaActual) / min * 100));
  }

  abrirModal(item: any): void {
    this.mov = { tipo: 'ingreso', cantidad: 0, motivo: '', alimentoId: item.alimento.id, escuelaId: this.escuelaId };
    this.showModal = true;
  }

  guardarMov(): void {
    if (this.guardandoMovimiento) return;
    this.guardandoMovimiento = true;
    this.svc.registrarMovimiento(this.mov).pipe(finalize(() => {
      this.guardandoMovimiento = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.showModal = false;
        this.cdr.markForCheck();
        this.cargar();
      },
      error: (e) => {
        this.mostrarMensaje(e?.error?.mensaje ?? 'No se pudo registrar el movimiento');
        this.cdr.markForCheck();
      },
    });
  }

  abrirStockMinimo(item: any): void {
    this.stockItem = item;
    this.nuevoStockMinimo = Number(item.stockMinimo);
    this.showStockModal = true;
  }

  guardarStockMinimo(): void {
    if (!this.stockItem || this.nuevoStockMinimo < 0 || this.guardandoStock) return;
    this.guardandoStock = true;
    this.svc.actualizarStockMinimo({
      escuelaId: this.escuelaId,
      alimentoId: this.stockItem.alimento.id,
      stockMinimo: Number(this.nuevoStockMinimo),
    }).pipe(finalize(() => {
      this.guardandoStock = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.showStockModal = false; this.cargar(); },
      error: error => { this.mostrarMensaje(error?.error?.mensaje ?? 'No se pudo actualizar el stock mínimo'); },
    });
  }

  mostrarMensaje(message: string): void {
    this.mensajeModal = { title: 'No se pudo completar', message };
  }
}