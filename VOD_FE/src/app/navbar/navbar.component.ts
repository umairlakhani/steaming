import { Component, Input, OnInit } from '@angular/core';
import {Router} from "@angular/router";
import { UserData } from 'src/app/guard.guard';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  userData: any = this.userService.getTokenData();
  @Input() title: string = 'Test';
  @Input() drawer: any;

  constructor(private router: Router, private userService: UserService) { }

  ngOnInit(): void {
    console.log(this.userData.profileImage,"userData")
    console.log(this.title,"title")
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
