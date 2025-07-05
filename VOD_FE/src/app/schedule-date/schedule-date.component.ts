import { Component ,OnInit,OnChanges} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoService } from '../services/video.service';

@Component({
  selector: 'app-schedule-date',
  templateUrl: './schedule-date.component.html',
  styleUrls: ['./schedule-date.component.scss']
})
export class ScheduleDateComponent implements OnInit {
  queryId!:any
  scheduleVideoData!:any
  scheduledDates!:any
  check:any = false
  constructor(
    private router: Router,
    private videoService: VideoService,
    private route:ActivatedRoute,
  ){}
  ngOnInit() {
    this.route.queryParams.subscribe((res)=>{
      this.getScheduleVideoData(res['id'])
      this.queryId = res['id']
      this.check = true
      console.log(this.check,"check")
    })
  }
  // hasScheduledEvent(date:any) {
  //   let result = this.scheduledDates.includes(date.toISOString().slice(0, 10));
  //     // this.check = result
  //     console.log(result,"check result")
  // }
  Back(){
    this.router.navigate([`/schedules`,]);
  }
  getScheduleVideoData(id?:any,date?:any){
        this.videoService.getScheduleData(id).subscribe((res)=>{
          console.log((res as any).body.data,"check schedule data response")
          // let arr = (res as any).body.data.map((schedule:any) =>{
          //   console.log(schedule,"check schedule")
          //   return new Date(schedule.startTimestamp).toISOString().slice(0, 10)
          // });
          let arr = (res as any).body.data.map((schedule: any) => {
            const startTimestamp = new Date(schedule.startTimestamp);
            const userTimeZoneOffset = new Date().getTimezoneOffset();
            startTimestamp.setMinutes(startTimestamp.getMinutes() - userTimeZoneOffset);
            const formattedDate = startTimestamp.toISOString().slice(0, 10);
            return formattedDate;
          });
          console.log(arr,"check arrr")
          this.scheduledDates  = arr
          this.scheduleVideoData = (res as any).body.data
          // console.log(this.scheduledDates,' this.scheduledDates')

        })
  }
}
