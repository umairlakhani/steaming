import { Component, OnInit } from '@angular/core';
import { VideoService } from '../services/video.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-streaming',
  templateUrl: './streaming.component.html',
  styleUrls: ['./streaming.component.scss']
})
export class StreamingComponent implements OnInit {

  totItems:any = []
  totalItems= 0;
  userLiveStreamVideosCount = 0
  currentPage = 1;
  itemsPerPage = 6;
  searchQuery:any = ''
  player: any
  videos: any[] = [];
  sectionTitle:any;
  type:any

constructor(
  private videoService: VideoService,
  public dialog: MatDialog,
  private router: Router ,
  private route: ActivatedRoute,

){}
ngOnInit() {
  this.route.queryParams.subscribe((params) => {
    console.log(params['type'],"check params"); // { orderby: "price" }
    if(params['type'] == 'video'){  
      this.type = 'video'
      this.sectionTitle = 'Video Streaming'
    }
    if(params['type'] == 'user'){
      this.type = 'user'
      this.sectionTitle = 'User Live Streaming'
    }
  });

 this.getData()
}

getPageNumbers(): number[] {
  const visiblePages = 5;
  const totalPages = Math.ceil(this.totalItems / 6);
  const currentPageGroup = Math.ceil(this.currentPage / visiblePages);
  const startPage = (currentPageGroup - 1) * visiblePages + 1;
  const endPage = Math.min(totalPages, startPage + visiblePages - 1);

  let pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
  }
  return pageNumbers;
}

goToFirstPage() {
  this.currentPage = 1;
  this.getData()
}

goToLastPage() {
  this.currentPage = Math.ceil(this.totalItems / 6); // Assuming 5 items per page
  this.getData()
}



getData(){
  this.route.queryParams.subscribe((params) => {
    if(params['type'] == 'video'){  
      this.videoService.liveStreamVideos(this.searchQuery,this.currentPage, this.itemsPerPage)
      .subscribe((res: any) => {
        this.totalItems =  res.body.data.totalRecords
        console.log(res.body.data.totalRecords,"res.body.data.totalRecords")
        this.totItems = [...Array(Math.ceil(Number(res.body.data.totalRecords) / this.itemsPerPage))].map((el) => el + 1);
        this.videos = res.body.data.results;
      });
    }
    if(params['type'] == 'user'){
      this.videoService.userLiveStreamVideos(this.searchQuery,this.currentPage, this.itemsPerPage).subscribe((res)=>{
        this.totalItems =  (res as any).body.data.totalRecords
        this.totItems = [...Array(Math.ceil(Number((res as any).body.data.totalRecords) / this.itemsPerPage))].map((el) => el + 1);
        console.log((res as any).body.data.results,"(res as any).body.data.results")
        this.videos = (res as any).body.data.results
        // this.userLiveStreamVideosCount = (res as any).body.data.totalRecords
      })
    }
  })
 
}
onPageChange(e:any){
  console.log(e,"check e")
  this.currentPage = e

}
getTimePassedForVideo(isoString: any) {
  const targetTime = new Date(isoString) as any;
  const currentTime = new Date() as any;
  const timeDifferenceInMilliseconds = currentTime - targetTime;
  const timeDifferenceInSeconds = Math.floor(timeDifferenceInMilliseconds / 1000);
  console.log(`Time difference in seconds: ${timeDifferenceInSeconds}`);
  let timeInMinutes = timeDifferenceInSeconds/60
  if(timeInMinutes<0.55){
    return "just now"
  }
  if(timeInMinutes>59.99){
    let hours;
    let min;
    hours = (timeInMinutes/60).toFixed(0)
    console.log(hours,"check hours")
    console.log(((timeInMinutes/60)).toString(),"((timeInMinutes/60)).toString()")
    min = ((timeInMinutes/60)).toString().substring(((timeInMinutes/60).toString().indexOf('.')),((timeInMinutes/60).toString().length-1))
    console.log(Number(min),"check min")
    let finalMinutes = (Number(min)*60).toFixed(0)
    if(Number(finalMinutes)<1){
      return `${hours} hours ago`
    }else{
      return `${hours} hours and ${finalMinutes} minutes ago`
    }
  }
  else{
    return `${(timeDifferenceInSeconds/60).toFixed(0)} minutes ago`
  }
}
handleNumClick(val:any){
  this.currentPage = val
  this.getData()
  console.log(val,"checkvalue")
}
paginateForward(){
  if(this.totItems.length == this.currentPage){
    return
  }
  this.currentPage = this.currentPage + 1
  this.getData()
}
paginateBack(){
  if(this.currentPage == 1){
    return
  }
  this.currentPage = this.currentPage - 1
  this.getData()
}
playVid(videoId: any) {
  console.log(videoId, "check video id")
  this.router.navigate([`/videos/live/${videoId}`]);
}
playVideo(videoId: any) {
  console.log(videoId.streamingId, "check video id")
  console.log(videoId.streamKey, "check obs id")
  if(videoId?.streamType=="RTMP_STREAM"){
    this.router.navigate([`/viewer/${videoId.streamingId}_${videoId.streamKey}`]);
    
  }else{
    this.router.navigate([`/viewer/${videoId.streamingId}`]);
    
  }
}
}
