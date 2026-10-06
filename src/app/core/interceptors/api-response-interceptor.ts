import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse) {
        // El backend ya devuelve el formato { status, respuesta, mensaje, data }
        // Solo pasamos la respuesta tal cual
        return event;
      }
      return event;
    })
  );
};