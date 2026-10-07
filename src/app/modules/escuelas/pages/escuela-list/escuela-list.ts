import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { EscuelasService } from '../../../../core/services/escuelas';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';
import { AuthService } from '../../../../core/services/auth';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-escuela-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, PageHeader, Loading, EmptyState],
  templateUrl: './escuela-list.html',
  styleUrls: ['./escuela-list.scss'],
})
export class EscuelaList implements OnInit {
  escuelas: any[] = [];
  loading = true;
  error = '';
  esTecnico = false;

  constructor(
    private svc: EscuelasService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.esTecnico = this.auth.rol() === 'tecnico_mineduc';
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.error = '';
    this.loading = true;
    this.svc.getAll().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
    ).subscribe({
      next: r => { this.escuelas = r.data ?? []; },
      error: () => { this.error = 'No se pudieron cargar las escuelas'; },
    });
  }

  desactivar(id: string): void {
    if (!confirm('¿Desactivar esta escuela?')) return;
    this.svc.desactivar(id).subscribe({ next: () => this.cargar() });
  }
}