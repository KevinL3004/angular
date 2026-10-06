export interface ApiResponse<T = any> {
    status: number;
    respuesta: 'success' | 'warning' | 'error';
    mensaje: string;
    data: T;
}