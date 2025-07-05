import { Component } from '@angular/core';
import { VideoService } from '../services/video.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
emailVal!: string;
emailForm = new FormGroup({
  email:new FormControl('',[Validators.required,Validators.email])
}) 
  constructor(
    private videoService:VideoService,
    private userService:UserService,
    private router:Router,
    
  ){}
  forgotPass(){
    Object.values(this.emailForm.controls).forEach((control: any) => {
      control.markAsDirty();
    });

    if(!this.emailForm.valid) return
    console.log(this.emailVal,"check email value")
    this.userService.forgotPass(this.emailVal).subscribe((res)=>{
      console.log(res,"res")
    this.router.navigate(['/signin'])

    })
  }
  emailValue(e:any){
    this.emailVal = e.target.value
    // console.log(e.target.value,"value")
  }
}
