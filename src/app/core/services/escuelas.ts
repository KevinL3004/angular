import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class EscuelasService {
  private api = `${environment.apiUrl}/escuelas`;
  constructor(private http: HttpClient) { }

  getAll(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.api);
  }
  getById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/${id}`);
  }
  crear(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.api, data);
  }
  actualizar(id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/${id}`, data);
  }
  desactivar(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.api}/${id}`);
  }
}