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
  publicar(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/${id}/publicar`, {});
  }
  marcarVigente(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/${id}/vigente`, {});
  }
}