import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { MenusService } from '../../../../core/services/menus';
import { EscuelasService } from '../../../../core/services/escuelas';
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
  escuelas: any[] = [];
  showDocumentoModal = false;
  subiendoDocumento = false;
  archivoDocumento: File | null = null;
  menuDistribucion: any = null;
  distribuyendo = false;
  escuelasSeleccionadas: string[] = [];
  menuRaciones: any = null;
  guardandoRaciones = false;
  raciones: any[] = [];
  opcionCodigo = '';
  grupoBeneficiarioSugerencia = '';
  estudiantesSugerencia = 1;
  sugerencia: any = null;
  cargandoSugerencia = false;
  documento = { nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', nivelEducativo: '', departamento: '', grupoBeneficiario: '', numeroEntrega: '', diasCobertura: null as number | null, montoDiarioAlumnoQ: null as number | null };
  nuevo = this.menuVacio();
  readonly diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

  constructor(
    private svc: MenusService,
    private escuelasService: EscuelasService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.esTecnico = this.auth.rol() === 'tecnico_mineduc';
  }

  ngOnInit(): void {
    this.cargar();
    this.svc.getAlimentos().subscribe({ next: r => { this.alimentos = r.data ?? []; this.cdr.markForCheck(); } });
    if (this.esTecnico) this.escuelasService.getAll().subscribe({ next: r => { this.escuelas = r.data ?? []; this.cdr.markForCheck(); } });
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

  abrirCargaDocumento(): void {
    this.documento = { nombre: '', descripcion: '', fechaInicio: '', fechaFin: '', nivelEducativo: '', departamento: '', grupoBeneficiario: '', numeroEntrega: '', diasCobertura: null, montoDiarioAlumnoQ: null };
    this.archivoDocumento = null;
    this.showDocumentoModal = true;
  }

  seleccionarDocumento(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoDocumento = input.files?.[0] ?? null;
    if (this.archivoDocumento && !this.documento.nombre) this.documento.nombre = this.archivoDocumento.name.replace(/\.pdf$/i, '');
  }

  subirDocumento(): void {
    if (!this.archivoDocumento) return;
    const form = new FormData();
    form.append('documento', this.archivoDocumento);
    Object.entries(this.documento).forEach(([key, value]) => {
      if (value !== null && value !== '') form.append(key, String(value));
    });
    this.subiendoDocumento = true;
    this.svc.subirDocumento(form).pipe(finalize(() => {
      this.subiendoDocumento = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.showDocumentoModal = false; this.cargar(); },
      error: error => { this.error = error?.error?.mensaje ?? 'No se pudo cargar el PDF'; this.cdr.markForCheck(); },
    });
  }

  abrirDistribucion(menu: any): void {
    this.menuDistribucion = menu;
    this.escuelasSeleccionadas = (menu.distribuciones ?? []).map((item: any) => item.escuela?.id).filter(Boolean);
  }

  alternarEscuela(escuelaId: string, checked: boolean): void {
    if (checked && !this.escuelasSeleccionadas.includes(escuelaId)) this.escuelasSeleccionadas = [...this.escuelasSeleccionadas, escuelaId];
    if (!checked) this.escuelasSeleccionadas = this.escuelasSeleccionadas.filter(id => id !== escuelaId);
  }

  guardarDistribucion(): void {
    if (!this.menuDistribucion || !this.escuelasSeleccionadas.length) return;
    this.distribuyendo = true;
    this.svc.distribuir(this.menuDistribucion.id, this.escuelasSeleccionadas).pipe(finalize(() => {
      this.distribuyendo = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.menuDistribucion = null; this.cargar(); },
      error: error => { this.error = error?.error?.mensaje ?? 'No se pudo distribuir el menú'; this.cdr.markForCheck(); },
    });
  }

  descargarDocumento(menu: any): void {
    this.svc.descargarDocumento(menu.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = menu.documentoNombre || `${menu.nombre}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.error = 'No se pudo descargar el documento'; this.cdr.markForCheck(); },
    });
  }

  abrirRaciones(menu: any): void {
    this.menuRaciones = menu;
    this.raciones = (menu.itemsRacion ?? []).map((item: any) => ({ ...item }));
    this.opcionCodigo = '';
    this.grupoBeneficiarioSugerencia = '';
    this.estudiantesSugerencia = 1;
    this.sugerencia = null;
  }

  agregarRacion(): void {
    this.raciones.push({
      opcionCodigo: 'A',
      grupoBeneficiario: this.menuRaciones?.grupoBeneficiario || '',
      alimentoNombre: '',
      presentacion: '',
      cantidad: 1,
      unidad: 'unidad',
      origenCompra: 'por_definir',
      grupoNutriente: '',
      alimentoId: '',
    });
  }

  quitarRacion(index: number): void {
    this.raciones.splice(index, 1);
  }

  guardarRaciones(): void {
    if (!this.menuRaciones) return;
    this.guardandoRaciones = true;
    const items = this.raciones.map(item => ({
      ...item,
      cantidad: Number(item.cantidad),
      alimentoId: item.alimentoId || undefined,
      grupoNutriente: item.grupoNutriente || undefined,
    }));
    this.svc.guardarOpcionesRacion(this.menuRaciones.id, items).pipe(finalize(() => {
      this.guardandoRaciones = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => { this.menuRaciones = null; this.cargar(); },
      error: error => { this.error = error?.error?.mensaje ?? 'No se pudieron guardar los renglones oficiales'; this.cdr.markForCheck(); },
    });
  }

  solicitarSugerencia(): void {
    if (!this.menuRaciones || !this.opcionCodigo || !this.grupoBeneficiarioSugerencia || this.estudiantesSugerencia < 1) return;
    this.cargandoSugerencia = true;
    this.svc.sugerirCompra(this.menuRaciones.id, {
      opcionCodigo: this.opcionCodigo,
      grupoBeneficiario: this.grupoBeneficiarioSugerencia,
      estudiantes: Number(this.estudiantesSugerencia),
    }).pipe(finalize(() => {
      this.cargandoSugerencia = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: response => { this.sugerencia = response.data; },
      error: error => { this.error = error?.error?.mensaje ?? 'No se pudo calcular la sugerencia'; this.cdr.markForCheck(); },
    });
  }

  get opcionesRacion(): { codigo: string; grupo: string }[] {
    const unique = new Map<string, { codigo: string; grupo: string }>();
    for (const item of this.menuRaciones?.itemsRacion ?? []) {
      const key = `${item.opcionCodigo}|${item.grupoBeneficiario}`;
      unique.set(key, { codigo: item.opcionCodigo, grupo: item.grupoBeneficiario });
    }
    return [...unique.values()];
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