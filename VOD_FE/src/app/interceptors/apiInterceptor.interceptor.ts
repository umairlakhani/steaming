import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Router} from '@angular/router';

import {catchError, finalize, map, throwError} from 'rxjs';
import {SpinnerService} from "../../shared/services/spinner.service";
import {ToastrService} from "ngx-toastr";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private router: Router,
        private spinnerService: SpinnerService,
        private toastService: ToastrService
    ) {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): any {
        // this.spinnerService.setLoading(true);
        req = req.clone({
            withCredentials: true
        });

        let token = localStorage.getItem('access_token');
        if (token) {
            req = req.clone({headers: req.headers.append('Authorization', `bearer ${token}`)});
        }

        return next
            .handle(req)
            .pipe(
                map((event: any) => {
                    if (event instanceof HttpResponse) {
                        if (event.body.access_token) {
                            console.log(event.body.access_token,'event.body.access_token')
                            localStorage.setItem('access_token', event.body.access_token);
                        }
                    }
                    return event;
                }),
                finalize(() => this.spinnerService.setLoading(false)),
                catchError((error) => {

                    // Catch "401 Unauthorized" responses
                    if (error instanceof HttpErrorResponse && error.status === 401) {
                        this.spinnerService.setLoading(false);
                        // Sign out
                        // this._authService.signOut();
                        localStorage.clear();

                        // Reload the app
                        setTimeout(()=>{
                            location.reload();
                        },1500)
                    }
                    this.handleErrorResponse(error);
                    return throwError(error);
                })
            );
    }

    handleErrorResponse(error: HttpErrorResponse) {
        console.log('handleErrorResponse: ', {error})
        let message: string;
        let title: string;
        switch (error.status) {
            case 401:
                message = error?.error?.message ?? 'Token Expired! Please login again';
                title = 'Unauthenticated';
                break;
            case 400:
                message =
                    error?.error?.message ??
                    'Please verify form fields are correct, if issue persists please contact System Administrator';
                title = 'Bad Request';
                break;
            case 403:
                message =
                    error?.error?.message ??
                    'You don\'\t have permission to access this resource';
                title = 'Forbidden';
                // this.route.navigateByUrl('/error/unauthorized')
                break;
            case 404:
                message = error?.error?.message ?? 'Requested resource not found.';
                title = 'Resource Not Found';
                // window.location.href = '/error/404'
                // this.route.navigateByUrl('/error/404')
                break;
            case 408:
                message = error?.error?.message ?? 'Requested resource timed out.';
                title = 'Request Timeout';
                break;
            case 500:
                message =
                    error?.error?.message ??
                    'Something went wrong, Please try again later.';
                title = 'Internal Server Error';
                // this.route.navigateByUrl('/error/500')
                break;
            default:
                message =
                    error?.error?.message ??
                    'Please try again later, If issue persists please contact System Administrator';
                title = 'General Processing Error';
                break;
        }
        const toast = this.toastService.error(message, title);
        setTimeout(()=>{
            this.toastService.remove(toast.toastId)
        },2000)
        return throwError(error);
    }

}
