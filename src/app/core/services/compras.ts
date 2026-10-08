import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private api = `${environment.apiUrl}/compras`;
  constructor(private http: HttpClient) { }

  // Asignaciones
  getAsignaciones(escuelaId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.api}/asignaciones/${escuelaId}`);
  }
  getAsignacionActiva(escuelaId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/asignaciones/${escuelaId}/activa`);
  }
  crearAsignacion(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/asignaciones`, data);
  }
  cerrarAsignacion(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/asignaciones/${id}/cerrar`, {});
  }

  // Proveedores
  getProveedores(escuelaId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.api}/proveedores/${escuelaId}`);
  }
  crearProveedor(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/proveedores`, data);
  }
  toggleProveedor(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/proveedores/${id}/toggle`, {});
  }

  // Planes
  getPlanes(escuelaId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.api}/planes/${escuelaId}`);
  }
  getPlan(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/planes/detalle/${id}`);
  }
  crearPlan(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/planes`, data);
  }
  aprobarPlan(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/planes/${id}/aprobar`, {});
  }

  // Compras realizadas
  getCompras(escuelaId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.api}/realizadas/${escuelaId}`);
  }
  registrarCompra(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/realizadas`, data);
  }
  subirFactura(compraId: string, factura: File): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('factura', factura);
    return this.http.post<ApiResponse<any>>(`${this.api}/realizadas/${compraId}/factura`, formData);
  }
  descargarFactura(compraId: string): Observable<Blob> {
    return this.http.get(`${this.api}/realizadas/${compraId}/factura`, { responseType: 'blob' });
  }
  getConciliacion(compraId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/realizadas/${compraId}/conciliacion`);
  }
  verificarCompra(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/realizadas/${id}/verificar`, {});
  }
  rechazarCompra(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/realizadas/${id}/rechazar`, {});
  }

  // Resumen presupuestario
  getResumen(escuelaId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/resumen/${escuelaId}`);
  }
}