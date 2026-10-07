import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  modulo: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Panel de inicio', icon: 'dashboard', route: '/dashboard', modulo: 'dashboard' },
  { label: 'Menú oficial', icon: 'restaurant_menu', route: '/menus', modulo: 'menus' },
  { label: 'Inventario', icon: 'inventory_2', route: '/inventario', modulo: 'inventario' },
  { label: 'Plan de compras', icon: 'shopping_cart', route: '/compras', modulo: 'compras' },
  { label: 'Liquidaciones', icon: 'receipt_long', route: '/liquidaciones', modulo: 'liquidaciones' },
  { label: 'Escuelas', icon: 'school', route: '/escuelas', modulo: 'escuelas' },
  { label: 'Usuarios', icon: 'people', route: '/users', modulo: 'users' },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class Sidebar {
  navItems = computed(() =>
    NAV_ITEMS.filter(item => this.auth.tienePermiso(item.modulo))
  );

  get usuario() {
    return this.auth.usuario;
  }

  constructor(private auth: AuthService) { }
}