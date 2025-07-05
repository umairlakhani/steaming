import { Component, Input, OnChanges, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDateStruct, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { VideoService } from 'src/app/services/video.service';

@Component({
  selector: 'app-schedule-calendar',
  templateUrl: './schedule-calendar.component.html',
  styleUrls: ['./schedule-calendar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ScheduleCalendarComponent implements OnChanges {
  @Input() selectedVideo: any | undefined;
  @Input() scheduleId: any | undefined;
  @Input() listArray: any | undefined;
  model: NgbDateStruct;
  model2: NgbDateStruct = { year: new Date().getFullYear(), day: new Date().getDate(), month: new Date().getMonth() +1 };
  // selectedDateList: Array<{ date: NgbDateStruct, timeSlot: { id: number, timeSlot: string } }> = [];
  selectedDateList: Array<any> = [];
  timeSlots: Array<{ id: number, timeSlot: string }> = [
    {
      id: 1,
      timeSlot: '8am to 11pm'
    },
    {
      id: 2,
      timeSlot: '12pm to 2pm'
    },
    {
      id: 3,
      timeSlot: '3pm to 6pm'
    }
  ];
  selectedTimeSlot: any;
  list: Array<any> = [];
  date: any

  constructor(
    private calendar: NgbCalendar,
     private videoService: VideoService,
     private router:Router,
    ) {
    // console.log(this.selectedVideo,"selected")
    this.model = this.calendar.getToday();
   
    // this.model2 = this.calendar.getToday();
  }

  ngOnChanges(){
    if (this.scheduleId != undefined) {
      // this.videoService.getScheduleData().subscribe((res)=>{
      //   console.log((res as any).body.data,"check res from schedule data")
      // })
      console.log(this.scheduleId, "check shcedule id")
      console.log(this.selectedVideo, "selectedVideo")
      console.log(this.listArray,"listArray")
      // this.list = this.listArray
      
      let newArr = this.listArray.map((el:any)=>{
        const {createdAt,id,scheduleId,video,...rest} = el
        return rest
      })
      this.list = newArr

    } else {
      console.log(this.list,"check list on changes")
      console.log("false")
    }
  }
  isCurrentMonthToday(date: NgbDateStruct): boolean {
    const today = this.calendar.getToday();
    return date.year === today.year && date.month === today.month && date.day === today.day;
  }
  onDateSelected(date: NgbDateStruct) {
    this.date = date
    console.log(date)
    const index = this.getIndexFromSelectedDate(date);
    if (index !== -1) {
      this.selectedTimeSlot = this.selectedDateList.filter((item) => item.date === date)[0].timeSlot.timeSlot;
    } else {
      this.selectedTimeSlot = this.timeSlots[0].timeSlot;
    }
  }

  // modelToString(time:any): string { 
  //   console.log(time,"check start timestamp")
  //   if (this.model) {
  //     const { year, month, day } = this.model;
  //     return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  //   }
  //   return '';
  // }

  modelToString(time: any): string {
    console.log(time, "check start timestamp");
    if (time) {
      const date = new Date(time);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }

  onIconSelected(date: NgbDateStruct) {
    console.log('model ', this.model, ' ', date)
    // const today = this.calendar.getToday();

    const today = new Date();
    const selectedDate = new Date(date.year, date.month - 1, date.day);
    if (selectedDate.getTime() < today.setHours(0, 0, 0, 0)) {
      // Do not perform any action if the date is before today
      return;
    }
    this.model = date;
    const isSelectedDate = this.isSelectedDate(date);
    if (isSelectedDate) {
      this.selectedDateList.splice(this.getIndexFromSelectedDate(date), 1);
    } else {
      const selectedDateItem = {
        date: date,
        timeSlot: this.timeSlots[0]
      }
      this.selectedDateList[0] = selectedDateItem;
    }
  }

  selectToday() {
    this.model = this.calendar.getToday();
  }

  isSelected(date: NgbDateStruct) {
    // console.log(date,"dateee")
    const index = this.getIndexFromSelected(date);
    // console.log('has index ', index);
    if (index !== -1) {
      return true;
    }
    return false;
  }

  isSelectedDate(date: NgbDateStruct) {
    const index = this.getIndexFromSelectedDate(date);
    console.log('has index ', index);
    if (index !== -1) {
      return true;
    }
    return false;
  }

  getIndexFromSelected(date: NgbDateStruct) {
    if (this.selectedDateList && this.selectedDateList.length > 0) {

      return this.selectedDateList.findIndex((item: any) => item.date === date);
    }
    return -1;
  }

  getIndexFromSelectedDate(date: NgbDateStruct) {
    if (this.selectedDateList && this.selectedDateList.length > 0) {
      for (let index = 0; index < this.selectedDateList.length; index++) {
        const inputDate = {
          day: this.selectedDateList[index].date.day,
          month: this.selectedDateList[index].date.month,
          year: this.selectedDateList[index].date.year

        }
        if (inputDate.day === date.day && inputDate.month === date.month && inputDate.year === date.year) {
          return index;
        }
      }
    }
    return -1;
  }

  getSelectedTimeSlot() {
    const timeSlot = this.timeSlots
      .filter((item: { id: number, timeSlot: string }) => item.timeSlot === this.selectedTimeSlot)[0];
    console.log(timeSlot, "check timeslot")
    return timeSlot;
  }

  changeTimeSlot() {
    const timeSlot = this.getSelectedTimeSlot();
    console.log(timeSlot, "timeSlot")
    const isSelectedDate = this.isSelectedDate(this.model);
    if (isSelectedDate) {
      const index = this.getIndexFromSelectedDate(this.model);
      if (index !== -1) {
        this.selectedDateList[index].timeSlot = timeSlot;
      }
    }
  }
   getSecondsFromTimeString(timeString:any) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }
  // addToList() {
  //   this.selectedDateList[0]
  //   const date = new Date(
  //     this.selectedDateList[0].date.year,
  //     this.selectedDateList[0].date.month - 1,
  //     this.selectedDateList[0].date.day
  //   );

  //   const [hours, minutes] = this.selectedTimeSlot.split(':');
  //   date.setHours(hours);
  //   date.setMinutes(minutes);
  //   const timestamp = date.getTime();

  //   let lengthInSeconds = this.getSecondsFromTimeString(this.selectedVideo.length)
  //   const startTime = new Date(timestamp);
  //   const endTime = new Date(startTime.getTime() + lengthInSeconds * 1000);

  //   const overlappingSchedule = this.list.find(schedule => {
  //     const scheduleStartTime = new Date(schedule.startTimestamp);
  //     const scheduleEndTime = new Date(schedule.endTimestamp);
  
  //     return (
  //       startTime < scheduleEndTime && endTime > scheduleStartTime
  //     );
  //   });
  
  //   if (overlappingSchedule) {
  //     console.log('Time Slot not available.');
  //     return;
  //   }


  //   let obj;
  //   if(this.scheduleId == undefined){
  //     console.log("undefined")
  //     const [hours, minutes, seconds] = this.selectedVideo.length.split(':').map(Number);
  //     const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  //     const startTime = new Date(timestamp);
  //     startTime.setSeconds(startTime.getSeconds() + totalSeconds);
  //     const endTimestamp = startTime.toISOString();
  //     obj = {
  //       videoId: this.selectedVideo.videoId,
  //       startTimestamp: new Date(timestamp).toISOString(),
  //       endTimestamp: endTimestamp,
  //       val: this.selectedTimeSlot
  //     }
  //   }else{
  //     console.log("not undefined")
  //     console.log(this.selectedVideo.length)
  //     const [hours, minutes, seconds] = this.selectedVideo.length.split(':').map(Number);
  //     const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  //     const startTime = new Date(timestamp);
  //     startTime.setSeconds(startTime.getSeconds() + totalSeconds);
  //     const endTimestamp = startTime.toISOString();
  //     obj = {
  //       videoId: this.selectedVideo,
  //       startTimestamp: new Date(timestamp).toISOString(),
  //       endTimestamp: endTimestamp,
  //       val: this.selectedTimeSlot
  //     }
       
  //   }
  //   console.log(obj,"chec obj")
  //   this.list.push(obj)
  //   console.log(this.list,"check list after push")
  // }
  addToList() {
    this.selectedDateList[0];
    const date = new Date(
      this.selectedDateList[0].date.year,
      this.selectedDateList[0].date.month - 1,
      this.selectedDateList[0].date.day
    );
  
    const [hours, minutes, seconds] = this.selectedTimeSlot.split(':');
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(seconds);
    const timestamp = date.getTime();
  
    let lengthInSeconds = this.getSecondsFromTimeString(this.selectedVideo.length)
    const startTime = new Date(timestamp);
    const endTime = new Date(startTime.getTime() + lengthInSeconds * 1000);
  
    const overlappingSchedule = this.list.find(schedule => {
      const scheduleStartTime = new Date(schedule.startTimestamp);
      const scheduleEndTime = new Date(schedule.endTimestamp);
  
      return (
        startTime < scheduleEndTime && endTime > scheduleStartTime
      );
    });
  
    if (overlappingSchedule) {
      console.log('Time Slot not available.');
      return;
    }
  
    let obj;
    if (this.scheduleId === undefined) {
      console.log("undefined");
      const [hours, minutes, seconds] = this.selectedVideo.length.split(':').map(Number);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      const startTime = new Date(timestamp);
      startTime.setSeconds(startTime.getSeconds() + totalSeconds);
      const endTimestamp = startTime.toISOString();
      obj = {
        videoId: this.selectedVideo.videoId,
        startTimestamp: new Date(timestamp).toISOString(),
        endTimestamp: endTimestamp,
        val: this.selectedTimeSlot
      };
    } else {
      console.log(this.selectedVideo,"check selected video")
      console.log("not undefined");
      console.log(this.selectedVideo.length,"check selected video");
      const [hours, minutes, seconds] = this.selectedVideo.length.split(':').map(Number);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      const startTime = new Date(timestamp);
      startTime.setSeconds(startTime.getSeconds() + totalSeconds);
      const endTimestamp = startTime.toISOString();
      obj = {
        videoId: this.selectedVideo,
        startTimestamp: new Date(timestamp).toISOString(),
        endTimestamp: endTimestamp,
        val: this.selectedTimeSlot
      };
  
    }
    console.log(obj, "check obj");
    this.list.push(obj);
    console.log(this.list, "check list after push");
  }
  deleteList(item: any) {
    console.log(item, "delete list")
    const index = this.list.indexOf(item);
    if (index > -1) {
      this.list.splice(index, 1);
    }
  }
  submitSchedule() {
    console.log(this.scheduleId,"this.scheduleId")
    console.log(this.list, "list")
    if (this.list.length < 1) {
      console.log('Please add videos in list.');
      return;
    }
    console.log(this.list,'check list')
    let newList = this.list.map((el) => {
      // console.log(new)
      const { val, ...rest } = el
      return rest
    })
    console.log(newList,"newList")
    if(this.scheduleId != undefined){
      console.log(newList,"check List")
      let editPayload = {
        name: "scheduling",
        description: "scheduling video",
        scheduleVideoData: newList
      }
      this.videoService.editScheduleVideo(this.scheduleId,editPayload).subscribe((result) => {
        console.log(result);
      });
    }else{
      this.videoService.scheduleVideo({
        name: "scheduling",
        description: "scheduling video",
        scheduleVideoData: newList
      }).subscribe((result) => {
        console.log(result);
      });
    }
    setTimeout(()=>{
      this.router.navigate(['./schedules'])
    },500)
    

    // name:this.selectedVideo.name,
    // description:this.selectedVideo.description,
    // console.log('schedule working')
    // console.log(this.selectedVideo,"videoid")
    // console.log(this.selectedDateList[0].date," this.selectedDateList[0].date")

    // let date = Date.parse(
    //   this.selectedDateList[0].date.month + '/' + this.selectedDateList[0].date.day + '/' + this.selectedDateList[0].date.year + ' ' + this.selectedTimeSlot
    // );


    // if (!date || !this.videoId){
    //   console.log('Date or video id is wrong.');
    //   return;
    // }
    // console.log({
    //      videoId: `${this.videoId}`,
    //      videoId: this.selectedVideo,
    //      startTime: date,
    //     //  endTime: date
    // },"check data sent")

    // this.videoService.scheduleVideo({
    //   videoId: `${this.videoId}`,
    //   startTime: date,
    //   endTime: date
    // }).subscribe((result) => {
    //   console.log(result);
    // });
  }
}
