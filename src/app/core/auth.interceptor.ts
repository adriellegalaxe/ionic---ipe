import { HttpInterceptorFn } from '@angular/common/http';

/**
 * O app funciona 100% local (IndexedDB/localStorage), então não há requisições
 * HTTP para a API. Este interceptor fica aqui como ponto único para quando o
 * backend Flask/MySQL real for religado: basta apontar as chamadas para ele.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => next(req);
