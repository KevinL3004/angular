import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private api = `${environment.apiUrl}/inventario`;
  constructor(private http: HttpClient) { }

  getByEscuela(escuelaId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.api}/${escuelaId}`);
  }
  getAlertas(escuelaId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.api}/${escuelaId}/alertas`);
  }
  getMovimientos(escuelaId: string, alimentoId?: string): Observable<ApiResponse<any[]>> {
    const params = alimentoId ? `?alimentoId=${alimentoId}` : '';
    return this.http.get<ApiResponse<any[]>>(`${this.api}/${escuelaId}/movimientos${params}`);
  }
  registrarMovimiento(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/movimiento`, data);
  }
  actualizarStockMinimo(data: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/stock-minimo`, data);
  }
}