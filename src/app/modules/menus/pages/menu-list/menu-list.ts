import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { MenusService } from '../../../../core/services/menus';
import { AuthService } from '../../../../core/services/auth';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, PageHeader, Loading, EmptyState],
  templateUrl: './menu-list.html',
  styleUrls: ['./menu-list.scss'],
})
export class MenuList implements OnInit {
  menus: any[] = [];
  loading = true;
  error = '';
  esTecnico = false;

  constructor(
    private svc: MenusService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.esTecnico = this.auth.rol() === 'tecnico_mineduc';
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.svc.getAll().pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: r => { this.menus = r.data ?? []; },
      error: () => { this.error = 'No se pudieron cargar los menús'; },
    });
  }

  publicar(id: string): void {
    this.svc.publicar(id).subscribe({ next: () => this.cargar() });
  }

  marcarVigente(id: string): void {
    this.svc.marcarVigente(id).subscribe({ next: () => this.cargar() });
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