import { Component,OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {allIcons} from 'ng-bootstrap-icons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentResolution:any = window.screen.width
  mobileView:boolean = false 
  menu:any  =allIcons.MenuDown 
  cards:any[] =[
    "https://logos-download.com/wp-content/uploads/2022/12/Android_TV_Logo.svg",
    "https://logos-download.com/wp-content/uploads/2022/12/Android_TV_Logo.svg",
    "https://logos-download.com/wp-content/uploads/2022/12/Android_TV_Logo.svg",
    "https://logos-download.com/wp-content/uploads/2022/12/Android_TV_Logo.svg",
    "https://logos-download.com/wp-content/uploads/2022/12/Android_TV_Logo.svg",
    "https://logos-download.com/wp-content/uploads/2022/12/Android_TV_Logo.svg",
    "https://logos-download.com/wp-content/uploads/2022/12/Android_TV_Logo.svg",
    "https://logos-download.com/wp-content/uploads/2022/12/Android_TV_Logo.svg",
    "https://logos-download.com/wp-content/uploads/2022/12/Android_TV_Logo.svg",
  ] 
  partnerCards:any[] = [
    "../../../assets/icons/vertex.svg",
    "../../../assets/icons/vertex.svg",
    "../../../assets/icons/vertex.svg",
    "../../../assets/icons/vertex.svg",
    "../../../assets/icons/vertex.svg",
    "../../../assets/icons/vertex.svg",
    "../../../assets/icons/vertex.svg",
    "../../../assets/icons/vertex.svg",
    "../../../assets/icons/vertex.svg",
  ]
  navOptions:any[] = [
    {name:"Home",status:"active"},
    {name:"Benefit",status:""},
    {name:"Technology",status:""},
    {name:"Partners",status:""},
    {name:"Team",status:""},
    {name:"Blog",status:""},
  ]
  constructor(
    private router: Router,
    ){}
    navigateSignin(){
      console.log("working")
      this.router.navigateByUrl('/signin');
      
    }
    ngOnInit(): void {
      if(this.currentResolution <767){
        this.mobileView = true
      }
    console.log(this.currentResolution,"currentResolution")
    
  }
}
