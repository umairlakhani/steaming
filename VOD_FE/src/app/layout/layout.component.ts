import { Component, Input, OnInit, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, AfterViewInit {
  title = 'VODandLiveStreamFE';
  showFiller = true;
  pageTitle: string = '';
  hideNavigation = false;
  @Input() tit: any

  @ViewChild('drawer') drawer!: MatDrawer;

  constructor(private router: Router) {
    router.events.subscribe(event => {
      if (event instanceof RoutesRecognized) {
        let route = event.state.root.firstChild;
        this.pageTitle = route?.firstChild?.data['title'] || ''
        this.hideNavigation = route?.data['hideNav'] || false;
      }
    });
  }

  ngOnInit(): void {
    // ... your existing code ...
  }

  ngAfterViewInit() {
    this.updateDrawer();
  }

  @HostListener('window:resize', [])
  onResize() {
    console.log('onResize');
    this.updateDrawer();
  }

  updateDrawer() {
    console.log('updateDrawer');
    if (!this.drawer) return;
    if (window.innerWidth < 768) {
      this.drawer.close();
    } else {
      this.drawer.open();
    }
  }

  isMobile() {
    return window.innerWidth < 768;
  }
}