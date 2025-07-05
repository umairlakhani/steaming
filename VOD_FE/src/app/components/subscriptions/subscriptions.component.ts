import { Component, OnInit, Output,EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionPlanService } from 'src/app/services/plan.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss']
})
export class SubscriptionsComponent implements OnInit {
  date = new Date().toLocaleDateString();
  totItems: any
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 10;
  search: any = ''
  activeSubscriptionData: any = null
  payments = []
  plans = []
  @Output() tabValue = new EventEmitter<any>()
  constructor(
    private userService: UserService,
    private router: Router,
    private planService:SubscriptionPlanService

  ) { }
  ngOnInit() {
    this.userService.getCurrentSubscription().subscribe((res) => {
      console.log((res as any).body.data, "check response")
      this.activeSubscriptionData = (res as any).body.data
     this.getPaymentsData()
    })
    
  }

  getPaymentsData(){
    this.userService.getAllPayments(this.currentPage, this.itemsPerPage).subscribe((resp) => {
      console.log((resp as any).body.data.results,"check payment resp")
      this.totItems = [...Array(Math.ceil(Number((resp as any).body.data.totalRecords) / this.itemsPerPage))].map((el) => el + 1);
      this.totalItems = (resp as any).body.data.totalRecords
      this.payments = (resp as any).body.data.results; 
      this.planService.getAllSubscriptionPlans().subscribe((res)=>{
        // console.log(res,"check subscriptionPlans")
        let planData = (res as any).data.filter((crd:any)=>crd.name != 'Basic' && crd.name != 'Professional' && crd.name != 'Business')
        console.log(planData,"check plan data")
        // this.plans = (res as any).data
        this.plans = planData
      })
    })
  }
  getDiscountedPrice(card:any){
    let discount = card.price * (card.discount/100)
    return `${card.price - discount}`
  }
  onPageChange(e:any){
    console.log(e,"check e")
    this.currentPage = e

  }
  handleNumClick(val:any){
    this.currentPage = val
    this.getPaymentsData()
    console.log(val,"checkvalue")
  }
  paginateForward(){
    if(this.totItems.length == this.currentPage){
      return
    }
    this.currentPage = this.currentPage + 1
    this.getPaymentsData()
  }
  paginateBack(){
    if(this.currentPage == 1){
      return
    }
    this.currentPage = this.currentPage - 1
    this.getPaymentsData()
  }

  toDate(date: any) {
    let time = Number(date)
    return new Date(time).toDateString()
  }
  timeStampToDate(date:any){
    console.log(date,"date")
    console.log(new Date(date).toLocaleTimeString(),"date")
    return `${new Date(date).toLocaleDateString()} | ${new Date(date).toLocaleTimeString()}`
  }
  cancelSubscription() {
    this.planService.cancelSubscription().subscribe((res:any)=>{
      if(res.status ==200){
        this.router.navigate(['/dashboard'])
      }
      console.log(res,"check cancel subscription")
    })
  }
  upgradeSubscription(plan: any) {
    // window.location.href = `/subscription/payment/${plan._id}?upgrade=${plan.name}`

    this.router.navigate([`/stripe-checkout/${plan.id}`],{queryParams:{upgrade:`${plan.name}`}})
  }
  buySubscription() {
    this.tabValue.emit()
    // this.router.navigate([`/profile`],{queryParams:{tab:'3'}})
  }
  checkPlans(){
    this.tabValue.emit()

  }
}
