import { Component, OnInit } from '@angular/core';
// import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SubscriptionPlanService } from '../services/plan.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { SpinnerService } from 'src/shared/services/spinner.service';

@Component({
  selector: 'app-subscription-plans',
  templateUrl: './subscription-plans.component.html',
  styleUrls: ['./subscription-plans.component.scss']
})
export class SubscriptionPlansComponent implements OnInit {
  plan = {
    name: '',
    price: null,
    storage:null,
    bandwidth:'',
    type:'monthly',
    disc:null
  };
  planId:any
  allPlans:any[] = []
  allFeatures:any = [
  ]
  constructor(
    private subscriptionPlanService: SubscriptionPlanService,
    private toasterService:ToastrService,
    private route:ActivatedRoute,
    private router:Router,
    private spinnerService: SpinnerService
  ){}
  ngOnInit(): void {
    this.subscriptionPlanService.getAllSubscriptionPlans().subscribe((res)=>{
      console.log((res as any).data,"check res")
      this.allPlans =  (res as any).data
    })
    this.route.params.subscribe((param:any)=>{
      console.log(param['id'],"param['id']")
      if(param['id']!=undefined){
        this.planId = param['id']
        this.subscriptionPlanService.getSubscriptionPlan(param['id']).subscribe((res)=>{
          console.log(res,"check res")
        })
      }
    })
  }

  navigateToEdit(planId:any){
      // this.router.navigate([`/subscription-plans/${planId}`])
      this.router.navigateByUrl(`/subscription-plans/${planId}`);
  
    }

  createSubscriptionplan(){
    if(this.plan.bandwidth == null ||
      this.plan.name == "" ||
      this.plan.price == "" ||
      this.plan.storage == null
      ){
        return 
      }
      
      if(this.plan.type == 'yearly' && this.plan.disc == null){
        return
      }
      
      let creatingToast = this.toasterService.info("Please wait ...")

      let check  = this.allFeatures.filter((el:any)=>el.key == "" || el.value == "")
      if(check.length>0){
        return
      }
    console.log(this.plan,"check plan")
    console.log(this.allFeatures,"check fields value")
    let tempFeatures = this.allFeatures.map((el:any)=>{
      return {
        key:el.key,
        value:el.value
      }
    })
    tempFeatures = [...tempFeatures, {storage:this.plan.storage},{bandwidth:this.plan.bandwidth}]
    let strigifyFeatures = JSON.stringify(tempFeatures)
    let objToSend = {
      name:this.plan.name,
      price:this.plan.price,
      storage:this.plan.storage,
      bandwidth:this.plan.bandwidth,
      features:strigifyFeatures,
      type:this.plan.type,
      disc:this.plan.disc
    }
    console.log(objToSend,"check obj to send")
    this.subscriptionPlanService.createSubscriptionPlan(objToSend).subscribe((res)=>{
    this.toasterService.remove(creatingToast.toastId)
      let toast = this.toasterService.info("Plan created successfully")

      setTimeout(()=>{
        this.toasterService.remove(toast.toastId)
        this.router.navigate(['/profile'])
      },1000)
      console.log(res,"check response")
    })
  }
  addFeature(){
    let obj = {
      index:this.allFeatures.length,
      label:'',
      key:'',
      value:""
    }
    this.allFeatures.push(obj)
  }
  setFeatureValue(target:any,index:any) {
    console.log(target.value,"cehck value")
    // console.log(value,"check feature value")
    console.log(index,"check index")
    this.allFeatures[index].value  = target.value;
  }
  setFeatureKey(target:any,index:any) {
    console.log(target.value,"cehck value")

    // console.log(value,"check feature key")
    this.allFeatures[index].key  = target.value;
  }
}
