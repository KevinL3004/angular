import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth';
import { ROL_LABELS } from '../../../../core/models/user.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './topbar.html',
  styleUrls: ['./topbar.scss'],
})
export class Topbar {
  get usuario() {
    return this.auth.usuario;
  }

  rolLabel = computed(() => {
    const rol = this.auth.rol();
    return rol ? ROL_LABELS[rol] : '';
  });

  constructor(private auth: AuthService) { }

  logout(): void { this.auth.logout(); }
}