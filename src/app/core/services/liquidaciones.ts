import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class LiquidacionesService {
  private api = `${environment.apiUrl}/liquidaciones`;
  constructor(private http: HttpClient) { }

  getByEscuela(escuelaId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.api}/escuela/${escuelaId}`);
  }
  getById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/${id}`);
  }
  getResumenTecnico(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/tecnico/resumen`);
  }
  generar(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/generar`, data);
  }
  enviar(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/${id}/enviar`, {});
  }
  aprobar(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/${id}/aprobar`, {});
  }
  observar(id: string, observaciones: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/${id}/observar`, { observaciones });
  }
}