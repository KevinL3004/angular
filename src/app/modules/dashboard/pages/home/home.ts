import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth';
import { ROL_LABELS } from '../../../../core/models/user.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
  get usuario() {
    return this.auth.usuario;
  }
  rolLabel = computed(() => {
    const rol = this.auth.rol();
    return rol ? ROL_LABELS[rol] : '';
  });

  accesos = computed(() => {
    const rol = this.auth.rol();
    const todos = [
      { label: 'Menú oficial', icon: 'restaurant_menu', route: '/menus', modulo: 'menus', color: '#2563eb' },
      { label: 'Inventario', icon: 'inventory_2', route: '/inventario', modulo: 'inventario', color: '#16a34a' },
      { label: 'Plan de compras', icon: 'shopping_cart', route: '/compras', modulo: 'compras', color: '#d97706' },
      { label: 'Liquidaciones', icon: 'receipt_long', route: '/liquidaciones', modulo: 'liquidaciones', color: '#7c3aed' },
      { label: 'Escuelas', icon: 'school', route: '/escuelas', modulo: 'escuelas', color: '#0891b2' },
      { label: 'Usuarios', icon: 'people', route: '/users', modulo: 'users', color: '#be185d' },
    ];
    return todos.filter(a => this.auth.tienePermiso(a.modulo));
  });

  fecha = new Date().toLocaleDateString('es-GT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  constructor(private auth: AuthService) { }

  ngOnInit(): void { }
}