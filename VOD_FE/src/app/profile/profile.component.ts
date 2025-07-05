import { Component,Output ,EventEmitter, OnInit, Input} from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit{
  @Output() tit = new EventEmitter<any>()
  active = 1;
  constructor(
  ){}

  ngOnInit(): void {
    this.tit.emit("prof")
  }

  changeTab(){
    this.active = 3
  }
}
