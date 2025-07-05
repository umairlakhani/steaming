import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { SpinnerService } from "src/shared/services/spinner.service";
import { environment } from 'src/environments/environment';
import { Observable } from "rxjs";
import { PaymentIntent } from "@stripe/stripe-js";

@Injectable({
    providedIn: 'root'
})
export class SubscriptionPlanService {
    constructor(
        private http: HttpClient,
        private spinnerService: SpinnerService,
    ) { }
    createSubscriptionPlan(payload: any) {
        this.spinnerService.setLoading(true)
        return this.http.post(environment.apiUrl + `/subscriptionPlan/create/`, payload, {
            observe: 'response',
            withCredentials: true
        })

    }
    cancelSubscription(){
        this.spinnerService.setLoading(true)
        return this.http.delete(environment.apiUrl + `/subscriptions/cancel-subscription`, {
            observe: 'response',
            withCredentials: true
        })
    }

    getAllSubscriptionPlans() {
        this.spinnerService.setLoading(true)
        return this.http.get(environment.apiUrl + `/subscriptionPlan/getAll/`)
    }

    getSubscriptionPlan(id: any) {
        this.spinnerService.setLoading(true)
        return this.http.get(environment.apiUrl + `/subscriptionPlan/get/${id}`)
    }

    verifySubscriptionPlan(id:any) {
        // this.spinnerService.setLoading(true)
        return this.http.get(environment.apiUrl + `/subscriptions/verify-subscription/${id}`)
    }
    createPaymentIntent(payload: number): Observable<PaymentIntent> {
        return this.http.post<PaymentIntent>(
            `${environment.apiUrl}/subscriptions/create-payment-intent`,
            payload
        );
    }

}