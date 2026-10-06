export type RolUsuario =
    | 'tecnico_mineduc'
    | 'director'
    | 'docente_encargado'
    | 'secretaria_opf'
    | 'supervisor';

export interface Usuario {
    id: string;
    username: string;
    nombreCompleto: string;
    correo?: string;
    rol: RolUsuario;
    activo: boolean;
    ultimoAcceso?: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    usuario: Usuario;
}

export const ROL_LABELS: Record<RolUsuario, string> = {
    tecnico_mineduc: 'Técnico MINEDUC',
    director: 'Director',
    docente_encargado: 'Docente Encargado',
    secretaria_opf: 'Secretaria OPF',
    supervisor: 'Supervisor',
};

export const ROL_PERMISOS: Record<RolUsuario, string[]> = {
    tecnico_mineduc: ['dashboard', 'users', 'escuelas', 'menus', 'inventario', 'compras', 'liquidaciones', 'proveedores'],
    director: ['dashboard', 'users', 'menus', 'inventario', 'compras', 'liquidaciones', 'proveedores'],
    docente_encargado: ['dashboard', 'menus', 'inventario'],
    secretaria_opf: ['dashboard', 'menus', 'inventario', 'compras', 'liquidaciones', 'proveedores'],
    supervisor: ['dashboard', 'menus', 'inventario', 'compras', 'liquidaciones'],
};