import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-emailconfirm',
  templateUrl: './emailconfirm.component.html',
  styleUrls: ['./emailconfirm.component.scss']
})
export class EmailconfirmComponent implements OnInit {
  code: string | undefined;
  inputCount = 0
  finalInput = ""
  confirming = false
  constructor(
    private userService: UserService, 
    private router: Router,
    private toasterService: ToastrService
    ) { }

  ngOnInit(): void {
    const input = document.querySelectorAll(".input");
    const inputField  = document.querySelector(".inputfield") as any; 
    window.addEventListener("keyup", (e) => {
      if (this.inputCount > 3) {
        // submitButton.classList.remove("hide");
        // submitButton.classList.add("show");
        if (e.key == "Backspace") {
          this.finalInput = this.finalInput.substring(0, this.finalInput.length - 1);
          this.updateInputConfig(inputField.lastElementChild, false);
          inputField.lastElementChild.value = "";
          this.inputCount -= 1;
          // submitButton.classList.add("hide");
        }
      }
    });
    const startInput = () => {
      this.inputCount = 0;
      this.finalInput = "";
      input.forEach((element:any) => {
        element.value = "";
      });
      this.updateInputConfig(inputField.firstElementChild, false);
    };
    
    window.onload = startInput() as any;
  }

  submit(){
    console.log(this.finalInput,"check finalInput")
    // if (!this.code)
    //   return;
    if(this.finalInput.length<4){
      return
    }
    if(this.confirming){
      return
    }
    let info = this.toasterService.info("Please wait ...")
    this.confirming = true
    this.userService.emailVerify({verificationCode: this.finalInput}).subscribe(result => {
      setTimeout(()=>{
        this.toasterService.remove(info.toastId)
      },2500)
      console.log('user logged-in', result);
      this.router.navigateByUrl('/dashboard');
    },
    (err)=>{
      this.confirming = false
    this.toasterService.remove(info.toastId)
      console.log(err,"check err")
    }
    );
  }
   updateInputConfig(element:any, disabledStatus:any){
    element.disabled = disabledStatus;
    if (!disabledStatus) {
      element.focus();
    } else {
      element.blur();
    }
  };
  inputFunc(e:any){
    e.target.value = e.target.value.replace(/[^0-9]/g, "")
    let { value } = e.target;

    if (value.length == 1) {
      this.updateInputConfig(e.target, true);
      if (this.inputCount <= 3 && e.key != "Backspace") {
        this.finalInput += value;
        if (this.inputCount < 3) {
          this.updateInputConfig(e.target.nextElementSibling, false);
        }
      }
      this.inputCount += 1;
      return
    } else if (value.length == 0 && e.key == "Backspace") {
      this.finalInput = this.finalInput.substring(0, this.finalInput.length - 1);
      if (this.inputCount == 0) {
        this.updateInputConfig(e.target, false);
        return false;
      }
      this.updateInputConfig(e.target, true);
      e.target.previousElementSibling.value = "";
      this.updateInputConfig(e.target.previousElementSibling, false);
      this.inputCount -= 1;
      return
    } else if (value.length > 1) {
      e.target.value = value.split("")[0];
      return
    }
    return
    // submitButton.classList.add("hide");
  
  }
}
