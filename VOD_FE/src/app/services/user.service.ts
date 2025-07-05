import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvironmentInjector, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { SpinnerService } from 'src/shared/services/spinner.service';
// import { } from '../../assets/icons/user-profile.svg'
@Injectable({
  providedIn: 'root'
})
export class UserService {
  helper = new JwtHelperService();

  constructor(
    private http: HttpClient,
    private spinnerService: SpinnerService
  ) { }

  signIn(payload: any) {

    this.spinnerService.setLoading(true);
    return this.http.post(environment.apiUrl + '/authenticate/login', payload
    , {
      observe: 'response', withCredentials: true, headers:
        new HttpHeaders(
          {
            "Content-Type": "application/json"
          })
    }
    );
  }

  signUp(payload: any) {
    this.spinnerService.setLoading(true);
    payload = { ...payload, profile_image: '../../assets/icons/user-profile.svg' }
    console.log(payload, "check payload")
    return this.http.post(environment.apiUrl + '/authenticate/signup', payload, {
      observe: 'response', withCredentials: true, headers:
        new HttpHeaders(
          {
            "Content-Type": "application/json"
          })
    });
  }


  emailVerify(payload: any) {
    this.spinnerService.setLoading(true);

    return this.http.post(environment.apiUrl + '/authenticate/verifyEmail', payload, {
      observe: 'response', withCredentials: true, headers:
        new HttpHeaders(
          {
            "Content-Type": "application/json"
          })
    });
  }

  updateEmail(payload: any) {
    this.spinnerService.setLoading(true);

    return this.http.post(environment.apiUrl + '/users/update', payload, {
      observe: 'response', withCredentials: true, headers:
        new HttpHeaders(
          {
            "Content-Type": "application/json"
          })
    });
  }

  imagesUpdate(payload: any) {
    this.spinnerService.setLoading(true);

    return this.http.post(environment.apiUrl + '/users/images', payload, { observe: 'response', withCredentials: true });
  }

  getTokenData() {
    let token = localStorage.getItem('access_token');
    if (token) {
      const tokenDec = this.helper.decodeToken(token);
      console.log(tokenDec, "tokenDec")
      return tokenDec;
    }

    // this.router.navigateByUrl('/email');
    return false
  }

  resetPass(payload: any) {
    this.spinnerService.setLoading(true);

    return this.http.post(environment.apiUrl + '/users/reset', payload, {
      observe: 'response', withCredentials: true, headers:
        new HttpHeaders(
          {
            "Content-Type": "application/json"
          })
    });
  }
  forgotPass(payload: any) {
    let obj = {
      email: payload
    }
    this.spinnerService.setLoading(true);

    return this.http.post(environment.apiUrl + '/users/forgot', obj, {
      observe: 'response', withCredentials: true, headers:
        new HttpHeaders(
          {
            "Content-Type": "application/json"
          })
    });
  }

  getCurrentSubscription() {
    this.spinnerService.setLoading(true);
    return this.http.get(environment.apiUrl + '/users/active-plan', {
      observe: 'response', withCredentials: true, headers:
        new HttpHeaders(
          {
            "Content-Type": "application/json"
          })
    });
  }

  getAllPayments(page?: any, limit?: any) {
    this.spinnerService.setLoading(true);
    let url = environment.apiUrl + `/users/user-payments?page=${page}&limit=${limit}`
    // if (search) {
    //     url = url + `&title=${search}`
    // }
    return this.http.get(url, {
      observe: 'response', withCredentials: true, headers:
        new HttpHeaders(
          {
            "Content-Type": "application/json"
          })
    });
  }

  updateToken(){
    this.spinnerService.setLoading(true);
    let url = environment.apiUrl + `/users/update-user`
    return this.http.get(url, {
      observe: 'response', withCredentials: true, headers:
        new HttpHeaders(
          {
            "Content-Type": "application/json"
          })
    });
  }

}
