import { AfterContentChecked, Component, Input, EventEmitter, HostListener, OnInit, Output, ViewChild, ViewEncapsulation, OnChanges, OnDestroy, ViewChildren, QueryList, ElementRef, Inject, AfterViewInit, AfterViewChecked } from '@angular/core';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SwiperComponent } from 'swiper/angular';
// import Swiper core and required modules
import SwiperCore, { SwiperOptions, Pagination } from 'swiper';
import { NgbDateStruct, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from "@angular/router";
import { VideoService } from 'src/app/services/video.service';
import { debounceTime, distinctUntilChanged, firstValueFrom, Subject, Subscription } from "rxjs";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { DragNDropComponent } from '../drag-n-drop/drag-n-drop.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DataService } from 'src/app/services/data.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SchedulesComponent implements OnInit, AfterContentChecked {
  @ViewChild('swiper') swiper!: SwiperComponent;
  config: SwiperOptions = {
    width: 1000,
    direction: 'horizontal',
    slidesPerView: 4,
    spaceBetween: 20,
    pagination: false,
    allowSlideNext: true,
    allowSlidePrev: true,
    mousewheel: true,
    // keyboard: true,
    // navigation: true,
  };
  @ViewChild('dragComponent') dragComponent!: DragNDropComponent;
  selectedCategory: any;
  categoryList: Array<any> = [];
  isActiveClass: boolean = false;
  selectedCategoryId: number | undefined;
  loadMoreItems = new EventEmitter();
  screenWidth: any;
  screenHeight: any;
  // items: Array<{ id: string, url: string, title: string }> = [
  //   {
  //     id: '0',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '1',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '2',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '3',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '4',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '5',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '6',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '7',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '8',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '9',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '10',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '0',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '1',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '2',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '3',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '4',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '5',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '6',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '7',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '8',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '9',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '10',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   }, {
  //     id: '0',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '1',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '2',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '3',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '4',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '5',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '6',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '7',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '8',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '9',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '10',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   }, {
  //     id: '0',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '1',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '2',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '3',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '4',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '5',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '6',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '7',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '8',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '9',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '10',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   }, {
  //     id: '0',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '1',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '2',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '3',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '4',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '5',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '6',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '7',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '8',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '9',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '10',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   }, {
  //     id: '0',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '1',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '2',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '3',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '4',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '5',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '6',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '7',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '8',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '9',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '10',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   }, {
  //     id: '0',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '1',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '2',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '3',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '4',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '5',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '6',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '7',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '8',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '9',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '10',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   }, {
  //     id: '0',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '1',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '2',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '3',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '4',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '5',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '6',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '7',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '8',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '9',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '10',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   }, {
  //     id: '0',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '1',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '2',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '3',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '4',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '5',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '6',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '7',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '8',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '9',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '10',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   }, {
  //     id: '0',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '1',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '2',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '3',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '4',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '5',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '6',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '7',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '8',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '9',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '10',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   }, {
  //     id: '0',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '1',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '2',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '3',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '4',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '5',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '6',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '7',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '8',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '9',
  //     url: '../../../assets/schedules/image 2.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  //   {
  //     id: '10',
  //     url: '../../../assets/schedules/image 3.png',
  //     title: 'SO1E86 BOTP movie'
  //   },
  // ];
  videos: any[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  totalItems: any;
  pageSize = 5;
  page = 0;
  throttle = 2;
  distance = 4;
  listArray: Array<any> = [];
  selectedVideo: any;
  selectedIndex: any;
  checked: Array<any> = [];
  scheduleId: any
  queryId: any
  queryDate: any
  apiData: any
  schedule: any;
  searchQuery: any
  matchStart: any;
  matchEnd: any
  fillerData: any = []
  apiSlots: any = []
  // @Output() fillerData: EventEmitter<any[]> = new EventEmitter();



  constructor(
    private router: Router,
    private videoService: VideoService,
    private route: ActivatedRoute,
    private dialog: MatDialog

  ) { }
  // searchData(e: any) {
  //   this.inputSubject.next(e)
  // }
  // inputSubject = new Subject<string>();
  ngOnInit(): void {
    // this.inputSubject.pipe(
    //   debounceTime(500),
    //   distinctUntilChanged()
    // ).subscribe((val) => {
    //   console.log(val, "check val")
    //   this.searchQuery = val
    //   this.getData()

    // })
    this.route.queryParams.subscribe((res) => {
      this.queryId = res['id']
      this.getSingleSchedule(res['id'])
      const dateObj = new Date(res['date']);

      const day = dateObj.getDate().toString().padStart(2, "0");
      const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
      const year = dateObj.getFullYear();

      const formattedDate = `${day}/${month}/${year}`;
      this.queryDate = formattedDate
      let convertedDate = this.convertToISOString(formattedDate)
      this.matchStart = convertedDate.startTime
      this.matchEnd = convertedDate.endTime
    })
    this.getData()
    if (this.scheduleId == undefined) {
    }
    // setTimeout(() => {
    //   console.log(this.apiData, "check api data in schedules component")
    // }, 2000)
  }
  convertToISOString(dateString: any) {
    const [day, month, year] = dateString.split('/').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);
    const startTime = startDate.toISOString();
    const endTime = endDate.toISOString();
    return { startTime, endTime };
  }
  setCurrentPage(e: any) {
    this.currentPage = e
    this.getData()
  }
  // moveElementsPosition(apiObjToMove: any) {
  //   var a = [2, 3, 4, 5];
  //   var elementToMove = a.splice(0, 1)[0];
  //   a.splice(2, 0, elementToMove);
  //   for (var i = 3; i < a.length; i++) {
  //     a[i] = a[i - 1];
  //   }
  // }
  saveSchedule() {
    let tempArr = this.apiData.map((el: any) => {
      const { uniqueId, ...rest } = el
      return rest
    })
    console.log(tempArr, "check tempArr")
    let obj = {
      scheduleVideoData: tempArr
    }
    console.log(this.apiData, 'this.apiData')
    this.videoService.updateSaveSchedule(this.queryId, obj, this.matchStart, this.matchEnd).subscribe((res) => {
      console.log(res, "check response")
      // window.location.reload()
    })
  }
  automaticSchedule() {
    const dialogRef = this.dialog.open(AutomaticFillComponent, {
      width: '550px',
      height: '480px'
    })
    dialogRef.afterClosed()
      .subscribe(async (res) => {
        if (res) {
          console.log(res, "check res in dialog closed")
          this.apiSlots = await res
        }
      })
  }


  onBack() {
    this.router.navigate([`/schedule-date`,], { queryParams: { id: this.queryId } });
  }
  onDataChanged(e: any) {
    // console.log(e,"check e")
    this.apiData = e
  }
  clearAll() {
    this.dragComponent.clearAllSlots()

  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = event.target.innerWidth;
    this.screenHeight = window.innerHeight;
    // console.log('width ', this.screenWidth)
    if (this.screenWidth <= 990) {
      this.pageSize = 5;
    } else if (this.screenWidth > 990) {
      this.pageSize = 4;
    }
  }
  getSingleSchedule(id: any) {
    this.videoService.getSchedule(id)
      .subscribe((res: any) => {
        this.schedule = res.body
        console.log(res.body, "check response")
        // console.log(res.body,"check")
        // this.videos.push(res.body.scheduleData[0].video)
        // let updatedOne = res.body.scheduleData.map((el:any)=>{
        //   const dateObj = new Date(el.startTimestamp);
        //   const hours = ("0" + dateObj.getUTCHours()).slice(-2);
        //   const minutes = ("0" + dateObj.getUTCMinutes()).slice(-2);
        //   const time = hours + ":" + minutes;
        //   return {...el,val:time}
        // })
        // console.log(updatedOne,'updatedOne')
        // this.listArray = updatedOne
        // this.selectedVideo = res.body.scheduleData[0].video
        // this.selectedIndex = 0
      });
  }
  selectVideo(video: any, index: any) {
    console.log(index, "check index")
    this.selectedVideo = video
    this.selectedIndex = index
    console.log(video, 'video selected')
  }
  getData() {
    this.videoService.ownedListPublishedProcessed(this.searchQuery, this.currentPage.toString(), this.itemsPerPage.toString(),)
      .subscribe((res: any) => {
        console.log(res.body.data.totalRecords, "res.body.data.totalRecords")
        this.videos = res.body.data.results;
        this.totalItems = Number(res.body.data.totalRecords);
      });
  }
  getVideoTime(length: any) {
    if (length !== undefined) {
      return length > 3599 ? new Date(length * 1000).toISOString().slice(11, 19) : new Date(length * 1000).toISOString().slice(14, 19);
    }
    return
  }
  // SwiperJS 
  ngAfterContentChecked() {
    if (this.swiper) {
      this.swiper.updateSwiper({});
    }
  }

  swiperSlideChanged(e: any) {
    // console.log('e ', e)
  }

  // onPrevious() {
  //   this.swiper.swiperRef.slidePrev(this.items.length);
  // }

  // onNext() {
  //   this.swiper.swiperRef.slideNext(this.items.length);
  // }
  //END SwiperJS 

  onClickCategory(category: any, event: any, index: number) {
    // this.swiper.on('transitionEnd', function (e) {
    //   if (this.activeIndex == 2) {
    //     document.querySelector(".swiper-slide-active").style.background = 'red';
    //   }
    // });
    // console.log(index)
    this.selectedCategoryId = index;
    // this.dataService.setData(category);
  }

  getActive(index: number) {
    if (this.selectedCategoryId === index) {
      return true;
    }
    return false;
  }

}

@Component({
  selector: 'automatic-fill',
  templateUrl: 'automatic-fill-modal.html',
  styleUrls: ['./schedules.component.scss'],
})
export class AutomaticFillComponent implements OnInit {
  @ViewChild('startTime') startTimeEle!:ElementRef<HTMLInputElement>;

  videos: any = [];
  startTime: any;
  endTime: any;
  date: any;
  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<AutomaticFillComponent>,
    private dataService: DataService,
    private route: ActivatedRoute,
    private videoService: VideoService,
    private toastService: ToastrService
    // @Inject(MAT_DIALOG_DATA) public idEvent: any,
  ) {
    this.route.queryParams.subscribe((res) => {
      // console.log(new Date(res['date']),"this.route.queryParams")
      this.date = res['date']
      // this.id = res['id']
    })
  }
  ngOnInit() {
    console.log(this.videos,"check videos")
   this.startTime = '00:00:00'
   this.endTime = "05:00:00"
  //  this.startTimeEle.nativeElement.value = "00:00"
    this.dataService.getData().subscribe((res) => {
      this.videos = res
      console.log(res, "check res")
    })
  }
  closeVideoModal(){
    this.dialogRef.close()
  }

  selectVideosModal() {
    const dialogRef = this.dialog.open(SelectVideosComponent, {
      width: '550px',
      height: '580px',
      data:this.videos
    })
  }
  startTimeChange(e: any) {
    console.log(e.target.value, "checke")
    this.startTime = e.target.value
  }
  endTimeChange(e: any) {
  
    console.log(e.target.value, "checke")
    this.endTime = e.target.value
  }
  startFilter() {
    const slots = this.fillTimeSlots(this.videos, this.startTime, this.endTime);
    console.log(slots, "check slots")
    this.dialogRef.close(slots)
  }
  //
  check(timestring: any, datestring: any) {
    const dateObj = new Date(datestring);
    const [hours, minutes, seconds] = timestring.split(':');
    dateObj.setHours(hours);
    dateObj.setMinutes(minutes);
    dateObj.setSeconds(seconds);

    const isoString = dateObj.toISOString();
    return isoString
  }
  async fillTimeSlots(videos: any, startTime: any, endTime: any) {
    if (videos.length < 1) {
      const toast = this.toastService.info('Please select videos to schedule')
      setTimeout(() => {
        this.toastService.remove(toast.toastId)
      }, 1500)
      return []
    }
    const startTimeInSeconds = await this.timeToSeconds(startTime);
    const endTimeInSeconds = await this.timeToSeconds(endTime);
    let currentTime = startTimeInSeconds;
    if (currentTime > endTimeInSeconds) {
      const toast = this.toastService.info('Please select a valid time')
      setTimeout(() => {
        this.toastService.remove(toast.toastId)
      }, 1500)
      console.log("current time is greater")
      return []
    }
    let sortedVideos = await videos.sort((a: any, b: any) => this.timeToSeconds(a.length) - this.timeToSeconds(b.length));
    let payload = {
      currentTime: startTimeInSeconds,
      endTimeInSeconds: endTimeInSeconds,
      videos: sortedVideos,
      dateString: this.date,
    }
    let apiSlots: any = [];
    try {
      const response = await firstValueFrom(this.videoService.slotProcessing(1, payload));
      console.log((response as any).body.data, "(response as any).body.data")
      return await (response as any).body.data

    } catch (err) {
      console.log(err, "error")
    }
  }


  timeToSeconds(time: any) {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  secondsToTime(seconds: any) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(remainingSeconds)}`;
  }

  padZero(num: any) {
    return num.toString().padStart(2, '0');
  }
  // const videos = [
  //   { length: '00:00:20' },
  //   { length: '00:00:40' },
  //   { length: '00:01:00' },
  //   { length: '00:00:50' },
  //   { length: '00:20:00' }
  // ];
  // const startTime = '00:00:00';
  // const endTime = '06:00:00';

}
@Component({
  selector: 'select-videos',
  templateUrl: 'select-videos-modal.html',
  styleUrls: ['./schedules.component.scss'],
})
export class SelectVideosComponent implements OnInit, OnDestroy,AfterViewChecked {
  @ViewChildren('checkbox') checkboxes!: QueryList<ElementRef>;
  totItems: any
  videos: any = []
  totalItems: any
  currentPage = 1;
  itemsPerPage = 100;
  selectedVideos: any = []
  // @Output() sendSelectedVideos: EventEmitter<any[]> = new EventEmitter();

  constructor(
    public dialogRef: MatDialogRef<SelectVideosComponent>,
    private videoService: VideoService,
    private dataService: DataService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    // @Inject(MAT_DIALOG_DATA) public idEvent: any,
  ) { }
  ngOnInit() {
    console.log(this.data,"check data")
    console.log(this.data.length,"this.data.length")
    if(this.data.length > 0 ){
      let checkboxes = document.getElementsByClassName('checkBox')
      console.log(checkboxes,"checkboxes")
      this.selectedVideos = [...this.data]
    }else{
      console.log(this.selectedVideos,"check selected videos")
    }
    this.getData()
   
  }
  ngAfterViewChecked(): void {
  }
  checkIfChecked(id:any){
    let videoExists = this.selectedVideos.findIndex((vid:any)=>vid.id == id)
    if(videoExists == -1){
      return false
    }else{
      return true
    }
  }
  closeVideoModal(){
    this.dialogRef.close()
  }

  checkCheckBoxChange(video: any) {
    console.log(video,"check videoi checked")
    this.selectedVideos.push(video)
    // this.dataService.sendData(this.selectedVideos);
  }

  getData() {
    this.videoService.ownedListPublishedProcessed('', this.currentPage.toString(), this.itemsPerPage.toString(),)
      .subscribe((res: any) => {
        console.log(res.body.data.totalRecords, "res.body.data.totalRecords")
        this.totItems = [...Array(Math.ceil(Number(res.body.data.totalRecords) / this.itemsPerPage))].map((el) => el + 1);
        console.log(res.body.data.results, "res.body.data.results")
        this.videos = res.body.data.results;
        this.totalItems = Number(res.body.data.totalRecords);
      });
  }
  selectAll() {
    this.selectedVideos = [...this.videos]
    let checkboxes = document.getElementsByClassName('checkBox')
    console.log(checkboxes, "checkboxes")
    this.checkboxes.forEach(checkbox => {
      (checkbox.nativeElement as HTMLInputElement).checked = true;
    });
    // this.dataService.sendData(this.selectedVideos);
    // this.sendSelectedVideos.emit(this.selectedVideos)
  }
  ngOnDestroy() {
    this.dataService.sendData(this.selectedVideos);
  }
}
