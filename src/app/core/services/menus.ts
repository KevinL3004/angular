import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class MenusService {
  private api = `${environment.apiUrl}/menus`;
  constructor(private http: HttpClient) { }

  getAlimentos(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.api}/alimentos`);
  }
  crearAlimento(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/alimentos`, data);
  }
  getAll(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.api);
  }
  getVigente(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/vigente`);
  }
  getById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/${id}`);
  }
  crear(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.api, data);
  }
  subirDocumento(data: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/documentos`, data);
  }
  distribuir(id: string, escuelaIds: string[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/${id}/distribuciones`, { escuelaIds });
  }
  guardarOpcionesRacion(id: string, items: any[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/${id}/opciones-racion`, { items });
  }
  sugerirCompra(id: string, data: { opcionCodigo: string; grupoBeneficiario: string; estudiantes: number }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/${id}/sugerencia-compra`, data);
  }
  descargarDocumento(id: string): Observable<Blob> {
    return this.http.get(`${this.api}/${id}/documento`, { responseType: 'blob' });
  }
  publicar(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/${id}/publicar`, {});
  }
  marcarVigente(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/${id}/vigente`, {});
  }
}