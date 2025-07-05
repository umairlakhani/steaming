import { Component, OnInit, ViewChild } from '@angular/core';
import { StripeCardComponent, StripeCardNumberComponent, StripePaymentElementComponent, StripeService } from 'ngx-stripe';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { PaymentIntent, StripeCardElementOptions, StripeElementsOptions } from '@stripe/stripe-js';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SubscriptionPlanService } from '../services/plan.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from 'src/shared/services/spinner.service';
import { UserData } from '../guard.guard';
@Component({
  selector: 'app-stripe-form',
  templateUrl: './stripe-form.component.html',
  styleUrls: ['./stripe-form.component.scss']
})
export class StripeFormComponent implements OnInit {

  @ViewChild(StripeCardNumberComponent)
  card!: StripeCardNumberComponent;
  subscriptionPlanId: any
  subscriptionPlan: any
  userData: any = this.userService.getTokenData();
  UserData: any = UserData;

  cardOptions: StripeCardElementOptions = {
    style: {
      base: {
        iconColor: '#666EE8',
        color: '#31325F',
        fontWeight: '300',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '18px',
        '::placeholder': {
          color: '#CFD7E0',
        },
      },
    },
  };
  clientSecret: any
  disabled: any = false;

  elementsOptions: StripeElementsOptions = {
    locale: 'es',
  };

  stripeTest!: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private stripeService: StripeService,
    private planService: SubscriptionPlanService,
    private route: ActivatedRoute,
    private userService: UserService,
    private toastService: ToastrService,
    private router: Router,
    private spinnerService: SpinnerService


  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      console.log(this.userData, "userData")
      this.subscriptionPlanId = params['id']
      this.planService.getSubscriptionPlan(params['id']).subscribe((res) => {
        this.subscriptionPlan = (res as any).data
        this.route.queryParams.subscribe((queryParam: any) => {
          if (!queryParam.upgrade) {
            console.log("!queryParam.upgrade")
            this.planService.createPaymentIntent((res as any).data).subscribe((resp) => {
              console.log((resp as any), "(res as any).data")
              this.clientSecret = resp
            })
          } else {
            console.log('queryParam.upgrade')
            let dataa = { ...(res as any).data, upgrade: queryParam.upgrade }
            this.planService.createPaymentIntent(dataa).subscribe((resp) => {
              console.log((resp as any), "(res as any).data")
              this.clientSecret = resp
            })
          }
        })
      })
    })
    this.stripeTest = this.fb.group({
      // name: ['Angular v10', [Validators.required]],
      // amount: [1001, [Validators.required, Validators.pattern(/d+/)]],
    });
  }
  pay(): void {
    this.disabled = true
    this.spinnerService.setLoading(true)
    this.stripeService.confirmCardPayment(this.clientSecret, {
      payment_method: {
        card: this.card.element,
        billing_details: {
          address: {
            city: this.userData.invoice_address == !"" ? this.userData.invoice_address : "House no xyz"
          },
          name: this.userData.userName,
          email: this.userData.userEmail
        }
      }
    }).subscribe((res) => {
      if (res.paymentIntent?.status == 'succeeded') {
        let toast = this.toastService.info("Payment Successfull")
        // this.UserData.premiumUser = true
        this.userService.updateToken().pipe(
          catchError((error) => {
            console.error('Error updating token:', error);
            return throwError(error);
          })
        )
        .subscribe((res: any) => {
          console.log(res.body.access_token, "check res")
          localStorage.removeItem('access_token')
          localStorage.setItem('access_token', res.body.access_token);
          this.toastService.remove(toast.toastId)
          this.router.navigate(['/dashboard'])
        })

      } else {
        let toast = this.toastService.error("Something went wrong ...")
        this.spinnerService.setLoading(false)


        setTimeout(() => {
          this.toastService.remove(toast.toastId)
          this.router.navigate(['/profile'])
        }, 2000)
      }
    })
  }


}