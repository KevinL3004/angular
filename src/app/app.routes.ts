import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
    { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

    {
        path: 'auth',
        loadChildren: () =>
            import('./modules/auth/auth-module').then(m => m.AuthModule),
    },

    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./shared/components/layout/main-layout/main-layout')
                .then(m => m.MainLayout),
        children: [
            {
                path: 'dashboard',
                canActivate: [roleGuard],
                data: { modulo: 'dashboard' },
                loadChildren: () =>
                    import('./modules/dashboard/dashboard-module').then(m => m.DashboardModule),
            },
            {
                path: 'users',
                canActivate: [roleGuard],
                data: { modulo: 'users' },
                loadChildren: () =>
                    import('./modules/users/users-module').then(m => m.UsersModule),
            },
            {
                path: 'escuelas',
                canActivate: [roleGuard],
                data: { modulo: 'escuelas' },
                loadChildren: () =>
                    import('./modules/escuelas/escuelas-module').then(m => m.EscuelasModule),
            },
            {
                path: 'menus',
                canActivate: [roleGuard],
                data: { modulo: 'menus' },
                loadChildren: () =>
                    import('./modules/menus/menus-module').then(m => m.MenusModule),
            },
            {
                path: 'inventario',
                canActivate: [roleGuard],
                data: { modulo: 'inventario' },
                loadChildren: () =>
                    import('./modules/inventario/inventario-module').then(m => m.InventarioModule),
            },
            {
                path: 'compras',
                canActivate: [roleGuard],
                data: { modulo: 'compras' },
                loadChildren: () =>
                    import('./modules/compras/compras-module').then(m => m.ComprasModule),
            },
            {
                path: 'liquidaciones',
                canActivate: [roleGuard],
                data: { modulo: 'liquidaciones' },
                loadChildren: () =>
                    import('./modules/liquidaciones/liquidaciones-module').then(m => m.LiquidacionesModule),
            },
        ],
    },

    { path: '**', redirectTo: '/auth/login' },
];