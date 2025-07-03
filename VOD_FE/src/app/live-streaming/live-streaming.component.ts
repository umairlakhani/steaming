import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Inject,
  OnDestroy,
  ViewEncapsulation,
  Input,
  Renderer2,
  ViewChildren,
  QueryList,
  AfterViewInit,
  EventEmitter,
  Output,
} from "@angular/core";
import videojs from "video.js";
import { VideoService } from "../services/video.service";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { SpinnerService } from "src/shared/services/spinner.service";
import { Router } from "@angular/router";
import * as moment from "moment";
import { UserData } from "../guard.guard";
import { UserLiveVideoInfoComponent } from "../broadcaster/broadcaster.component";
import { ToastrService } from "ngx-toastr";
import { FormControl, FormGroup, Validators } from "@angular/forms";
// require('videojs-hls-quality-selector');
// require('videojs-contrib-quality-levels');
@Component({
  selector: "app-live-streaming",
  templateUrl: "./live-streaming.component.html",
  styleUrls: ["./live-streaming.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class LiveStreamingComponent implements OnInit, OnDestroy {
  // @ViewChild('target', { static: true })
  // target!: ElementRef;
  @ViewChild("target")
  target!: ElementRef;
  options!: {
    plugins: {
      videoJsResolutionSwitcher: {
        default: string;
        dynamicLabel: boolean;
      };
    };
    fluid: boolean;
    aspectRatio: string;
    autoplay: boolean;
    sources: {
      src: string;
      type: string;
      label: string;
      res: string;
    }[];
  };
  totItems: any = [];
  totalItems = 0;
  userLiveStreamVideosCount = 0;
  currentPage = 1;
  itemsPerPage = 3;
  searchQuery: any = "";
  streamKey: any = "";
  player: any;
  videos: any[] = [];
  userLiveStreamVideos: any[] = [];
  schedules: any[] = [];
  schedulesData: any[] = [];
  isStreaming: boolean = false;
  @Output() videoUrl = new EventEmitter<any>();
  userData: any = UserData;

  constructor(
    private elementRef: ElementRef,
    private videoService: VideoService,
    private toasterService: ToastrService,
    private renderer: Renderer2,
    public dialog: MatDialog,
    private router: Router
  ) {}
  // ngOnInit(): void {
  //   const videoElement = this.elementRef.nativeElement.querySelector('video');
  //   this.player = videojs(videoElement, {
  //     fluid: true,
  //     aspectRatio: '16:9',
  //     autoplay: true,
  //     sources: [{
  //       src: 'https://live-par-1-abr-cdn.livepush.io/live_abr_cdn/emaIqCGoZw-6/index.m3u8',
  //       // type: 'video/mp4'
  //     }]
  //   }, function onPlayerReady() {
  //
  //   });
  // }

  ngOnInit() {
    // window.videojs as any = videojs
    // Register as a component, so it can be added
    this.fetchKey();

    // this.getVideoData()
    // this.getSchedulesData()
    if (!this.userData.premiumUser) {
      this.router.navigate(["/profile"]);
    }
    this.getData();
  }
  fetchKey() {
    this.videoService.getStreamKey().subscribe((res: any) => {
      this.streamKey = res.body.streamKey;
    });
  }

  getTimePassedForVideo(isoString: any) {
    const targetTime = new Date(isoString) as any;
    const currentTime = new Date() as any;
    const timeDifferenceInMilliseconds = currentTime - targetTime;
    const timeDifferenceInSeconds = Math.floor(
      timeDifferenceInMilliseconds / 1000
    );

    let timeInMinutes = timeDifferenceInSeconds / 60;
    if (timeInMinutes < 0.55) {
      return "just now";
    }
    if (timeInMinutes > 59.99) {
      let hours;
      let min;
      hours = (timeInMinutes / 60).toFixed(0);

      console.log(
        (timeInMinutes / 60).toString(),
        "((timeInMinutes/60)).toString()"
      );
      min = (timeInMinutes / 60)
        .toString()
        .substring(
          (timeInMinutes / 60).toString().indexOf("."),
          (timeInMinutes / 60).toString().length - 1
        );

      let finalMinutes = (Number(min) * 60).toFixed(0);
      if (Number(finalMinutes) < 1) {
        return `${hours} hours ago`;
      } else {
        return `${hours} hours and ${finalMinutes} minutes ago`;
      }
    } else {
      return `${(timeDifferenceInSeconds / 60).toFixed(0)} minutes ago`;
    }
  }

  async apiCall() {
    let dialogRef = this.dialog.open(liveStreamKeyModalComponent, {
      width: "550px",
      // height: '590px'
      height: "40vh",
      data: { streamKey: this.streamKey },
    });

    dialogRef.beforeClosed().subscribe((result) => {
      console.log(result, "result");

      if (result !== undefined) {
        let time = `${Date.now()}`;
        result = { ...result, time: time };
        this.videoService.generateStreamKey(result).subscribe(
          (res: any) => {
            this.streamKey = res.body.streamKey;
            let toast = this.toasterService.success(
              `Stream Key: ${this.streamKey}`
            );
            setTimeout(() => {
              this.toasterService.remove(toast.toastId);
            }, 2000);
          },
          (error: any) => {
            let toast = this.toasterService.error(error);
            setTimeout(() => {
              this.toasterService.remove(toast.toastId);
            }, 2000);
          }
        );
      }
    });
  }
  getData() {
    // this.videoService.ownedListPublished(this.currentPage, this.itemsPerPage,this.searchQuery)
    this.videoService
      .liveStreamVideos(this.searchQuery, this.currentPage, this.itemsPerPage)
      .subscribe((res: any) => {
        this.totalItems = res.body.data.totalRecords;

        this.totItems = [
          ...Array(
            Math.ceil(Number(res.body.data.totalRecords) / this.itemsPerPage)
          ),
        ].map((el) => el + 1);

        this.videos = res.body.data.results;

        // let main = document.getElementById("streaming-videos")
        //
      });
    this.videoService
      .userLiveStreamVideos(
        this.searchQuery,
        this.currentPage,
        this.itemsPerPage
      )
      .subscribe((res) => {
        console.log(
          (res as any).body.data.results,
          "check userlivestream records"
        );
        this.userLiveStreamVideos = (res as any).body.data.results;
        this.userLiveStreamVideosCount = (res as any).body.data.totalRecords;
        // this.userLiveStreamVideos = res.body.data
      });
  }
  navigateToVideoStream() {
    if (this.videos.length < 1) {
      return;
    }
    this.router.navigate(["/streaming"], { queryParams: { type: "video" } });
  }
  navigateToUserStream() {
    if (this.userLiveStreamVideos.length < 1) {
      return;
    }

    this.router.navigate(["/streaming"], { queryParams: { type: "user" } });
  }
  onPageChange(e: any) {
    this.currentPage = e;
  }
  handleNumClick(val: any) {
    this.currentPage = val;
    this.getData();
  }
  paginateForward() {
    if (this.totItems.length == this.currentPage) {
      return;
    }
    this.currentPage = this.currentPage + 1;
    this.getData();
  }
  paginateBack() {
    if (this.currentPage == 1) {
      return;
    }
    this.currentPage = this.currentPage - 1;
    this.getData();
  }
  playVid(videoId: any) {
    this.router.navigate([`/videos/live/${videoId}`]);
  }
  // ngOnDestroy(): void {
  //   this.players.forEach((player) => {
  //     player.dispose();
  //   });
  // }
  liveChat() {
    this.router.navigateByUrl("/broadcast");
  }
  ngOnDestroy() {
    if (this.player) {
      this.player.dispose();
    }
  }
  // openStreamingVideoModal(url: any) {
  //   this.videoUrl.emit(url)
  //   const dialogRef = this.dialog.open(StreamingVideoModalComponent, {
  //     width: '550px',
  //     height: '330px',
  //     data: url
  //   })
  // }
  getVideoData() {
    this.videoService.ownedListPublished().subscribe((res: any) => {
      this.videos = res.body.data.results;
    });
  }
  // getSchedulesData() {
  //   this.videoService.getScheduleData().subscribe((res) => {
  //     this.schedulesData = (res as any).body.data

  //   })
  // }
  isVideoOnAir(videoId: string): boolean {
    const currentTimestamp = Date.now() / 1000;
    for (const schedule of this.schedulesData) {
      const startTimestamp = new Date(schedule.startTimestamp).getTime() / 1000;
      const endTimestamp = new Date(schedule.endTimestamp).getTime() / 1000;
      if (
        startTimestamp <= currentTimestamp &&
        currentTimestamp <= endTimestamp &&
        schedule.videoId === videoId
      ) {
        return true;
      }
    }

    return false;
  }
  // isVideoOnAir(videoId: string): boolean {
  //   const currentTimestamp = Date.now() / 1000;
  //   for (const schedule of this.schedules) {
  //       const startTimestamp = new Date(schedule.startTimestamp).getTime() / 1000;
  //       const endTimestamp = new Date(schedule.endTimestamp).getTime() / 1000;
  //       if (startTimestamp <= currentTimestamp && currentTimestamp <= endTimestamp && schedule.videoId === videoId) {
  //         return true;
  //       }
  //   }
  //   return false;
  // }
}

@Component({
  selector: "app-ad-video-modal",
  templateUrl: "./streaming-modal.component.html",
  styleUrls: ["./live-streaming.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class StreamingVideoModalComponent implements OnInit {
  @ViewChild("target", { static: true })
  target!: ElementRef;
  options!: {
    fluid: boolean;
    aspectRatio: string;
    autoplay: boolean;
    sources: {
      src: string;
      type: string;
    }[];
  };
  player: any;
  // ad:any = {}
  url: any = "";
  open: boolean = false;
  constructor(
    public dialogRef: MatDialogRef<StreamingVideoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public videoUrl: any // private adSpeedService: AdSpeedService
  ) {}
  ngOnInit(): void {
    this.url = this.videoUrl;
    this.open = true;

    this.player = videojs(
      this.target.nativeElement,
      {
        fluid: true,
        aspectRatio: "16:9",
        autoplay: true,
        sources: [
          {
            src: this.videoUrl,
            // src: 'https://live-par-1-abr-cdn.livepush.io/live_abr_cdn/emaIqCGoZw-6/index.m3u8'
            // src: 'https://hls-video-storage.nyc3.digitaloceanspaces.com/hls-video-storage/videos/360p/f896b65735fefec6c3a113b15.m3u8'
          },
        ],
      },
      function onPlayerReady(this: any) {}
    );
  }

  ngOnDestroy(): void {
    if (this.player) {
      this.player.dispose();
    }
  }
}
@Component({
  selector: "live-streamKey-modal",
  templateUrl: "./live-streamkey-modal.html",
  styleUrls: ["./live-streaming.component.scss"],
})
export class liveStreamKeyModalComponent {
  videoInfo = new FormGroup({
    title: new FormControl("", [Validators.required]),
    description: new FormControl("", [Validators.required]),
    recorded: new FormControl(false),
  });
  showAlert: boolean = false;

  constructor(
    private videoService: VideoService,
    public dialogRef: MatDialogRef<liveStreamKeyModalComponent>,
    private toasterService: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  copyToClipboard() {
    const el = document.createElement("textarea");
    el.value = this.data.streamKey;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
    }, 2000);
  }

  createLiveStreamInfo() {
    Object.values(this.videoInfo.controls).forEach((control: any) => {
      control.markAsDirty();
    });
    if (!this.videoInfo.valid) {
      console.log("videoInfo is invalid");
      return;
    } else {
      console.log(this.videoInfo.value, "this.videoInfo.controls.Title");
      this.dialogRef.close(this.videoInfo.value);
    }
  }
}
