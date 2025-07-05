import { Component, EventEmitter, Inject, OnInit, Output, OnChanges } from '@angular/core';
import { AdSpeedService } from '../services/ad-speed.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { BootstrapIconsModule } from 'ng-bootstrap-icons';
import { UserData } from '../guard.guard';
@Component({
  selector: 'app-ad-list',
  templateUrl: './ad-list.component.html',
  styleUrls: ['./ad-list.component.scss']
})
export class AdListComponent implements OnInit {
  allAds: any = []
  @Output() idEvent = new EventEmitter<any>()
  @Output() adId = new EventEmitter<any>()
  eye: any
  totItems: any
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 10;
  userData: any = UserData;
  constructor(
    private adSpeedService: AdSpeedService,
    public dialog: MatDialog,
    private toasterService: ToastrService,
    private location: Location,
    private router: Router,

    // private router : Router
  ) { }
  ngOnInit(): void {
    if (!this.userData.premiumUser) {
      this.router.navigate(['/profile'])
    }
    this.totalItems = 0
    console.log("workin")
    this.getAllAds()
  }
  getAllAds() {
    this.adSpeedService.getAllAds(this.currentPage, this.itemsPerPage).subscribe((data) => {
      console.log((data as any).body, "check reoc")
      this.allAds = (data as any).body.data.results
      this.totalItems = (data as any).body.data.totalRecords
      this.totItems = [...Array(Math.ceil(Number((data as any).body.data.totalRecords) / this.itemsPerPage))].map((el) => el + 1);
      console.log((data as any).body.data.totalRecords, "(data as any).body.data.totalRecords")
    })
  }
  paginateForward() {
    // console.log(this.totItems.length,"this.totItems.length")

    if (this.totItems.length == this.currentPage) {
      return
      // console.log(this.totItems.length-1,"this.totItems.length-1")
    }
    this.currentPage = this.currentPage + 1
    this.getAllAds()
  }
  handleNumClick(val: any) {
    this.currentPage = val
    this.getAllAds()
    console.log(val, "checkvalue")
  }
  paginateBack() {
    if (this.currentPage == 1) {
      return
    }
    this.currentPage = this.currentPage - 1
    this.getAllAds()
  }
  onPageChange(event: any) {
    console.log({ event })
    this.currentPage = event;
    // this.itemsPerPage = event.pageSize;
    this.getAllAds();
  }
  openEditModal(id: any) {
    this.idEvent.emit(id)
    const dialogRef = this.dialog.open(EditModal, {
      width: '550px',
      height: '500px',
      data: id
    })
  }

  getFileSize(size: any) {
    const fileSizeInBytes = size;
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed();
    return fileSizeInMB
  }
  deleteAd(id: any) {
    this.adSpeedService.deleteAd(id).subscribe((res) => {
      let toast = this.toasterService.info((res as any).body.message)
      // this.router.navigateByUrl('/ads-list');
      setTimeout(() => {
        this.toasterService.remove(toast.toastId)
        window.location.reload()
      }, 1000)
      console.log(res, "res")
    })
  }

  openVideo(id: any) {
    this.adId.emit(id)
    const dialogRef = this.dialog.open(AdVideoModalComponent, {
      width: '550px',
      height: '330px',
      data: id
    })
  }
}

@Component({
  selector: 'edit-ad-modal',
  templateUrl: './edit-ad-modal.component.html',
  styleUrls: ['./ad-list.component.scss']
})
export class EditModal implements OnInit {
  ad: any
  weight = [
    { label: '0 (paused)', value: "0" },
    { label: '1', value: "1" },
    { label: '2', value: "2" },
    { label: '3', value: "3" },
    { label: '4', value: "4" },
    { label: '5', value: "5" },
    { label: '6', value: "6" },
    { label: '7', value: "7" },
    { label: '8', value: "8" },
    { label: '9', value: "9" },
    { label: '10 (more often)', value: "10" },
    { label: 'Auto', value: '11' }
  ]
  editAdForm = new FormGroup({
    name: new FormControl(''),
    // height: new FormControl(1080, [Validators.required]),
    // width: new FormControl(1920, [Validators.required]),
    weight: new FormControl("", [Validators.required]),
    skipAd: new FormControl(false),
    skipTime: new FormControl(null, [Validators.required, Validators.min(1)]),
  })
  constructor(
    public dialogRef: MatDialogRef<EditModal>,
    @Inject(MAT_DIALOG_DATA) public idEvent: any,
    private adSpeedService: AdSpeedService,
    private toasterService: ToastrService,
  ) { }
  ngOnInit(): void {
    console.log(this.idEvent, "id event")
    this.getAdData(Number(this.idEvent))
  }
  getAdData(id: any) {
    this.adSpeedService.getAdData(id).subscribe((data) => {
      let adDetail = (data as any).body?.data
      console.log((data as any).body?.data, "check data for single ad")
      this.editAdForm.patchValue({
        name: adDetail.adName,
        skipAd: adDetail.skipAd,
        skipTime: adDetail.skippable,
        weight: adDetail.weight
      })
      // this.editAdForm.value.name = adDetail.name
      // this.editAdForm.value.skipAd = adDetail.skipAd
      // this.editAdForm.value.skipTime = adDetail.skippable
      // this.editAdForm.value.weight = adDetail.weight
      this.ad = (data as any).body?.data
    })
  }


  editAd() {
    Object.values(this.editAdForm.controls).forEach((control: any) => {
      control.markAsDirty();
    });
    if (!this.editAdForm.valid) {
      console.log('adUploadForm is invalid');
      return;
    }
    let editToast = this.toasterService.info('Your video is being edited')
    let payload = this.editAdForm.value
    console.log(this.ad?.adSpeedAdId, "check this.ad")
    let obj = {
      ad: String(this.ad?.adspeedAdId),
      adVideoId: this.ad?.id,
      // clickurl:"",
      // height: String(payload.height),
      name: payload.name == "" ? this.ad?.adName : payload.name,
      weight: this.editAdForm.value.weight != "" ? this.editAdForm.value.weight : '1',
      // width: String(payload.width),
      originalName: this.ad?.adName,
      skipAd: this.editAdForm.value.skipAd,
      skippable: this.editAdForm.value.skipAd == false ? 0 : this.editAdForm.value.skipTime


    }
    console.log(obj, "chek obj sending")
    this.adSpeedService.editAd(obj).subscribe((data) => {
      console.log(data, "check  data")
      this.toasterService.remove(editToast.toastId)
      window.location.reload()
    })


  }


}

@Component({
  selector: 'app-ad-video-modal',
  templateUrl: './ad-video-modal.component.html',
  styleUrls: ['./ad-list.component.scss']
})
export class AdVideoModalComponent implements OnInit {
  ad: any = {}
  // videoUrl:any 
  open: boolean = false
  constructor(
    public dialogRef: MatDialogRef<AdVideoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public adId: any,
    private adSpeedService: AdSpeedService,
  ) { }
  ngOnInit(): void {
    console.log(this.adId, "check ad id")
    this.adSpeedService.getAdData(this.adId).subscribe((res) => {
      console.log((res as any).body?.data, "check res")
      this.ad = (res as any).body?.data
      this.open = true

      // this.videoUrl = (res as any).body?.data?.video.videoUrl 
    })
  }
  // ngOnChanges(){
  //       console.log(this.adId,"check ad id")
  //     this.adSpeedService.getAdData(this.adId).subscribe((res)=>{
  //       console.log((res as any).body?.data,"check res")
  //       this.ad = (res as any).body?.data 
  //       this.open = true
  //       // this.videoUrl = (res as any).body?.data?.video.videoUrl 
  //     })
  // }
}