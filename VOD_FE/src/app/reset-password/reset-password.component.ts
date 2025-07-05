import { Component,OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { FormControl, FormGroup, Validators,AbstractControl, ValidatorFn } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  isPasswordVisible:boolean = false
  isPasswordVisible2:boolean = false
  token!:string;
  email!:string;
  password!:string;
  confirmPassword!:string;
  samePassword:boolean = true;
  credentials = new FormGroup({
    password: new FormControl('',[(c:AbstractControl)=>Validators.required(c),Validators.pattern( /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,}/)]),
    confirmPassword:new FormControl('', [Validators.required]),
  },
  { validators: this.passwordMatchValidator() }
  )
  disabledButton:boolean = false
  constructor(
    private activatedRoute: ActivatedRoute,
    private router:Router,
    private userService:UserService
  ){
    router.routerState.root.queryParams.subscribe(
      params => {
        this.token = params['token']
        this.email = params['email']
        // console.log('queryParams', params['token'])
      });
  }
  ngOnInit() {
    
    console.log(this.token,"token")
    console.log(this.token.length,"check length of token")
    if(this.token == undefined || 
      this.email == undefined ||
      this.token.length<4    ||
      this.token.length>4 
      ){
      this.router.navigate(['/login']);
    }
  //   this.activatedRoute.params.subscribe(params => {
  //     console.log(params);
  // });
  // this.router.routerState.root.queryParams.subscribe(
  //   params => console.log('queryParams', params['st']));

}
passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  };
}
handleConfirmPassChange(e:any){
  this.confirmPassword = e.target.value;
}
handlePassChange(e:any){
  this.password = e.target.value;
}
resetPass(){
  let obj = {
    token:this.token,
    email:this.email,
    password:this.password,
    confirmPassword:this.confirmPassword
  }
  console.log(obj,"resetobj")
  Object.values(this.credentials.controls).forEach((control: any) => {
    control.markAsDirty();
  });
  if(!this.credentials.valid) return
  if(this.token.length<4){
    return
  }
  this.userService.resetPass(obj).subscribe((res)=>{
    console.log(res,"res")
    this.router.navigate(['/login'])
  })
}
toggleVisibility(){
  this.isPasswordVisible = !this.isPasswordVisible
}
toggleVisibility2(){
  this.isPasswordVisible2 = !this.isPasswordVisible2
}
}
