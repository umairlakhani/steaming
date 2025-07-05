import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { JwtHelperService } from '@auth0/angular-jwt';

export let UserData = {};

@Injectable({
  providedIn: 'root'
})
export class GuardGuard implements CanActivate {
  helper = new JwtHelperService();

  constructor(private cookieService : CookieService, private router: Router){}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    let token = localStorage.getItem('access_token');
    
    if (token){
      const tokenDec = this.helper.decodeToken(token);
      console.log(tokenDec,"tokenDec")
      localStorage.setItem("userId",tokenDec.userId)
      tokenDec.userBirthDate = new Date(tokenDec.userBirthDate).toDateString();

      if (!tokenDec.emailVerify){
        this.router.navigateByUrl('/email');
        return false
      }
      
      UserData = tokenDec;
      return true;
    }
  
    this.router.navigateByUrl('/signin');
    return false;
  }

  
}
