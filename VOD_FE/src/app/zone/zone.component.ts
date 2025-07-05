import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ZoneService } from '../services/zone.service';

@Component({
  selector: 'app-zone',
  templateUrl: './zone.component.html',
  styleUrls: ['./zone.component.scss']
})
export class ZoneComponent implements OnInit {
  zoneForm = new FormGroup({
    zoneName: new FormControl('',[Validators.required]),
    description:new FormControl(''),
    secondaryZone:new FormControl(''),
    type:new FormControl('',[Validators.required])
  })

  constructor(
    private zoneService:ZoneService
  ){}
  ngOnInit(): void {

  }
  createZone(){
    Object.values(this.zoneForm.controls).forEach((control: any) => {
      control.markAsDirty();
  });
  if (!this.zoneForm.valid) {
      console.log('zoneForm is invalid');
      return;
  }

  console.log(this.zoneForm.value,"check zone form")
  this.zoneService.createZone(this.zoneForm.value).subscribe((res)=>{
    console.log(res,"check res")
  })
  }
}
