import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  isPasswordVisible:boolean = false
  isPasswordVisible2:boolean = false
  invalidDate:boolean = false
  samePassword:boolean = true
  user = new FormGroup({
    name: new FormControl('', [Validators.required]),
    surname: new FormControl('', [Validators.required]),
    dateOfBirth: new FormControl('', [Validators.required
      // ,this.futureDateValidator()
    ]),
    email: new FormControl('', [Validators.email, Validators.required]),
    password: new FormControl('', [(c:AbstractControl)=>Validators.required(c),Validators.pattern( /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,}/)]),
    repeatPassword: new FormControl('', [Validators.required]),
    checkbox: new FormControl('', [Validators.requiredTrue])
  }, 
  { validators: this.passwordMatchValidator() }
  );
  userSigningUp  = false

  constructor(
    private userService: UserService, 
    private router: Router,
    private toasterService: ToastrService
    ) { }

  ngOnInit(): void {
    this.invalidDate = false
  }

  checkDate(dateOfBirth:any){
    console.log(dateOfBirth.value,"dateOfBirth")
    const selectedDate = new Date(dateOfBirth.value)
    const currentDate: Date = new Date();
  
    console.log(selectedDate,"selectedDate")
    console.log(currentDate,"currentDate")
console.log(selectedDate > currentDate,"selectedDate > currentDate")
    if (selectedDate > currentDate) {
      this.invalidDate = true
      return true
    }else{
      return false;
    }
  }
  signUp(){
    console.log(this.user.controls,"check user controls")
    Object.values(this.user.controls).forEach((control: any) => {
      control.markAsDirty();
    });
    let check = this.checkDate(this.user.controls.dateOfBirth)
    console.log(check,"check")
    if(check){
      return
    }

    if (!this.user.valid)
      return;

    let payload = this.user.value;

    delete payload.checkbox;
    if(this.userSigningUp){
      return
    }
    this.userSigningUp = true
    let info = this.toasterService.info("Your account is being created ...")
    this.userService.signUp(payload).subscribe((result) => {
      console.log('user logged-in', result);
      this.toasterService.remove(info.toastId)
      this.router.navigateByUrl('/profile');
    },(error)=>{
      this.userSigningUp = false
      console.log(error,"check error")
      if(error){
      this.toasterService.remove(info.toastId)
      }
    }

    );
  }
   passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const password = control.get('password')?.value;
      const repeatPassword = control.get('repeatPassword')?.value;
  
      if (password !== repeatPassword) {
        return { passwordMismatch: true };
      }
  
      return null;
    };
  }
   futureDateValidator():any {
     (control: AbstractControl): { [key: string]: any } | null |boolean => {
      const selectedDate: Date = new Date(control.value);
      const currentDate: Date = new Date();
  
      if (selectedDate > currentDate) {
        this.invalidDate = true
        return true
        // return { futureDate: true };
      }
      return false;
    };
  }
  toggleVisibility(){
    this.isPasswordVisible = !this.isPasswordVisible
  }
  toggleVisibility2(){
    this.isPasswordVisible2 = !this.isPasswordVisible2
  }

  navigateToTermsAndCondition(){
    this.router.navigate(['/home'])
  }

}
