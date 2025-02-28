import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const oidcSecurityService = inject(OidcSecurityService);

  return new Observable<boolean>((observer) => {
    oidcSecurityService.checkAuth().subscribe(({ isAuthenticated }) => {
      if (isAuthenticated) {
        observer.next(true); // Permit access
      } else {
        observer.next(false); // Deny access
      }
    });
  });
};
