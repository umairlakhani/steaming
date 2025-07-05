import { Component,OnInit } from '@angular/core';
import { VideoService } from '../services/video.service';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoinfoComponent } from '../video-archive/video-archive.component';
import { MatDialog } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ScheduleService } from '../services/schedule.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-user-public-videos',
  templateUrl: './user-public-videos.component.html',
  styleUrls: ['./user-public-videos.component.scss'],
  providers: [DatePipe]
})
export class UserPublicVideosComponent implements OnInit {
  videos:any[] = []
  searchQuery:any = ''
  schedulesData:any[] = []
  schedules:any[] = []
  willOnAirTodayTime:any
  onAirTime:any
  private intervalId: any;
  totItems:any
  totalItems= 0;
  currentPage = 1;
  itemsPerPage = 4;
  userId:any;
  url:any = ''
  scheduleStatusData:any[] = []
  scheduleStatus:any = 'willOnAir'
  streamData:any

  constructor(
    private videoService:VideoService,
    private scheduleService:ScheduleService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private datePipe: DatePipe,
    private toasterService:ToastrService,
    private router : Router,
  ){}
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = params['id'];
      const id = params['id'];
      this.inputSubject
        .pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(value => {
      this.searchQuery = value;
      this.getData(id)
    });
    // this.getSchedules()
    this.getData(id)
    // this.dateStringToTimestamp("2023-08-03T14:49:30.000Z")
    // this.getSchedulesData()
    
    this.intervalId = setInterval(() => {
      this.getUserLiveStreamingData(id)
      this.GetData(id)
    }, environment.pollingInterVal);
  });
  }
  GetData(id:any){
    this.scheduleService.getSchedules(id).subscribe((res)=>{
      this.schedules = (res as any).body.data.results
      console.log((res as any).body.data.results,"check resGET DATA results")
      console.log((res as any).body.data.totalRecords,"check resGET DATA totalRecords")
    })
  }

  getUserLiveStreamingData(id:any){
    console.log("this.getUserLiveStreamingData")
    this.scheduleService.getUserLiveStreamingData(id).subscribe((res)=>{
      console.log((res as any).body.data,"check res")
      this.streamData = (res as any).body.data
      // this.schedules = (res as any).body.data.results
      // console.log((res as any).body.data.results,"check resGET DATA results")
      // console.log((res as any).body.data.totalRecords,"check resGET DATA totalRecords")
    })
  }
  getScheduleStatus(scheduleId:any){
    this.scheduleService.getScheduleStatus(scheduleId).subscribe((res)=>{
      console.log((res as any).body.data,"check res status")
      this.scheduleStatusData.push((res as any).body.data) 
      let status = (res as any).body.data

      if(status.onAir==false && status.willOnAir == true){
        this.scheduleStatus = 'willOnAir'
        // return 'willOnAir'
      }
      if(status.onAir==true && status.willOnAir == false){
        this.scheduleStatus = 'onAir'
        // return 'onAir'
      }
      else{
        this.scheduleStatus = 'onAired'
        // return 'onAired'
      }
    })
  }
  navigateToLiveStream(streamId:any){
    console.log(streamId,"streamId")
    console.log(`${environment.UI_URL}/#/viewer/${streamId}`,"`${environment.UI_URL}/#/viewer/${streamId}`")
    // this.router.navigate([`${environment.UI_URL}/viewer/${streamId}`])
    this.router.navigate([`/viewer/${streamId}`])
  }
  onPageChange(e:any){
    console.log(e,"check e")
    this.currentPage = e

  }
  handleNumClick(val:any){
    this.currentPage = val
    this.getData(this.userId)
    console.log(val,"checkvalue")
  }
  paginateForward(){
    if(this.totItems.length == this.currentPage){
      return
    }
    this.currentPage = this.currentPage + 1
    this.getData(this.userId)
  }
  paginateBack(){
    if(this.currentPage == 1){
      return
    }
    this.currentPage = this.currentPage - 1
    this.getData(this.userId)
  }
  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
  getData(id:any){
    this.videoService.getUserPublicVideos(id,this.searchQuery,this.currentPage, this.itemsPerPage).subscribe((data)=>{
      console.log(data,"check data")
      this.totItems = [...Array(Math.ceil(Number((data as any).count) / this.itemsPerPage))].map((el) => el + 1);
      this.totalItems =  (data as any).count
      this.videos = (data as any).data
    })
  }
  
  //   getSchedulesData(){
  //   this.videoService.getScheduleData().subscribe((res)=>{
  //       this.schedulesData = (res as any).body.data
  //   const currentTimestamp = Date.now() / 1000;
  //   if(this.schedulesData.length > 0) {
  //   }
    
  //   })
  // }
 
  checkScheduleVideoOnAirToday2(scheduleData:any, i:any) {
    console.log("159")
    let videoWillOnAir = [];
    const maxIterations = scheduleData.length;
    let iteration = 0;

    while (iteration < maxIterations && videoWillOnAir.length === 0) {
        const el = scheduleData[iteration];
        const currentTimestamp = Date.now() / 1000;
        const nextDayStart = new Date().setHours(24, 0, 0, 0) / 1000; // Timestamp for the start of the next day

        const startTimestamp = new Date(el.startTimestamp).getTime() / 1000;
        const endTimestamp = new Date(el.endTimestamp).getTime() / 1000;

        if (startTimestamp <= nextDayStart && startTimestamp >= currentTimestamp) {
            this.willOnAirTodayTime = this.formatDate(el.startTimestamp);
            videoWillOnAir.push("true");
        }
        iteration++;
    }

    return videoWillOnAir.length > 0;
}
 
   dateStringToTimestamp(dateString:any) {
    const timestamp = Date.parse(dateString);
    console.log(timestamp,"ng on inittimestamp ")
    return timestamp;
  }
 
  checkScheduleVideoOnAir(scheduleData: any[], index: number): boolean {
    console.log("189")
    let checkArr = []
    const currentTime = Date.now()
    for (const schedule of scheduleData) {
      const startTime = new Date(schedule.startTimestamp).getTime()
      const endTime = new Date(schedule.endTimestamp).getTime()
     
      if(currentTime >= startTime && currentTime <= endTime){
        this.onAirTime = this.formatDate(schedule.startTimestamp); 
        console.log("true")
        checkArr.push(`${schedule.videoId}`)
      }else{
        console.log("false")
      }
      if(checkArr.length>0){
        this.url = checkArr[0]
        return true
      }
    }

    return false;
  }
  
  getSchedules(){
    this.videoService.getSchedules().subscribe((res)=>{
      this.schedules = (res as any).body.data
  })
  }
  upcomingVideo(schedule:any){
    console.log(schedule,"schedule check")
     if(schedule.onAir){
      this.router.navigate([`/videos/live/${schedule.video.videoId}`]);
      return
    }
    // console.log(scheduleData,"check schedule data")
    // let videoOnAir = this.checkScheduleVideoOnAir(scheduleData,i)
    // console.log(videoOnAir,"videoOnAir")
    // if(videoOnAir){
    //   this.router.navigate([`/videos/live/${this.url}`]);
    //   return
    // }
    // let videoWillOnAir = this.checkScheduleVideoOnAirToday2(scheduleData,i)
    if(!schedule.onAir && schedule.willOnAir){
      let toast = this.toasterService.info("You can watch when video is on air")
      setTimeout(()=>{
        this.toasterService.remove(toast.toastId)
      },2000)
      return
    }
    // else{
    //   let toast = this.toasterService.info("No Scheduled Video to be on air")
    //   setTimeout(()=>{
    //     this.toasterService.remove(toast.toastId)
    //   },2000)
    // }
  }
  formatDate(inputDate:any) {
    const date = new Date(inputDate);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const amPm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hours % 12 || 12}:${minutes}:${seconds} ${amPm}`;
    console.log(`${month} ${day}, ${year} | ${formattedTime}`,"qwwqewq")  
    return `${month} ${day}, ${year} | ${formattedTime}`;
  }
  
 

  
  
  
  checkScheduleVideoOnAirToday(scheduleData:any,i:any){
    let check =  this.checkScheduleVideoOnAirToday2(scheduleData,i)
    return check
  }
    
  inputSubject = new Subject<string>();
  SearchData(target: any) {
    this.inputSubject.next(target.value)
  }
  openVideoInfo(id:any){
    this.router.navigate([`/videos/public/${id}`])
    // const dialogRef = this.dialog.open(VideoinfoComponent,{
    //     width:'550px',
    //     height: '330px',
    //     data:id
    // })
    // dialogRef.afterOpened().subscribe(()=>{
    //     this.getVideoInfo(id)
    // })
}
isVideoOnAir(videoId: string,i:any): boolean {
  console.log(i,"check i")
  const currentTimestamp = Date.now() / 1000;
  // for (const schedule of this.schedulesData) {
      const startTimestamp = new Date(this.schedulesData[i].startTimestamp).getTime() / 1000;
      const endTimestamp = new Date(this.schedulesData[i].endTimestamp).getTime() / 1000;
      if (startTimestamp <= currentTimestamp && currentTimestamp <= endTimestamp && this.schedulesData[i].videoId === videoId) {
        // this.type.onAir = true
        console.log("video on air currently")
        return true;
      }
  // }
  // this.type.onAir = false
  console.log("video not on air currently")
  return false;
}

isVideoOnAirWithin24Hours(videoId: string,i:any): boolean {
  const currentTimestamp = Date.now() / 1000;
  const nextDayStart = new Date().setHours(24, 0, 0, 0) / 1000; // Timestamp for the start of the next day

  // for (const schedule of this.schedulesData) {
    const startTimestamp = new Date(this.schedulesData[i].startTimestamp).getTime() / 1000;
    const endTimestamp = new Date(this.schedulesData[i].endTimestamp).getTime() / 1000;

    if (
      startTimestamp <= nextDayStart &&
      endTimestamp >= currentTimestamp &&
      this.schedulesData[i].videoId === videoId
    ) {
      // this.type.willOnAir = true
      return true;
    }
  // }
  // this.type.willOnAir = false
  return false;
}



}
