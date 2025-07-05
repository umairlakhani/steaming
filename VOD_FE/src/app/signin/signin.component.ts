import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit {
  isPasswordVisible:boolean = false
  auth = new FormGroup({
    email: new FormControl('', [Validators.email, Validators.required]),
    password: new FormControl('', [Validators.required]),
  });
  remember:boolean = false
  constructor(private userService: UserService, private router: Router) { }
  ngOnInit(): void {
    let userLoggedIn = localStorage.getItem('access_token')
    if(userLoggedIn){
      this.router.navigate(['/profile'])
    }
    const rememberedCredentials = this.getCookie('credentials');
    if (rememberedCredentials) {
      this.remember = true;
      const { email, password } = JSON.parse(rememberedCredentials);
      console.log(email,"check email")
      console.log(password,"check password")
      this.auth.setValue({email:email,password:password})
    }
  }
  signIn(){
    if (!this.auth.valid)
      return;
    if(this.remember){
    const credentials = JSON.stringify({email:this.auth.value.email,password:this.auth.value.password})
      this.setCookie('credentials',credentials,30)
  }else{
    console.log("deletecookie")
      document.cookie = "credentials=credentials; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    this.userService.signIn(this.auth.value).subscribe(result => {
      console.log('user logged-in', result);
      this.router.navigateByUrl('/dashboard');
    });
  }
  getCookie(name:any) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return (parts as any).pop().split(';').shift();
  }
  setCookie(name:any, value:any, days:any) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  }
  rememberMe(e:any){
    console.log(e.target.checked,"check remember");
    this.remember = e.target.checked
  }

  toggleVisibility(){
    this.isPasswordVisible = !this.isPasswordVisible
  }
}
