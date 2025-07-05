import { Component } from '@angular/core';
import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'VODandLiveStreamFE';
  showFiller = true;
  pageTitle: string = '';
  hideNavigation = false;
  
  constructor(
    private router: Router
  ) {
    console.log(this.hideNavigation,"this.hideNavigation")
    router.events.subscribe(event => {
      if (event instanceof RoutesRecognized) {
        let route = event.state.root.firstChild;
        // console.log(event.state.root,"event.state.root")
        // console.log(route?.data['title'],"check route")
        this.pageTitle = route?.data['title'] || '';
        this.hideNavigation = route?.data['hideNav'] || false;
      }
    });
  }
  

  // isMobile(){
  //   return window.innerWidth <= 768;
  // }
}
