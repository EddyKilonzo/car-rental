import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

function parseJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return this.router.parseUrl('/login');
    }
    const payload = parseJwt(token);
    const allowedRoles = route.data['roles'] as string[];
    if (payload && allowedRoles && allowedRoles.includes(payload.role)) {
      return true;
    } else {
      return this.router.parseUrl('/unauthorized');
    }
  }
} 