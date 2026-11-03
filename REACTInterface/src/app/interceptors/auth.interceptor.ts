import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Functional Auth Interceptor for Angular 18
 * 1. Attaches Authorization: Bearer <token> ONLY to REACTCLOUD Orchestrator API calls
 *    (avoids corrupting GCS V4 pre-signed upload/download URLs).
 * 2. Passes X-React-Data-Scope ('personal' | 'system') header for Admin scope awareness.
 * 3. Automatically refreshes expired Firebase ID tokens on 401 and retries the request once.
 * 4. Handles 403 blocked-account responses.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const isGcsSignedUrl = req.url.includes('storage.googleapis.com') && req.url.includes('X-Goog-Signature');
  const isOrchestratorApi = !isGcsSignedUrl && (
    req.url.includes('/api/') ||
    req.url.startsWith('http://localhost:8085') ||
    req.url.includes('.run.app')
  );

  let outgoingReq = req;
  if (token && isOrchestratorApi) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'X-React-Data-Scope': authService.activeDataScope()
    };
    outgoingReq = req.clone({ setHeaders: headers });
  }

  return next(outgoingReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (isOrchestratorApi && err.status === 401 && !req.headers.has('X-React-Retry-Auth')) {
        return from(authService.refreshIdToken()).pipe(
          switchMap((freshToken) => {
            if (freshToken && freshToken !== token) {
              const retriedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${freshToken}`,
                  'X-React-Data-Scope': authService.activeDataScope(),
                  'X-React-Retry-Auth': '1'
                }
              });
              return next(retriedReq);
            }
            return throwError(() => err);
          })
        );
      }
      if (isOrchestratorApi && err.status === 403 && err.error?.code === 'ACCOUNT_BLOCKED') {
        authService.refreshSessionProfile();
        router.navigate(['/landing']);
      }
      return throwError(() => err);
    })
  );
};
