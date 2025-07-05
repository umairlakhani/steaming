import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SubscriptionPlanService } from 'src/app/services/plan.service';
import { VideoService } from 'src/app/services/video.service';

@Component({
  selector: 'app-profile-package',
  templateUrl: './profile-package.component.html',
  styleUrls: ['./profile-package.component.scss'],
})
export class ProfilePackageComponent implements OnInit {
  cards: any = []
  priceList: Array<{ id: string, title: string, subTitle: string, price: number, currency: string, content: Array<{ id: string, text: string, iconUrl: string }>, btnName: string }>;
  content: any = [
    {
      id: '1',
      text: 'In non sem duis porttitor.',
      iconUrl: 'http://www.w3.org/2000/svg'
    },
    {
      id: '2',
      text: 'Justo amet justo integer',
      iconUrl: 'http://www.w3.org/2000/svg'
    },
    {
      id: '3',
      text: 'Nulla est sed scelerisque',
      iconUrl: 'http://www.w3.org/2000/svg'
    },
    {
      id: '4',
      text: 'Hac fermentum pretium',
      iconUrl: 'http://www.w3.org/2000/svg'
    },
    {
      id: '5',
      text: 'Nunc massa sem',
      iconUrl: 'http://www.w3.org/2000/svg'
    },
    {
      id: '6',
      text: 'Aliquam nec consectetur',
      iconUrl: 'http://www.w3.org/2000/svg'
    },
    {
      id: '7',
      text: 'Consectetur amet',
      iconUrl: 'http://www.w3.org/2000/svg'
    },
    {
      id: '8',
      text: 'Urna sed massa',
      iconUrl: 'http://www.w3.org/2000/svg'
    },
    {
      id: '9',
      text: 'Commodo feugiat duis',
      iconUrl: 'http://www.w3.org/2000/svg'
    },
    {
      id: '10',
      text: 'Risus ridiculus faucibus',
      iconUrl: 'http://www.w3.org/2000/svg'
    }
  ]
  monthlyCards:any = []
  yearlyCards:any = []
  monthly:boolean = false
  constructor(
    private subscriptionPlanService: SubscriptionPlanService,
    private router: Router,
    private toasterService: ToastrService,
    public dialog: MatDialog,
    // public dialogRef: MatDialogRef<VideoDeleteComponent>,
  ) {
    this.priceList = [
      {
        id: '1',
        title: 'Basic',
        subTitle: 'Risus ridiculus faucibus',
        price: 89,
        currency: '$',
        content: [
          {
            id: '1',
            text: 'In non sem duis porttitor.',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '2',
            text: 'Justo amet justo integer',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '3',
            text: 'Nulla est sed scelerisque',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '4',
            text: 'Hac fermentum pretium',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '5',
            text: 'Nunc massa sem',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '6',
            text: 'Aliquam nec consectetur',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '7',
            text: 'Consectetur amet',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '8',
            text: 'Urna sed massa',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '9',
            text: 'Commodo feugiat duis',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '10',
            text: 'Risus ridiculus faucibus',
            iconUrl: 'http://www.w3.org/2000/svg'
          }
        ],
        btnName: 'Choose Plan'
      },
      {
        id: '2',
        title: 'Professional',
        subTitle: 'Quam est felis tincidunt cursus',
        price: 120,
        currency: '$',
        content: [
          {
            id: '1',
            text: 'In non sem duis porttitor.',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '2',
            text: 'Justo amet justo integer',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '3',
            text: 'Nulla est sed scelerisque',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '4',
            text: 'Hac fermentum pretium',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '5',
            text: 'Nunc massa sem',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '6',
            text: 'Aliquam nec consectetur',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '7',
            text: 'Consectetur amet',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '8',
            text: 'Urna sed massa',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '9',
            text: 'Commodo feugiat duis',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '10',
            text: 'Risus ridiculus faucibus',
            iconUrl: 'http://www.w3.org/2000/svg'
          }
        ],
        btnName: 'Choose Plan'
      },
      {
        id: '3',
        title: 'Business',
        subTitle: 'Amet sed id duis nisi malesuada',
        price: 150,
        currency: '$',
        content: [
          {
            id: '1',
            text: 'In non sem duis porttitor.',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '2',
            text: 'Justo amet justo integer',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '3',
            text: 'Nulla est sed scelerisque',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '4',
            text: 'Hac fermentum pretium',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '5',
            text: 'Nunc massa sem',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '6',
            text: 'Aliquam nec consectetur',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '7',
            text: 'Consectetur amet',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '8',
            text: 'Urna sed massa',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '9',
            text: 'Commodo feugiat duis',
            iconUrl: 'http://www.w3.org/2000/svg'
          },
          {
            id: '10',
            text: 'Risus ridiculus faucibus',
            iconUrl: 'http://www.w3.org/2000/svg'
          }
        ],
        btnName: 'Choose Plan'
      },
    ]
  }
  ngOnInit() {
    this.subscriptionPlanService.getAllSubscriptionPlans().subscribe((res) => {
      // let features = JSON.parse((res as any).data.features)
      console.log((res as any).data,"(res as any).data")
      let monthlyFilteredCards = (res as any).data.filter((crd: any) => 
      (crd.name == 'Basic' && crd.type == 'monthly') || 
      (crd.name == 'Professional' && crd.type == 'monthly') || 
      (crd.name == 'Business' && crd.type == 'monthly'))

      let yearlyFilteredCards = (res as any).data.filter((crd: any) => 
      (crd.name == 'Basic' && crd.type == 'yearly') || 
      (crd.name == 'Professional' && crd.type == 'yearly') || 
      (crd.name == 'Business' && crd.type == 'yearly'))
      this.cards = monthlyFilteredCards
      this.monthlyCards = monthlyFilteredCards
      this.yearlyCards = yearlyFilteredCards
      // console.log(res, "check response")
    })
  }

  getDiscountedPrice(card:any){
    let discount = card.price * (card.discount/100)
    return `${card.price - discount}`
  }
  handleSwitch(e:any){
    console.log(e.target.checked,"check swwitch")
    this.monthly = e.target.checked
  }
  navigate(id: any) {
    console.log(id, "check plan id")
    this.subscriptionPlanService.verifySubscriptionPlan(id).subscribe((res) => {
      console.log((res as any).data,"(res as any).data")
      if (!(res as any).data.active) {
        if ((res as any).data.extraStorage == null) {
          this.router.navigate([`/stripe-checkout/${id}`])
        } else {
          console.log((res as any).data.extraStorage, "(res as any).data.extraStorage")
          // this.extraStorage.emit(id)

          const DialogRef = this.dialog.open(VideoDeleteComponent, {
            width: '550px',
            height: '80vh',
            data: Number((res as any).data.extraStorage)
          })
        }
      } else {
        let toast = this.toasterService.info("You've already bought the subscription")
        setTimeout(() => {
          this.toasterService.remove(toast.toastId)
        }, 2000)
      }
      // console.log(res,"check res")
    })

  }
}
@Component({
  selector: 'video-delete',
  templateUrl: './video-delete.html',
  styleUrls: ['./profile-package.component.scss']
})
export class VideoDeleteComponent implements OnInit {
  videos = []
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  process = false
  constructor(
    private videoService: VideoService,
    @Inject(MAT_DIALOG_DATA) public extraStorage: any,
  ) { }
  ngOnInit() {
    console.log(this.extraStorage, "extraStorage")
    this.videoService.ownedListArchived(this.currentPage.toString(), this.itemsPerPage.toString())
      .subscribe((res: any) => {
        console.log(res.body.data, "check total records")
        this.videos = res.body.data.results;
        this.totalItems = res.body.data.totalRecords;
      });
    console.log("modal open")
  }

  deleteVideo(id: string, size: number) {
    if(this.process){
      return
    }
    let matDialogContainer = document.getElementsByClassName("mat-dialog-container")
    matDialogContainer[0]?.classList.add('load')
    this.process = true
    console.log(id, "check videoId")
    let sizeInMbs = (size / 1048576).toFixed(2)
    this.videoService.removeVideo({
      id: id,
      deleted: true
    }).subscribe((result: any) => {
      if (result.status == 200) {
        this.extraStorage = this.extraStorage - Number(sizeInMbs)
        let index = this.videos.findIndex((vid) => vid['id'] == id)
        if (index != -1) {
          this.videos.splice(index, 1)
          matDialogContainer[0]?.classList.remove('load')
          this.process = false
        }
      }
      console.log(result, "check result")
      // this.getData();
    });
  }
}
