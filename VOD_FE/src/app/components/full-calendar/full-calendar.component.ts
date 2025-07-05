import { Component, Input, OnChanges, OnInit,SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDateStruct, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { VideoService } from 'src/app/services/video.service';

@Component({
  selector: 'app-full-calendar',
  templateUrl: './full-calendar.component.html',
  styleUrls: ['./full-calendar.component.scss'],
})
export class FullCalendarComponent implements OnChanges {
  model!: NgbDateStruct;
  model2: NgbDateStruct = { year: new Date().getFullYear(), day: new Date().getDate(), month: new Date().getMonth() + 1 };
  selectedDateList: Array<any> = [];
  selectedTimeSlot: any;
  date: any;
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
  queryId!: any
  queryDate!: any
  @Input() scheduledDates!:any
  @Input() scheduleVideoData!:any
  constructor(
    private calendar: NgbCalendar,
    private videoService: VideoService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.model = this.calendar.getToday();
    
  }
 
  ngOnChanges() {
    // console.log(changes['scheduledDates'],"check changes")
  
    this.route.queryParams.subscribe((res) => {
      this.queryId = res['id']
    })
  }
   hasScheduledEvent(date:any) {
    // console.log(date,"check date")
    const formattedDate = `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
    return this.scheduledDates?.includes(formattedDate);
    // console.log(this.scheduledDates,"this.scheduledDates")
    // console.log(date,"date")
    // return this.scheduledDates.includes(date.toISOString().slice(0, 10));
  }
  // getSingleSchedule(id:any){
  //       this.videoService.getScheduleData().subscribe((res)=>{
  //         console.log((res as any).body.data,"check schedule data response")
  //         this.scheduleVideoData = (res as any).body.data
  //       })
  // }
  isCurrentMonthToday(date: NgbDateStruct): boolean {
    const today = this.calendar.getToday();
    return date.year === today.year && date.month === today.month && date.day === today.day;
  }
  onDateSelected(date: NgbDateStruct) {
    console.log(date,"check date")
    this.date = date
    // const index = this.getIndexFromSelectedDate(date);
    const dateObj = new Date(date.year, date.month-1, date.day);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short', // 'Tue'
      month: 'short',   // 'Aug'
      day: '2-digit',   // '01'
      year: 'numeric',  // '2023'
    });
    this.queryDate = formattedDate
    console.log(formattedDate,"formattedDate")
    // console.log(formattedDate2,"chekc formattedDate2 date");
    this.router.navigate([`/new-schedule`], { queryParams: { id: this.queryId, date: this.queryDate } })
      // console.log(index,"check index")
    // if (index !== -1) {
    //   this.selectedTimeSlot = this.selectedDateList.filter((item) => item.date === date)[0].timeSlot.timeSlot;
    // } else {
    //   this.selectedTimeSlot = this.timeSlots[0].timeSlot;
    // }
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
  
  onIconSelected(date: NgbDateStruct) {
    // const today = new Date();
    // const selectedDate = new Date(date.year, date.month - 1, date.day);
    // if (selectedDate.getTime() < today.setHours(0, 0, 0, 0)) {
    //   // Do not perform any action if the date is before today
    //   return;
    // }
    // this.model = date;
    // const isSelectedDate = this.isSelectedDate(date);
    // console.log(isSelectedDate,"isSelectedDate")
    // if (isSelectedDate) {
    //   this.selectedDateList.splice(this.getIndexFromSelectedDate(date), 1);
    // } else {
      // const selectedDateItem = {
      //   date: date,
      //   timeSlot: this.timeSlots[0]
      // }
      // this.selectedDateList[0] = selectedDateItem;
    // }
  }
  // isSelectedDate(date: NgbDateStruct) {
  //   const index = this.getIndexFromSelectedDate(date);
  //   // console.log('has index ', index);
  //   if (index !== -1) {
  //     return true;
  //   }
  //   return false;
  // }

  // @ViewChild('calendar') calendar:any
  // calendarOptions: CalendarOptions = {
  //   initialView: 'dayGridMonth',
  //   plugins: [dayGridPlugin],
  // };



}
