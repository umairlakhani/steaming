import { Location } from '@angular/common';
import { Component, Input, OnInit,HostListener } from '@angular/core';
import { Router,NavigationEnd, RoutesRecognized   } from '@angular/router';
import { UserData } from '../guard.guard';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {
  @Input() drawer: any;
  dashboard!:boolean
  // Hide:boolean = false;
  // userData: any = UserData;
  userData: any = this.userService.getTokenData();
  

  constructor(
    private router:Router,
    private location :Location,
    private userService: UserService,

    ) { 
    router.events.subscribe(event => {
      if (event instanceof RoutesRecognized) {
        console.log(event.url.includes('dashboard'),"check event url in side nav comp")
        if(event.url.includes('dashboard')){
          console.log("check routing")
          this.dashboard = true
        }else{
          console.log("dashboard false")
          this.dashboard = false

        }
      }
      // if (event instanceof NavigationEnd) {
      //   const currentUrl = event.url;
      //   const previousUrl = event.urlAfterRedirects;
      //   console.log('Current URL:', currentUrl);
      //   console.log('Previous URL:', previousUrl);
      // }
    })
    
  }

  ngOnInit(): void {
    console.log(this.userData,"check user data in side nav")
    // this.userData.premiumUser = true
    if(window.location.href.includes('/dashboard')) {
      this.dashboard = true
    }
   if(!window.location.href.includes('/public')){

   }
  //  console.log(window.location.href.includes('dashboard'),"check dashboard")
  //  console.log(this.router.url.includes('dashboard'),"check dashboard")
  // console.log(this.userData,"check user after update")
  
}
  check():boolean {
    if(window.location.href.includes('/public')){
      // this.Hide = true
      return false
    }else{
      // this.Hide = false
      return true
    }
  }


  closeDrawer(drawer: any) {
    if (window.innerWidth < 700){
      drawer.toggle();
    }
  }
  @HostListener('window:unload', ['$event'])
  ngOnDestroy() {
    this.dashboard = false
    console.log("component destroyed")
  }
}
