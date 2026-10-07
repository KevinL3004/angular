import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { UsersService } from '../../../../core/services/users';
import { Usuario, ROL_LABELS } from '../../../../core/models/user.model';
import { PageHeader } from '../../../../shared/components/ui/page-header/page-header';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { EmptyState } from '../../../../shared/components/ui/empty-state/empty-state';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, PageHeader, Loading, EmptyState],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList implements OnInit {
  usuarios: Usuario[] = [];
  loading = true;
  error = '';
  readonly rolLabels = ROL_LABELS;

  constructor(
    private readonly usersService: UsersService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    this.usersService.getAll().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
    ).subscribe({
      next: response => {
        this.usuarios = response.data ?? [];
      },
      error: () => {
        this.error = 'No se pudieron cargar los usuarios';
      },
    });
  }
}
