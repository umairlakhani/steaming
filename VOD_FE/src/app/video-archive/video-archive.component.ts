import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { VideoService } from "../services/video.service";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ToastrService } from "ngx-toastr";
import videojs from "video.js";
import { Router } from "@angular/router";
import { UserService } from "../services/user.service";
import { environment } from "src/environments/environment";
import { io } from "socket.io-client";
import { ChannelService } from "../services/channel.service";

@Component({
  selector: "app-video-archive",
  templateUrl: "./video-archive.component.html",
  styleUrls: ["./video-archive.component.scss"],
})
export class VideoArchiveComponent implements OnInit {
  video: any = {};
  videos: any[] = [];
  currentPage = 1;
  itemsPerPage = 6;
  totalItems = 0;
  searchQuery = "";
  socket!: any;
  @Output() idEvent = new EventEmitter<any>();
  public baseUrl = environment.backendUrl;

  constructor(
    public dialog: MatDialog,
    private videoService: VideoService,
    private http: HttpClient,
    private toasterService: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.inputSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        console.log(value);
        this.searchQuery = value;
        this.getData();
        // perform any other desired action with the input value
      });
    console.log(this.router, "routern");
    /*this.videoService.ownedListArchived()
            .pipe(
                map((res: any) => res.body.data.results),
                tap((res: any) => {
                    res.forEach((element: any) => {
                        element.createdAt = new Date(element.createdAt).toLocaleDateString()
                    })
                })
            )
            .subscribe((result: any) => {
                this.videos = result;
            });*/
    this.getData();
    this.connectSocket();
  }
  connectSocket() {
    // Close the existing socket if it exists
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    // Function to attempt socket connection
    const tryConnect = (attemptsLeft: number) => {
      return new Promise<void>((resolve, reject) => {
        // Create a new socket instance
        this.socket = io(environment.socketUrl, {
          autoConnect: true,
          transports: ["websocket", "polling"],
        }).connect();

        let messageReceived = false;

        this.socket.on("connect", function (evt: any) {
          console.log("socket.io connected()");
        });
      });
    };

    // Start the initial connection attempt with a maximum of 5 retries
    return tryConnect(5);
  }
  openDialog() {
    const dialogRef = this.dialog.open(VideoUploadComponent, {
      width: "550px",
      // height: '590px'
      height: "80vh",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        /*this.videoService.ownedListArchived().subscribe((result: any) => {
                    this.videos = result.body.data.results;
                });*/
        this.getData();
      }
    });
  }

  openVideoInfo(video: any) {
    if (!video.processing) {
      this.router.navigate([`/videos/${video.videoId}`]);
    } else {
      let toast = this.toasterService.show(
        "You can watch your video after the processing is done"
      );
      setTimeout(() => {
        this.toasterService.remove(toast.toastId);
      }, 1500);
    }
    // console.log(videoUrl, "check id")
    // this.idEvent.emit(videoUrl)
    // const dialogRef = this.dialog.open(VideoinfoComponent, {
    //     width: '550px',
    //     height: '450px',
    //     data: videoUrl
    // })
    // dialogRef.componentInstance.
    // console.log("working")
  }

  editVideo(data: any) {
    const dialogRef = this.dialog.open(VideoUploadComponent, {
      width: "550px",
      height: "80vh",
      data: data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        /*this.videoService.ownedListArchived().subscribe((result: any) => {
                    this.videos = result.body.data.results;
                });*/
        this.getData();
      }
    });
  }

  publishVideo(video: any) {
    console.log(video, "check video");
    if (video.type == "PRIVATE") {
      let toast = this.toasterService.info("Please public your video first");
      setTimeout(() => {
        this.toasterService.remove(toast.toastId);
      }, 1500);
      return;
    }
    if (video.processing) {
      let toast = this.toasterService.info(
        "You cannot publish your video till its processing is completed"
      );
      setTimeout(() => {
        this.toasterService.remove(toast.toastId);
      }, 1500);
      return;
    } else {
      if (!video.published) {
        this.videoService
          .archiveVideo({
            id: video.id,
            archive: true,
            published: true,
          })
          .subscribe((result: any) => {
            /*this.videoService.ownedListArchived().subscribe((result: any) => {
                        this.videos = result.body.data.results;
                    });*/
            this.getData();
          });
      }
    }
  }

  removeVideo(id: any) {
    const dialogRef = this.dialog.open(DeleteConfirmationComponent, {
      width: "350px",
      data: {
        title: "Delete video",
        text: "Would you like to delete this video?",
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.videoService
          .removeVideo({
            id: id,
            deleted: true,
          })
          .subscribe((result: any) => {
            /*this.videoService.ownedListArchived().subscribe((result: any) => {
                        this.videos = result.body.data.results;
                    });*/
            this.getData();
          });
      }
    });
  }
  archiveVideo(id: string) {
    this.videoService
      .archiveVideo({
        id: id,
        archive: true,
        published: false,
      })
      .subscribe((result: any) => {
        this.getData();
      });
  }
  changeStatus(id: any, status: any) {
    console.log(id, "id");
    console.log(status, "status");
    this.videoService.changeStatus(Number(id), status).subscribe((res) => {
      let index = this.videos.findIndex((vid) => vid.id == id);
      if (index != -1) {
        if (this.videos[index].status == "PUBLIC") {
          this.videos[index].status = "PRIVATE";
        } else {
          this.videos[index].status = "PUBLIC";
        }
      }
      this.archiveVideo(id);
      console.log(res);
      // window.location.reload()
    });
  }

  getAllVideosJson() {
    this.videoService.ownedListCompleteArchived().subscribe((res: any) => {
      let videoJson = res.body.data.results;

      console.log(videoJson, "videoJson");

      const blob = new Blob([JSON.stringify(videoJson, null, 2)], {
        type: "application/json",
      });
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = "roku-channel-feed-archived.json";
      downloadLink.click();
    });
  }
  // getVideoTime(length: any) {
  //     console.log(length,"length")
  //     return length > 3599 ? new Date(length * 1000).toISOString().slice(11, 19) : new Date(length * 1000).toISOString().slice(14, 19);
  // }
  downloadVideo(url: any, title: any) {
    if (!url) {
      this.toasterService.error('Download URL not available');
      return;
    }
    
    // Clean the title for use as filename
    const cleanTitle = title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'video';
    const fileName = `${cleanTitle}.mp4`;
    
    try {
      // For direct video URLs, try to download directly
      if (url.startsWith('http')) {
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.toasterService.success('Download started');
      } else {
        // For relative URLs or other formats, try to construct full URL
        const fullUrl = url.startsWith('/') ? `${this.baseUrl}${url}` : url;
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = fileName;
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.toasterService.success('Download started');
      }
    } catch (error) {
      console.error('Download error:', error);
      this.toasterService.error('Failed to start download. Please try again.');
    }
  }
  downloadFile(url: string, fileName: string): void {
    // Send a GET request to the file URL
    this.http
      .get(
        "https://temp-video.nyc3.digitaloceanspaces.com/temp-video/b3d4cbc257fba314066d00b01",
        { responseType: "blob" }
      )
      .subscribe((response: Blob) => {
        // Create a download link element
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(response);

        // Set the download attribute and file name
        link.setAttribute("download", fileName);

        // Simulate a click on the download link
        link.click();

        // Clean up the object URL after the download
        window.URL.revokeObjectURL(link.href);
      });
  }
  getData() {
    /*const params = {
            page: this.currentPage.toString(),
            itemsPerPage: this.itemsPerPage.toString()
        };*/
    this.videoService
      .ownedListArchived(
        this.currentPage.toString(),
        this.itemsPerPage.toString(),
        this.searchQuery
      )
      .subscribe((res: any) => {
        console.log(res.body.data, "check total records");
        this.videos = res.body.data.results;
        this.totalItems = res.body.data.totalRecords;
        this.videos.forEach((video) => {
          if (video.processing) {
            video.progress=8
            this.socket.on(`checkProgressResponse${video.videoId}`,(data:any)=>{
                video.progress=data.progress
            })
            
            this.socket.on(`videoProgress${video.videoId}`,(data:any)=>{
                console.log("progress data",data);
                
                 // Find the index of the updated video in the videos array
              const index = this.videos.findIndex(
                (video) => video.videoId === data.videoId
              );
                if (index !== -1) {
                    this.videos[index].progress = data.progress;
                    console.log("progress updated:", data);
                  } else {
                    console.log("Video not found in the current list.");
                  }
            })
            this.socket.on(`videoProcessed${video.videoId}`, (data: any) => {
              console.log("video processed",data);
              // Find the index of the updated video in the videos array
              const index = this.videos.findIndex(
                (video) => video.videoId === data.videoId
              );

              // If the video is found, update it
              if (index !== -1) {
                this.videos[index] = data;
                this.videos[index].processedSuccessfully=true
                    setTimeout(()=>{
                        this.videos[index].processedSuccessfully=false

                    },3000)
                console.log("Video updated:", data);
              } else {
                console.log("Video not found in the current list.");
              }
            });
          }
        });
      });

    /*this.http.get('https://example.com/api/data', { params }).subscribe((response: any) => {
          this.data = response.data;
          this.totalItems = response.totalItems;
        });*/
  }

  onPageChange(event: any) {
    console.log({ event });
    this.currentPage = event;
    // this.itemsPerPage = event.pageSize;
    this.getData();
  }

  inputSubject = new Subject<string>();

  SearchData(target: any) {
    this.inputSubject.next(target.value);
    /*this.searchQuery = target.value || ''
        debounceTime(500)
        this.getData();*/
  }
}

@Component({
  selector: "video-info",
  templateUrl: "video-info.html",
  encapsulation: ViewEncapsulation.None,
})
export class VideoinfoComponent implements OnInit {
  @ViewChild("target", { static: true })
  target!: ElementRef;
  options!: {
    fluid: boolean;
    aspectRatio: string;
    autoplay: boolean;
    sources: {
      src: string;
      type: string;
      label: string;
    }[];
  };
  player: any;
  video: any = {};
  open: boolean = true;
  constructor(
    public dialogRef: MatDialogRef<VideoinfoComponent>,
    @Inject(MAT_DIALOG_DATA) public idEvent: any,
    private videoService: VideoService
  ) {}
  ngOnInit(): void {
    let main = document.getElementById("vid-parent");
    console.log(this.idEvent, " this.idEvent");
    // this.videoService.getVideo(this.idEvent).subscribe((result:any)=>{
    // this.video = result.data.data
    this.open = true;
    // console.log(result,"result")
    // console.log(result.data.data.url360P,"result.data.data.url360P")
    console.log(main, "check video-parent");
    const ele = document.createElement("video");
    ele.classList.add("video-js");
    ele.classList.add("video-set");
    ele.controls = true;
    ele.autoplay = false;
    ele.muted = true;
    ele.playsInline = true;
    ele.preload = "none";
    ele.setAttribute("data-setup", "{}");
    main?.appendChild(ele);

    this.player = videojs(
      ele,
      {
        fluid: true,
        // aspectRatio: '16:9',
        autoplay: true,
        sources: [
          {
            // src: result.data.data.url360P,
            src: this.idEvent,
            label: "360p",
          },
        ],
      },
      function onPlayerReady(this: any) {
        console.log("onPlayerReady", this);
      }
    );

    // })
  }
  // getVideoTime(length: any) {
  //     console.log(length,"length")
  //     return length > 3599 ? new Date(length * 1000).toISOString().slice(11, 19) : new Date(length * 1000).toISOString().slice(14, 19);
  // }

  // getVideoTime(length: any) {
  //     return length > 3599 ? new Date(length * 1000).toISOString().slice(11, 19) : new Date(length * 1000).toISOString().slice(14, 19);
  // }
}

@Component({
  selector: "video-upload",
  templateUrl: "video-upload.html",
  styleUrls: ["./video-upload.component.scss"],
})
export class VideoUploadComponent {
  @ViewChild("videoUpload") videoUpload?: ElementRef;
  @ViewChild("videoPlayer") videoPlayer?: ElementRef;

  selectedFile: File | undefined;
  isVideoLoaded: boolean = false;
  videoLength: any;
  videoError = false;
  display: "block" | "hidden" = "block";
  userData: any = this.userService.getTokenData();
  editModal = false;
  channels: any[] = [];

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.videoError = false;
    let length = this.loadVideo();
    //    console.log(length,"check length")
  }

  triggerClick() {
    this.videoUpload?.nativeElement.click();
  }

  videoUploadForm = new FormGroup({
    Title: new FormControl("", [Validators.required]),
    description: new FormControl("", [Validators.required]),
    // adBreaks: new FormControl('', [Validators.required]),
    type: new FormControl("", [Validators.required]),
    preRoll: new FormControl(false, [Validators.required]),
    postRoll: new FormControl(false, [Validators.required]),
    midRoll: new FormControl(false, [Validators.required]),
    intervalType: new FormControl("", [Validators.required]),
    interval: new FormControl(null, [Validators.required]),
    channelId: new FormControl(null, [Validators.required]),
  });

  constructor(
    private videoService: VideoService,
    public dialogRef: MatDialogRef<VideoUploadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toasterService: ToastrService,
    private userService: UserService,
    private channelService: ChannelService
  ) {
    if (this.data) {
      this.editModal = true;
      console.log(this.data, "check data");
      let videoFileField = this.videoUploadForm.get("video");
      videoFileField?.clearValidators();
      videoFileField?.updateValueAndValidity();
      this.videoUploadForm.setValue({
        Title: data.Title || "",
        description: data.description || "",
        // adBreaks: data.adBreaks?.join(';') || '',
        type: data.type || "",
        preRoll: data.preRoll || "",
        postRoll: data.postRoll || "",
        midRoll: data.midRoll || "",
        intervalType: data.midRollConfig.intervalType || "",
        interval: data.midRollConfig.interval || "",
        channelId: data.channelId || "",
      });
    }
    console.log(this.userData, "userData");

    this.channelService.getChannel().subscribe((channels: any) => {
      this.channels = channels.data.results;
      console.log(this.channels, "check channels");
    });
  }

  loadVideo() {
    if (this.videoPlayer && this.selectedFile) {
      const videoUrl = URL.createObjectURL(this.selectedFile);
      console.log(videoUrl);
      this.videoPlayer.nativeElement.src = videoUrl;
      this.videoPlayer.nativeElement.load();
      this.isVideoLoaded = false;

      this.videoPlayer.nativeElement.addEventListener(
        "loadedmetadata",
        this.onVideoMetadataLoaded.bind(this)
      );
    }
  }

  getVideoDuration() {
    if (this.videoPlayer && this.isVideoLoaded) {
      const durationInSeconds = Math.floor(
        this.videoPlayer.nativeElement.duration
      );
      console.log("Video duration:", durationInSeconds);
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      const seconds = Math.floor(durationInSeconds % 60);
      const formattedHours = String(hours).padStart(2, "0");
      const formattedMinutes = String(minutes).padStart(2, "0");
      const formattedSeconds = String(seconds).padStart(2, "0");
      this.videoLength = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
      console.log(
        `${formattedHours}:${formattedMinutes}:${formattedSeconds}`,
        "`${formattedHours}:${formattedMinutes}:${formattedSeconds}`"
      );
    }
  }
  onVideoMetadataLoaded() {
    this.isVideoLoaded = true;
    this.getVideoDuration();

    this.videoPlayer?.nativeElement.removeEventListener(
      "loadedmetadata",
      this.onVideoMetadataLoaded.bind(this)
    );
  }

  createVideo() {
    if (!this.videoUploadForm.value.midRoll) {
      const intervalType = this.videoUploadForm.get("intervalType");
      const interval = this.videoUploadForm.get("interval");
      intervalType?.clearValidators();
      interval?.clearValidators();
      intervalType?.updateValueAndValidity();
      interval?.updateValueAndValidity();
    }

    Object.values(this.videoUploadForm.controls).forEach((control: any) => {
      control.markAsDirty();
    });
    if (!this.videoUploadForm.valid) {
      console.log("videoUploadForm is invalid");
      return;
    }

    const formData = new FormData();
    console.log(this.selectedFile, "this.selectedFile");
    if (!this.selectedFile) {
      console.log("no file selected");
      this.videoError = true;
      return;
    }

    formData.append("video", this.selectedFile ? this.selectedFile : "");
    this.display = "hidden";
    console.log(this.userData, "this.userData");
    this.dialogRef.close(true);
    let waitToast = this.toasterService.info("Please wait ...");
    this.videoService.uploadVideoFile(formData).subscribe((videoFile: any) => {
      this.toasterService.remove(waitToast.toastId);
      const toast = this.toasterService.info(
        "Your video is being uploaded please wait"
      );
      console.log(videoFile, "check videoFile");
      let payload: any = this.videoUploadForm.value;
      payload.adBreaks = payload.adBreaks?.split(";");
      payload.videoId = videoFile.body.data.newFilename;
      payload.size = videoFile.body.data.size;
      payload.length = this.videoLength;
      payload.bucketId = videoFile.body.data.bucketId;
      payload.videoUrl = videoFile.body.data.videoUrl;
      console.log(videoFile.body.data.videoUrl, "videoFile.body.data.videoUrl");
      let newPayload = {
        ...payload,
        profile_image: this.userData.profileImage,
      };
      console.log(newPayload, "check newPayload");
      console.log("Video file uploaded successfully!");

      this.videoService.uploadVideo(newPayload).subscribe((result) => {
        console.log(result);
        this.toasterService.remove(toast.toastId);
        console.log("Video uploaded successfully!");
        window.location.reload();
      });
    });
  }
  editVideo() {
    Object.values(this.videoUploadForm.controls).forEach((control: any) => {
      control.markAsDirty();
    });
    if (!this.videoUploadForm.valid) {
      console.log("videoUploadForm is invalid");
      return;
    }
    // const formData = new FormData();
    // if(!this.selectedFile){
    //     console.log("no file selected")
    //     this.videoError = true
    //     return;
    // }
    // formData.append('video', this.selectedFile ? this.selectedFile : '')
    // let payload: any = this.videoUploadForm.value;
    // payload.adBreaks = payload.adBreaks?.split(';');
    // payload.id = this.data.id;
    // this.videoService.editVideo(payload).subscribe(result => {
    //     this.dialogRef.close(true);
    //     console.log('Video edited successfully!');
    // });
    const toast = this.toasterService.info(
      "Your video is being uploaded please wait"
    );
    this.dialogRef.close(true);

    // this.videoService.uploadVideoFile(formData).subscribe((videoFile: any) => {
    let payload: any = this.videoUploadForm.value;
    payload.id = this.data.id;
    payload.adBreaks = payload.adBreaks?.split(";");
    // payload.videoId = videoFile.body.data.newFilename;
    // payload.size = videoFile.body.data.size;
    // payload.length = this.videoLength;

    console.log("Video file edited successfully!");
    this.videoService.editVideo(payload).subscribe((result) => {
      this.toasterService.remove(toast.toastId);
      console.log("Video edited successfully!");
    });
    // });
  }
}

@Component({
  selector: "delete-confirmation",
  templateUrl: "delete-confirmation.html",
  styleUrls: ["./video-archive.component.scss"],
})
export class DeleteConfirmationComponent {
  constructor(
    private videoService: VideoService,
    public dialogRef: MatDialogRef<DeleteConfirmationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
