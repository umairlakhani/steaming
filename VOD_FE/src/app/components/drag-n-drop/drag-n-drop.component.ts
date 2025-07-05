import { Component, Input, OnChanges, OnInit, Output, EventEmitter, SimpleChanges } from '@angular/core';
import {
  CdkDragDrop,
} from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router';
import { VideoService } from 'src/app/services/video.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
@Component({
  selector: 'app-drag-n-drop',
  templateUrl: './drag-n-drop.component.html',
  styleUrls: ['./drag-n-drop.component.scss'],
})
export class DragNDropComponent implements OnChanges,OnInit {
  videos: any
  @Input() queryDate: any
  @Input() apiSlots: any[] = []
  // @Input() totalItems:any
  totalItems: any
  totItems: any
  date!: any
  // @Output() apiData = new EventEmitter();
  slot1: any = []
  slot2: any = []
  slot3: any = []
  slot4: any = []
  activeTimeSlot: any = ''
  basket: any = [];
  currentSlotArray: any[] = [];
  apiData: any[] = []
  // searchQuery:any
  @Output() dataChanged: EventEmitter<any[]> = new EventEmitter();
  // @Output() searchQuery: EventEmitter<any> = new EventEmitter();
  searchQuery: any;
  currentPage = 1;
  // @Output() currentPage: EventEmitter<any> = new EventEmitter();
  itemsPerPage = 10;
  id!: any
  hover: boolean = false
  constructor(
    private route: ActivatedRoute,
    private videoService: VideoService,
    private dataService: DataService,

  ) {
    this.route.queryParams.subscribe((res) => {
      // console.log(new Date(res['date']),"this.route.queryParams")
      this.date = res['date']
      this.id = res['id']
    })
  }
  searchData(e: any) {
    console.log(e)
    this.inputSubject.next(e.target.value)
  }
  inputSubject = new Subject<string>();
  ngOnChanges(changes: SimpleChanges) {
    this.inputSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe((val) => {
      console.log(val, "check val")
      this.searchQuery = val
      this.getData()
    })
    this.getData()
    this.setActiveSlot('slot1')
    // this.getSingleSchedule(this.id, this.date)
    // console.log(changes,"changes")
    if (changes['apiSlots']) {
      if (this.apiSlots && this.apiSlots.length > 0) {
        console.log('changes happen in ')
        this.apiSlots.map((sch: any, i: any) => {
          let id = i + 1
          let formatStartDate = this.formatDateToTime(sch.startTimestamp)
          let formatEndDate = this.formatDateToTime(sch.endTimestamp)
          const fieldStartTime = this.convertTime(formatStartDate)
          const fieldEndTime = this.convertTime(formatEndDate)
          const slot = this.getSlot(fieldStartTime)
          console.log(slot, 'check slot ')
          let tempObj = {
            thumbnail: sch.video.thumbnail,
            Title: sch.video.Title,
            length: sch.video.length,
            timeslot: { id: sch.videoId, startTimestamp: fieldStartTime, endTimestamp: fieldEndTime },
            uniqueId: `${id}`
          }
          let apiObj = {
            videoId: sch.videoId,
            startTimestamp: sch.startTimestamp, endTimestamp: sch.endTimestamp,
            uniqueId: `${id}`
          }
          console.log(tempObj, "tempObj")
          this.apiData.push(apiObj)
          this.dataChanged.emit(this.apiData);
          if (slot == 'slot1') {
            this.slot1.push(tempObj)
          }
          if (slot == 'slot2') {
            this.slot2.push(tempObj)
          }
          if (slot == 'slot3') {
            this.slot3.push(tempObj)
          }
          if (slot == 'slot4') {
            this.slot4.push(tempObj)
          }
        })
      }
    }
    // console.log(this.apiData,"chec api data ng On changes")
    // setTimeout(()=>{
    //   let item = document.getElementById(`slot3`)
    //   console.log(item,"check item by id before change")
    // },1500)
  }
  ngOnInit(): void {
    this.getSingleSchedule(this.id, this.date)
    
  }
  handleNumClick(val: any) {
    this.currentPage = val
    this.getData()
    console.log(val, "checkvalue")
  }
  paginateForward() {
    // console.log(this.totItems.length,"this.totItems.length")

    if (this.totItems.length == this.currentPage) {
      return
      // console.log(this.totItems.length-1,"this.totItems.length-1")
    }
    this.currentPage = this.currentPage + 1
    this.getData()
  }
  paginateBack() {
    if (this.currentPage == 1) {
      return
    }
    this.currentPage = this.currentPage - 1
    this.getData()
  }
  getData() {
    this.videoService.ownedListPublishedProcessed(this.searchQuery, this.currentPage.toString(), this.itemsPerPage.toString(),)
      .subscribe((res: any) => {
        this.totalItems = Number(res.body.data.totalRecords);
        console.log(res.body.data.totalRecords, "res.body.data.totalRecords")
        this.totItems = [...Array(Math.ceil(Number(res.body.data.totalRecords) / this.itemsPerPage))].map((el) => el + 1);
        console.log(this.totItems, "this.totItems")
        this.videos = res.body.data.results;
      });
  }
  onPageChange(event: any) {
    this.currentPage = event
    // this.currentPage.emit(event)
  }
  searchVideos(e: any) {
    this.searchQuery.emit(e.target.value)
  }
  hoverVid(i: any) {
    let vids = document.getElementById(`item${i}`)
    vids?.classList.remove('hidden')
    this.hover = true
  }
  hoverOut(i: any) {
    let vids = document.getElementById(`item${i}`)
    vids?.classList.add('hidden')
    this.hover = false

  }

  clearAllSlots() {
    this.slot1 = []
    this.slot2 = []
    this.slot3 = []
    this.slot4 = []
    this.apiData = []
    this.dataChanged.emit(this.apiData)

  }
  setActiveSlot(slot: string) {
    this.activeTimeSlot = slot;
  }
  delete(item: any, i: any, text: any, startTimestamp: any) {
    console.log(item, "check Item")
    console.log(this.apiData, "apiData")
    // console.log(startTimestamp,"startTimestamp")
    const check = this.check(startTimestamp, this.date)
    // console.log(check,"check")

    const index = this.apiData.findIndex((el) => {
      // console.log(el.startTimestamp,"el.startTimestamp")
      // console.log(startTimestamp,"startTimestamp")
      // el.startTimestamp == check
      return el.uniqueId == item.uniqueId
    })
    console.log(index, "check index")
    this.apiData.splice(index, 1)
    if (text == 'slot1') {
      this.slot1.splice(i, 1)
    }
    if (text == 'slot2') {
      this.slot2.splice(i, 1)
    }
    if (text == 'slot3') {
      this.slot3.splice(i, 1)
    }
    if (text == 'slot4') {
      this.slot4.splice(i, 1)
    }
    console.log(this.apiData, "check apiData")
    this.dataChanged.emit(this.apiData)
  }
  convertStringSecondsIntoNumber(stringTime: any) {
    const [hours, minutes, seconds] = stringTime.split(':').map(Number);
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    return totalSeconds
  }
  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      console.log("event.previous container")
    } else {
      const clonedItem = Object.assign({}, event.previousContainer.data[event.previousIndex]);
      let totalSeconds = this.convertStringSecondsIntoNumber(clonedItem.length)
      const videoLengthInSeconds = totalSeconds;
      let currentSlotArray: any[] = [];

      if (this.activeTimeSlot == 'slot1') {
        let id = this.findAvailableId(this.slot1, this.apiData.length + 1)
        let startTime;
        if (this.slot1.length < 1) {
          startTime = '00:00:00'
        } else {
          startTime = this.slot1[this.slot1.length - 1].timeslot.endTimestamp
        }
        let endTime = this.addSeconds(startTime, videoLengthInSeconds);
        let tempObj = {
          ...clonedItem as any,
          timeslot: { id: (clonedItem as any).videoId, startTimestamp: startTime, endTimestamp: endTime },
          // uniqueId:`${this.apiData.length+1}`
          uniqueId: `${id}`
        }
        let apiObj = {
          videoId: (clonedItem as any).videoId,
          startTimestamp: this.check(startTime, this.date), endTimestamp: this.check(endTime, this.date),
          // uniqueId:`${this.apiData.length+1}`
          uniqueId: `${id}`
        }
        console.log(apiObj, "apiObj")
        console.log(tempObj, "tempObj")
        this.apiData.push(apiObj)
        this.slot1.push(tempObj)
      }
      if (this.activeTimeSlot == 'slot2') {
        let id = this.findAvailableId(this.slot2, this.apiData.length + 1)
        let startTime;
        if (this.slot2.length < 1) {
          startTime = '06:00:00'
        } else {
          startTime = this.slot2[this.slot2.length - 1].timeslot.endTimestamp
        }
        let endTime = this.addSeconds(startTime, videoLengthInSeconds);
        let tempObj = {
          ...clonedItem as any,
          timeslot: { id: (clonedItem as any).videoId, startTimestamp: startTime, endTimestamp: endTime },
          // uniqueId:`${this.apiData.length+1}`
          uniqueId: `${id}`
        }
        let apiObj = {
          videoId: (clonedItem as any).videoId,
          startTimestamp: this.check(startTime, this.date), endTimestamp: this.check(endTime, this.date),
          // uniqueId:`${this.apiData.length+1}`
          uniqueId: `${id}`
        }
        console.log(apiObj, "apiObj")
        this.apiData.push(apiObj)
        this.slot2.push(tempObj)
      }
      if (this.activeTimeSlot == 'slot3') {
        let id = this.findAvailableId(this.slot2, this.apiData.length + 1)
        let startTime;
        if (this.slot3.length < 1) {
          startTime = '12:00:00'
        } else {
          startTime = this.slot3[this.slot3.length - 1].timeslot.endTimestamp
        }
        let endTime = this.addSeconds(startTime, videoLengthInSeconds);
        let tempObj = {
          ...clonedItem as any,
          timeslot: { id: (clonedItem as any).videoId, startTimestamp: startTime, endTimestamp: endTime },
          // uniqueId:`${this.apiData.length+1}`
          uniqueId: `${id}`
        }
        let apiObj = {
          videoId: (clonedItem as any).videoId,
          startTimestamp: this.check(startTime, this.date), endTimestamp: this.check(endTime, this.date),
          uniqueId: `${id}`
          // uniqueId:`${this.apiData.length+1}`
        }
        // console.log(apiObj, "apiObj")
        console.log(tempObj, "check tempObj")
        this.apiData.push(apiObj)
        this.slot3.push(tempObj)
      }
      if (this.activeTimeSlot == 'slot4') {
        let id = this.findAvailableId(this.slot4, this.apiData.length + 1)
        let startTime;
        if (this.slot4.length < 1) {
          startTime = '18:00:00'
        } else {
          startTime = this.slot4[this.slot4.length - 1].timeslot.endTimestamp
        }
        let endTime = this.addSeconds(startTime, videoLengthInSeconds);
        let tempObj = {
          ...clonedItem as any,
          timeslot: { id: (clonedItem as any).videoId, startTimestamp: startTime, endTimestamp: endTime },
          // uniqueId:`${this.apiData.length+1}`
          uniqueId: `${id}`
        }
        let apiObj = {
          videoId: (clonedItem as any).videoId,
          startTimestamp: this.check(startTime, this.date), endTimestamp: this.check(endTime, this.date),
          // uniqueId:`${this.apiData.length+1}`
          uniqueId: `${id}`
        }
        // console.log(apiObj, "apiObj")
        this.apiData.push(apiObj)
        this.slot4.push(tempObj)
      }
      // console.log(this.apiData,"check apiData")
      console.log(this.apiData, "this.apiData")
      this.dataChanged.emit(this.apiData);
    }
  }
  findAvailableId(objects: any, startingId: any) {
    const existingIds = new Set(objects.map((obj: any) => Number(obj.uniqueId)));
    let newId = startingId;

    while (existingIds.has(newId)) {
      newId++;
    }

    return newId;
  }
  check(timestring: any, datestring: any) {
    const dateObj = new Date(datestring);
    const [hours, minutes, seconds] = timestring.split(':');
    dateObj.setHours(hours);
    dateObj.setMinutes(minutes);
    dateObj.setSeconds(seconds);

    const isoString = dateObj.toISOString();
    return isoString
  }
  convertIntoDateTime(timeString: string, dateString: string) {
    console.log(timeString, "check timestring");
    console.log(dateString, "check dateString");
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    let [dayOfWeek, month, day, year] = dateString.split(' ');
    const monthIndex = this.getMonthIndex(month);
    day = day.substring(0, day.length - 1)
    const datetime = new Date(Date.UTC(Number(year), monthIndex, Number(day), hours, minutes, seconds));
    const formattedDate = datetime.toISOString();
    return formattedDate;
  }
  addSeconds(time: string, seconds: number): string {
    const [hours, minutes, existingSeconds] = time.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + existingSeconds + seconds;
    const newHours = Math.floor(totalSeconds / 3600);
    const newMinutes = Math.floor((totalSeconds % 3600) / 60);
    const newSeconds = totalSeconds % 60;
    return `${this.pad(newHours)}:${this.pad(newMinutes)}:${this.pad(newSeconds)}`;
  }
  formatDateToTime(timeString: any) {
    const dateObj = new Date(timeString);
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    const formattedTime = new Intl.DateTimeFormat(navigator.language, { hour: '2-digit', minute: '2-digit', hour12: false, second: '2-digit', }).format(dateObj);
    return formattedTime;
  }

  //  formatDateToTime(timeString:any) {
  //   const dateObj = new Date(timeString);
  //   const hours = this.padZero(dateObj.getUTCHours());
  //   const minutes = this.padZero(dateObj.getUTCMinutes());
  //   const seconds = this.padZero(dateObj.getUTCSeconds());
  //   return `${hours}:${minutes}:${seconds}`;
  // }

  //  padZero(number:any) {
  //   return number.toString().padStart(2, '0');
  // }
  checkTime(formatStartDate: any) {
    const [hours, minutes, seconds] = formatStartDate.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds < 86400) {
      return '00:00:00'
    }
    return formatStartDate
  }
  convertTime(timeString: any) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const convertedHours = hours === 24 ? 0 : hours;
    const paddedHours = String(convertedHours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }
  getSingleSchedule(id: any, date?: any) {
    this.videoService.getSchedule(Number(id), date)
      .subscribe((res: any) => {
        console.log(res.body, "check res.body")
        res.body.scheduleData.forEach((sch: any, i: any) => {
          let formatStartDate = this.formatDateToTime(sch.startTimestamp)
          let formatEndDate = this.formatDateToTime(sch.endTimestamp)
          const fieldStartTime = this.convertTime(formatStartDate)
          const fieldEndTime = this.convertTime(formatEndDate)
          const slot = this.getSlot(fieldStartTime)
          console.log(slot, 'check slot ')
          let tempObj = {
            thumbnail: sch.video.thumbnail,
            Title: sch.video.Title,
            length: sch.video.length,
            timeslot: { id: sch.videoId, startTimestamp: fieldStartTime, endTimestamp: fieldEndTime },
            uniqueId: `${i + 1}`
          }
          let apiObj = {
            videoId: sch.videoId,
            startTimestamp: sch.startTimestamp, endTimestamp: sch.endTimestamp,
            uniqueId: `${i + 1}`
          }
          console.log(tempObj, "tempObj")
          console.log(apiObj, "apiObj")
          this.apiData.push(apiObj)
          this.dataChanged.emit(this.apiData);
          if (slot == 'slot1') {
            console.log('slot1')
            this.slot1.push(tempObj)
            // this.adjustTimeIfConflicts(this.slot1[i],slot)
          }
          if (slot == 'slot2') {
            this.slot2.push(tempObj)
            // this.adjustTimeIfConflicts(this.slot2[i],slot)
            console.log('slot2')

          }
          if (slot == 'slot3') {
            this.slot3.push(tempObj)
            // this.adjustTimeIfConflicts(this.slot3[i],slot)
            console.log('slot3')

          }
          if (slot == 'slot4') {
            this.slot4.push(tempObj)
            console.log('slot4')

            // this.adjustTimeIfConflicts(this.slot4[i],slot)

          }
        })

      });
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  getSlot(datetimeString: any) {
    console.log(datetimeString, "datetimeString")
    const [hours, minutes, seconds] = datetimeString.split(':');
    const currentDate = new Date();
    currentDate.setHours(parseInt(hours));
    currentDate.setMinutes(parseInt(minutes));
    currentDate.setSeconds(parseInt(seconds));

    const hour = currentDate.getHours();
    console.log(hour, "check hours")
    if (hour >= 0 && hour < 6) {
      return 'slot1';
    } else if (hour >= 6 && hour < 12) {
      return 'slot2';
    } else if (hour >= 12 && hour < 18) {
      return 'slot3';
    } else {
      return 'slot4';
    }
  }
  async onStartTimeChange(e: any, item: any, i: any, slot: any) {
    console.log(i, "clicked item index")
    console.log(item, "check item")
    let videoLengthInSeconds = this.convertStringSecondsIntoNumber(item.length)
    if (slot == 'slot1') {
      let index;
      let uniqueId = this.slot1[i].uniqueId
      this.slot1[i].timeslot.startTimestamp = e.target.value
      let endTime = this.addSeconds(e.target.value, videoLengthInSeconds);
      this.slot1[i].timeslot.endTimestamp = endTime
      this.adjustTimeIfConflicts(this.slot1[i], slot)
      this.resolveConflicts(this.slot1);
      index = this.slot1.findIndex((el: any) => el.uniqueId == uniqueId)
      let apiDataIndex = this.apiData.findIndex((el) => el.uniqueId == uniqueId)
      this.apiData[apiDataIndex].startTimestamp = this.check(this.slot1[index].timeslot.startTimestamp, this.date)
      this.apiData[apiDataIndex].endTimestamp = this.check(this.slot1[index].timeslot.endTimestamp, this.date)
    }
    if (slot == 'slot2') {
      let index;
      let uniqueId = this.slot2[i].uniqueId
      this.slot2[i].timeslot.startTimestamp = e.target.value
      let endTime = this.addSeconds(e.target.value, videoLengthInSeconds);
      this.slot2[i].timeslot.endTimestamp = endTime
      await this.adjustTimeIfConflicts(this.slot2[i], slot)
      await this.resolveConflicts(this.slot2);
      // index = this.apiData.findIndex((el)=>el.videoId == this.slot2[i].timeslot.id)
      index = this.slot2.findIndex((el: any) => el.uniqueId == uniqueId)
      let apiDataIndex = this.apiData.findIndex((el) => el.uniqueId == uniqueId)
      this.apiData[apiDataIndex].startTimestamp = this.check(this.slot2[index].timeslot.startTimestamp, this.date)
      this.apiData[apiDataIndex].endTimestamp = this.check(this.slot2[index].timeslot.endTimestamp, this.date)
    }
    if (slot == 'slot3') {
      console.log(i, "clicked item index in slot")
      let index;
      let uniqueId = this.slot3[i].uniqueId
      this.slot3[i].timeslot.startTimestamp = await e.target.value
      let endTime = this.addSeconds(e.target.value, videoLengthInSeconds);
      this.slot3[i].timeslot.endTimestamp = endTime
      await this.adjustTimeIfConflicts(this.slot3[i], slot)
      await this.resolveConflicts(this.slot3);
      index = this.slot3.findIndex((el: any) => el.uniqueId == uniqueId)
      let apiDataIndex = this.apiData.findIndex((el) => el.uniqueId == uniqueId)
      this.apiData[apiDataIndex].startTimestamp = this.check(this.slot3[index].timeslot.startTimestamp, this.date)
      this.apiData[apiDataIndex].endTimestamp = this.check(this.slot3[index].timeslot.endTimestamp, this.date)
    }
    if (slot == 'slot4') {
      let index;
      let uniqueId = this.slot4[i].uniqueId
      this.slot4[i].timeslot.startTimestamp = e.target.value
      let endTime = this.addSeconds(e.target.value, videoLengthInSeconds);
      this.slot4[i].timeslot.endTimestamp = endTime
      this.adjustTimeIfConflicts(this.slot4[i], slot)
      this.resolveConflicts(this.slot4);
      index = this.slot4.findIndex((el: any) => el.uniqueId == uniqueId)
      let apiDataIndex = this.apiData.findIndex((el) => el.uniqueId == uniqueId)
      this.apiData[apiDataIndex].startTimestamp = this.check(this.slot4[index].timeslot.startTimestamp, this.date)
      this.apiData[apiDataIndex].endTimestamp = this.check(this.slot4[index].timeslot.endTimestamp, this.date)
    }
    // this.apiData.forEach((data)=>{
    // let formatStartDate = this.formatDateToTime(data.startTimestamp)
    // const fieldStartTime = this.convertTime(formatStartDate)

    // })
    this.apiData.sort((a, b) => {
      let formatStartDateA = this.formatDateToTime(a.startTimestamp)
      const fieldStartTimeA = this.convertTime(formatStartDateA)

      let formatStartDateB = this.formatDateToTime(b.startTimestamp)
      const fieldStartTimeB = this.convertTime(formatStartDateB)

      const timeA = fieldStartTimeA;
      const timeB = fieldStartTimeB;
      if (timeA < timeB) {
        return -1; // a should come before b
      }
      if (timeA > timeB) {
        return 1; // b should come before a
      }
      return 0; // no change in order
    });

    console.log(this.slot3, "this.slot3")
    console.log(this.apiData, "this.apiData")
    this.dataChanged.emit(this.apiData);

  }

  onEndTimeChange(item: any, slot: any) {
    this.adjustTimeIfConflicts(item, slot);
  }

  async adjustTimeIfConflicts(item: any, slot: any) {
    if (slot == 'slot1') {
      this.slot1.sort((a: any, b: any) => {
        const startTimeA = a.timeslot.startTimestamp;
        const startTimeB = b.timeslot.startTimestamp;
        return startTimeA.localeCompare(startTimeB);
      });
    }
    if (slot == 'slot2') {
      this.slot2.sort((a: any, b: any) => {
        const startTimeA = a.timeslot.startTimestamp;
        const startTimeB = b.timeslot.startTimestamp;
        return startTimeA.localeCompare(startTimeB);
      });
    }
    if (slot == 'slot3') {
      this.slot3.sort((a: any, b: any) => {
        const startTimeA = a.timeslot.startTimestamp;
        const startTimeB = b.timeslot.startTimestamp;
        return startTimeA.localeCompare(startTimeB);
      });
    }
    if (slot == 'slot4') {
      this.slot4.sort((a: any, b: any) => {
        const startTimeA = a.timeslot.startTimestamp;
        const startTimeB = b.timeslot.startTimestamp;
        return startTimeA.localeCompare(startTimeB);
      });
    }

  }

  async resolveConflicts(arr: any) {
    for (let i = 0; i < arr.length - 1; i++) {
      // let videoLength = this.
      const currentSlot = await arr[i].timeslot;
      const nextSlot = await arr[i + 1].timeslot;
      if (currentSlot.endTimestamp.localeCompare(nextSlot.startTimestamp) === 1) {
        console.log(arr[i].length, "arr[i].length")
        let videoLengthInSeconds = await this.convertStringSecondsIntoNumber(arr[i + 1].length)
        const newStartTime = currentSlot.endTimestamp;
        let newEndTime = this.addSeconds(currentSlot.endTimestamp, videoLengthInSeconds);

        arr[i + 1].timeslot.startTimestamp = newStartTime;
        arr[i + 1].timeslot.endTimestamp = newEndTime;

        await this.resolveConflicts(arr);
        return;
      }
    }
  }


  getMonthIndex(month: any) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.indexOf(month);
  }

}
