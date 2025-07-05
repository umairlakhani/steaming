import {
  Component,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
  OnInit,
  OnChanges,
  SimpleChanges,
  Renderer2,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Socket, SocketIoModule, SocketIoConfig } from "ngx-socket-io";
import io from "socket.io-client";
import * as mediaSoup from "mediasoup-client";
import { VideoService } from "../services/video.service";
import { environment } from "src/environments/environment";
import { ToastrService } from "ngx-toastr";
import { SpinnerService } from "src/shared/services/spinner.service";
import videojs from "video.js";
import "videojs-contrib-quality-levels";
import "videojs-contrib-ads";
import "videojs-ima";
import { UserService } from "../services/user.service";
@Component({
  selector: "app-viewer",
  templateUrl: "./viewer.component.html",
  styleUrls: ["./viewer.component.scss"],
})
export class ViewerComponent implements OnDestroy {
  public chatClosed: EventEmitter<void> = new EventEmitter<void>();
  userId: any = localStorage.getItem("userId");
  @ViewChild("target", { static: true })
  target!: ElementRef;
  @ViewChild("video") videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild("enableAudioButton")
  enableAudioButton!: ElementRef<HTMLButtonElement>;
  timePassed: string = "00:00:00";
  liveStreamId: any;
  startTime:any;
  liveStreamKey: any;
  liveStreamKeyUrl: any;
  isRTMPStream: boolean = false; // Add this line
  player: any;
  userData: any = this.userService.getTokenData();
  // constructor(
  //   private route: ActivatedRoute,
  //   private router: Router,
  //   private videoService: VideoService,
  //   private userService: UserService,
  //   private toasterService: ToastrService,
  //   private spinnerService: SpinnerService,
  //   private rendered: Renderer2
  // ) {
  //   this.route.params.subscribe((res) => {
  //     this.liveStreamId = (res as any).id.split("_")[0];
  //     this.liveStreamKey = (res as any).id.split("_")[1];
  //     this.liveStreamKeyUrl = `${environment.RTMP_URL}/${this.liveStreamKey}/index.m3u8`;
  //     console.log((res as any).id, "chec params");
  //   });
  // }

constructor(
  private route: ActivatedRoute,
  private router: Router,
  private videoService: VideoService,
  private userService: UserService,
  private toasterService: ToastrService,
  private spinnerService: SpinnerService,
  private rendered: Renderer2
) {
  this.route.params.subscribe((res) => {
    console.log("=== ROUTE DEBUG ===");
    console.log("Route param received:", (res as any).id);
    
    const routeParam = (res as any).id;

    
    // Check if the ID contains an underscore (old format) or not
    if (routeParam.includes('_')) {
      // Format: streamId_streamKey
      this.liveStreamId = routeParam.split("_")[0];
      this.liveStreamKey = routeParam.split("_")[1];
      this.isRTMPStream = true;
    } else {
      // Single parameter - need to determine if it's a stream ID or stream key
      this.liveStreamId = routeParam;
      
      // Check if it looks like a stream key (shorter, alphanumeric) vs stream ID (longer, numeric)
      if (routeParam.length <= 12 && /^[a-zA-Z0-9]+$/.test(routeParam)) {
        // Looks like a stream key (e.g., "8f1SGyR84J")
        this.liveStreamKey = routeParam;
        this.isRTMPStream = true;
        console.log("Detected RTMP stream key:", this.liveStreamKey);
      } else {
        // Looks like a stream ID (e.g., "31751583506054")
        this.liveStreamKey = null;
        this.isRTMPStream = false;
        console.log("Detected WebRTC stream ID:", this.liveStreamId);
      }
    }
    
    console.log("Parsed liveStreamId:", this.liveStreamId);
    console.log("Parsed liveStreamKey:", this.liveStreamKey);
    console.log("Is RTMP stream:", this.isRTMPStream);
    
    // Only set the RTMP URL if this is an RTMP stream
          // this.liveStreamKeyUrl = `${environment.RTMP_URL}/8f1SGyR84J/index.m3u8`;
    if (this.isRTMPStream && this.liveStreamKey) {
      this.liveStreamKeyUrl = `${environment.RTMP_URL}/${this.liveStreamKey}/index.m3u8`;
      console.log("RTMP URL:", this.liveStreamKeyUrl);
    } else {
      console.log("WebRTC stream - no RTMP URL needed");
      this.liveStreamKeyUrl = null;
    }
  });
}

  private audioTrack: MediaStreamTrack | null = null;
  private videoTrack: MediaStreamTrack | null = null;
  private isVideoMuted: boolean = false;
  @ViewChild("remote_container") remote_container!: ElementRef<HTMLDivElement>;
  @ViewChild("state_span") state_span!: ElementRef<HTMLSpanElement>;
  @ViewChild("disconnect_button")
  disconnect_button!: ElementRef<HTMLButtonElement>;
  @ViewChild("subscribe_button")
  subscribe_button!: ElementRef<HTMLButtonElement>;

  localStream = null;
  clientId = null;
  device = null;
  consumerTransport = null;
  videoConsumer = null;
  elapsedTime: number = 0;
  audioConsumer = null;
  latitude: any = null;
  longitude: any = null;
  platform: any;
  videoRendered: boolean = false;
  zoneTag: any;
  // ---- TODO ----
  //  DONE - (check can consumer for subcribe) --> subscribe before publish
  //  DONE - audio track
  //  - multiple rooms

  // =========== socket.io ==========
  socket!: any;
  async getLocation() {
    console.log("getting location");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(position, "position");

          this.latitude = position.coords.latitude.toString();
          this.longitude = position.coords.longitude.toString();
          this.streamLive();
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            console.error("User denied location access");
            let toast = this.toasterService.warning(
              "Location access denied! Please enable the location"
            );
            setTimeout(() => {
              this.toasterService.remove(toast.toastId);
            }, 2500);
          } else {
            console.error(error);
          }
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }
  ngOnInit(): void {
    const userAgent = window.navigator.platform.toLowerCase();
    this.platform = userAgent;
    this.getLocation();
  }
  // async streamLive(): Promise<void> {
  //   // this.spinnerService.setLoading(true)
  //   if (this.userData.premiumUser) {
  //     this.videoService.getLiveStreamingRecord(this.liveStreamId).subscribe((res:any) => {
  //       console.log(res,"streamres");
  //       this.startTime=res.body.startTime
  //       console.log(this.startTime);
        
        
  //     })
  //     this.videoService.getUserZoneTag(this.liveStreamId).subscribe((res) => {
  //       console.log((res as any).body.data.tagUrl, "check res");
  //       this.zoneTag = (res as any).body.data.tagUrl;
  //       this.updateButtons();
  //       // this.subscribe()
  //       // let adTagUrl = 'https://g.adspeed.net/ad.php?do=vast&zid=124405&oid=28121&wd=-1&ht=-1&vastver=3&cb=1696931387378 https://g.adspeed.net/ad.php?do=vast&zid=124405&oid=28121&wd=-1&ht=-1&vastver=3&cb=1696931387378'
  //       console.log(this.zoneTag, "this.zoneTagthis.zoneTag");
  //       let adTagUrl = (res as any).body.data.tagUrl;
  //       // let adTagUrl = ''
  //       const imaOptions = {
  //         id: "vid",
  //         adTagUrl: adTagUrl,
  //         adsPreroll: true,
  //         adsMidroll: true,
  //         adsPostroll: true,
  //       };
  //       this.player = videojs(
  //         this.target.nativeElement,
  //         {
  //           fluid: true,
  //           aspectRatio: "16:9",
  //           autoplay: true,
  //           sources: [
  //             {
  //               // src: "https://ed8c9b64-2079-4d32-bea7-af4167e08d5a.nyc3.digitaloceanspaces.com/ed8c9b64-2079-4d32-bea7-af4167e08d5a/videos/360p/07172baded933a8c0f5314602.m3u8?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=DO00KPNX4XJ26QDZXVTL%2F20231012%2Fnyc3%2Fs3%2Faws4_request&X-Amz-Date=20231012T093243Z&X-Amz-Expires=3600&X-Amz-Signature=076d07c0ab1a0295f86a5e492811bec5beedf6d1b22294aee59cbe3c439f5f05&X-Amz-SignedHeaders=host&x-id=GetObject",
  //               src: `${this.liveStreamKeyUrl}`,
  //               type: "application/x-mpegURL",
  //             },
  //           ],
  //         },
  //         () => {
  //           console.log("Player ready");
  //           this.player.ready(() => {
  //             const customTimeDisplay = document.createElement('div');
  //             customTimeDisplay.className = 'custom-time-display vjs-time-control vjs-control';
        
  //             const controlBar = this.player.controlBar.el();
  //             controlBar.appendChild(customTimeDisplay);
        
  //             // Update total duration every second
  //             setInterval(() => {
  //               this.updateTotalDuration(this.player, customTimeDisplay);
  //             }, 1000);
  //           });
          
        
  //           if (adTagUrl != "" || this.liveStreamKey) {
  //             this.player.ima(imaOptions);
  //           } else {
  //             this.player.options_.sources = [];
  //             let ele = document.querySelector(".vjs-error-display");
  //             this.rendered.setStyle(ele, "display", "none");
  //             !this.liveStreamKey ? this.subscribe() : null;
  //           }
  //         }
  //       );

  //       const retryOnError = () => {
  //         console.log("Error occurred. Retrying...");
  //         if (this.liveStreamKey) {
  //           setTimeout(() => {
  //             this.player.src({
  //               src: this.player.src(), // Used the same source as before
  //               type: "application/x-mpegURL",
  //             });
  //             this.player.play();
  //           }, 5000);
  //         }
  //       };
  //       if (this.liveStreamKey) {
  //         this.player.on("error", retryOnError);
  //       }

  //       if (adTagUrl != "") {
  //         this.player.on("error", retryOnError);
  //         this.player.one("loadedmetadata", () => {
  //           console.log(this.player, "check this.player");
  //           console.log("meta data loaded");
  //           // this.player.ima.requestAds();
  //           // this.player.play()
  //         });

  //         this.player.on("ads-manager", (event: any) => {
  //           console.log("ads-manager event:", event);

  //           const adsManager = event.adsManager;

  //           if (adsManager) {
  //             const googleNamespace: any = (window as any)["google"];

  //             if (googleNamespace && googleNamespace.ima) {
  //               adsManager.addEventListener(
  //                 googleNamespace.ima.AdEvent.Type.STARTED,
  //                 () => {
  //                   console.log("Ad started");
  //                 }
  //               );

  //               adsManager.addEventListener(
  //                 googleNamespace.ima.AdEvent.Type.COMPLETE,
  //                 () => {
  //                   !this.liveStreamKey ? this.subscribe() : null;
  //                   let ele = document.querySelector(".vjs-error-display");
  //                   this.rendered.setStyle(ele, "display", "none");
  //                   console.log("Ad has completed");
  //                 }
  //               );

  //               adsManager.addEventListener(
  //                 googleNamespace.ima.AdEvent.Type.SKIPPED,
  //                 () => {
  //                   console.log("Ad was skipped");
  //                   console.log(this.player, "check player this.");
  //                   this.player.options_.sources = [];

  //                   !this.liveStreamKey ? this.subscribe() : null;
  //                   let ele = document.querySelector(".vjs-error-display");
  //                   this.rendered.setStyle(ele, "display", "none");
  //                 }
  //               );
  //             } else {
  //               console.error(
  //                 "Google namespace or IMA SDK not found. Ensure the IMA SDK is loaded correctly."
  //               );
  //             }
  //           }
  //         });
  //       }
  //       console.log("=== ready ===");
  //       console.log(this.isSocketConnected(), "this.isSocketConnected(");
  //     });
  //   } else {
  //     this.router.navigate(["/dashboard"]);
  //   }
  // }
// async streamLive(): Promise<void> {
//   if (this.userData.premiumUser) {
//     this.videoService.getLiveStreamingRecord(this.liveStreamId).subscribe((res: any) => {
//       console.log(res, "streamres");
//       this.startTime = res.body.startTime;
//       console.log(this.startTime);
//     });

//     this.videoService.getUserZoneTag(this.liveStreamId).subscribe((res) => {
//       console.log((res as any).body.data.tagUrl, "check res");
//       this.zoneTag = (res as any).body.data.tagUrl;
//       this.updateButtons();

//       let adTagUrl = (res as any).body.data.tagUrl;
//       const imaOptions = {
//         id: "vid",
//         adTagUrl: adTagUrl,
//         adsPreroll: true,
//         adsMidroll: true,
//         adsPostroll: true,
//       };

//       // Determine video sources based on stream type
//       const videoSources = [];
      
//       if (this.isRTMPStream && this.liveStreamKeyUrl) {
//         console.log("Setting up RTMP/HLS player with URL:", this.liveStreamKeyUrl);
//         videoSources.push({
//           src: this.liveStreamKeyUrl,
//           type: "application/x-mpegURL",
//         });
//       } else {
//         console.log("Setting up WebRTC player (no video sources for VideoJS)");
//         // For WebRTC, we'll use MediaSoup, not VideoJS sources
//                 videoSources.push({
//           src: this.liveStreamKeyUrl,
//           type: "application/x-mpegURL",
//         });
//       }

//       this.player = videojs(
//         this.target.nativeElement,
//         {
//           fluid: true,
//           aspectRatio: "16:9",
//           autoplay: true,
//           sources: videoSources,
//         },
//         () => {
//           console.log("Player ready");
//           this.player.ready(() => {
//             const customTimeDisplay = document.createElement('div');
//             customTimeDisplay.className = 'custom-time-display vjs-time-control vjs-control';

//             const controlBar = this.player.controlBar.el();
//             controlBar.appendChild(customTimeDisplay);

//             setInterval(() => {
//               this.updateTotalDuration(this.player, customTimeDisplay);
//             }, 1000);
//           });

//           // Handle different stream types
//           if (this.isRTMPStream && this.liveStreamKeyUrl) {
//             // RTMP/HLS stream - VideoJS will handle it
//             console.log("RTMP stream - VideoJS will handle playback");
//             if (adTagUrl != "") {
//               this.player.ima(imaOptions);
//             }
//           } else {
//             // WebRTC stream - use MediaSoup
//             console.log("WebRTC stream - using MediaSoup");
//             this.player.options_.sources = [];
//             let ele = document.querySelector(".vjs-error-display");
//             this.rendered.setStyle(ele, "display", "none");
//             this.subscribe(); // Start WebRTC subscription
//           }
//         }
//       );

//       // Error handling for RTMP streams
//       if (this.isRTMPStream && this.liveStreamKeyUrl) {
//         const retryOnError = () => {
//           console.log("RTMP stream error. Retrying...");
//           setTimeout(() => {
//             this.player.src({
//               src: this.liveStreamKeyUrl,
//               type: "application/x-mpegURL",
//             });
//             this.player.play();
//           }, 5000);
//         };

//         this.player.on("error", retryOnError);
//       }

//       // Ad handling (existing code)
//       if (adTagUrl != "") {
//         this.player.on("ads-manager", (event: any) => {
//           console.log("ads-manager event:", event);
//           const adsManager = event.adsManager;

//           if (adsManager) {
//             const googleNamespace: any = (window as any)["google"];
//             if (googleNamespace && googleNamespace.ima) {
//               adsManager.addEventListener(
//                 googleNamespace.ima.AdEvent.Type.COMPLETE,
//                 () => {
//                   if (!this.isRTMPStream) {
//                     this.subscribe(); // Only for WebRTC streams
//                   }
//                   let ele = document.querySelector(".vjs-error-display");
//                   this.rendered.setStyle(ele, "display", "none");
//                   console.log("Ad has completed");
//                 }
//               );

//               adsManager.addEventListener(
//                 googleNamespace.ima.AdEvent.Type.SKIPPED,
//                 () => {
//                   console.log("Ad was skipped");
//                   if (!this.isRTMPStream) {
//                     this.player.options_.sources = [];
//                     this.subscribe(); // Only for WebRTC streams
//                   }
//                   let ele = document.querySelector(".vjs-error-display");
//                   this.rendered.setStyle(ele, "display", "none");
//                 }
//               );
//             }
//           }
//         });
//       }

//       console.log("=== ready ===");
//     });
//   } else {
//     this.router.navigate(["/dashboard"]);
//   }
// }

async streamLive(): Promise<void> {
  if (this.userData.premiumUser) {
    this.videoService.getLiveStreamingRecord(this.liveStreamId).subscribe((res: any) => {
      console.log(res, "streamres");
      this.startTime = res.body.startTime;
      console.log(this.startTime);
    });

    this.videoService.getUserZoneTag(this.liveStreamId).subscribe((res) => {
      console.log((res as any).body.data.tagUrl, "check res");
      this.zoneTag = (res as any).body.data.tagUrl;
      this.updateButtons();

      let adTagUrl = (res as any).body.data.tagUrl;
      const imaOptions = {
        id: "vid",
        adTagUrl: adTagUrl,
        adsPreroll: true,
        adsMidroll: true,
        adsPostroll: true,
      };

      console.log("=== STREAM TYPE DETECTION ===");
      console.log("Is RTMP Stream:", this.isRTMPStream);
      console.log("Stream Key:", this.liveStreamKey);
      console.log("Stream ID:", this.liveStreamId);
      console.log("HLS URL:", this.liveStreamKeyUrl);

      // **CRITICAL: Handle different stream types differently**
      if (this.isRTMPStream && this.liveStreamKeyUrl) {
        console.log("🎥 Setting up RTMP/HLS player");
        this.setupRTMPPlayer(adTagUrl, imaOptions);
      } else {
        console.log("🌐 Setting up WebRTC player");
        this.setupWebRTCPlayer(adTagUrl, imaOptions);
      }
    });
  } else {
    this.router.navigate(["/dashboard"]);
  }
}

private handleVideoAutoplay() {
  console.log("🎯 Handling video autoplay");
  
  // Check if we have a VideoJS player or native video element
  if (this.player && typeof this.player.play === 'function') {
    console.log("🎬 Using VideoJS player for autoplay");
    this.handleVideoJSAutoplay();
  } else {
    console.log("🎬 Using native video element for autoplay");
    this.handleNativeVideoAutoplay();
  }
}

private handleVideoJSAutoplay() {
  const player = this.player;
  
  // Check if video is already playing
  if (!player.paused()) {
    console.log("✅ VideoJS player is already playing");
    this.showUnmuteNotification();
    return;
  }
  
  // Try to play muted first
  player.muted(true);
  this.isVideoMuted = true;
  
  player.play().then(() => {
    console.log("✅ VideoJS player started playing (muted)");
    this.showUnmuteNotification();
  }).catch((error: any) => {
    console.warn("⚠️ VideoJS autoplay failed:", error);
    if (error.name === 'NotAllowedError') {
      console.log("🔇 VideoJS autoplay blocked by browser policy");
      this.showPlayButton(player.el());
    }
  });
}

private handleNativeVideoAutoplay() {
  const videoElement = this.target.nativeElement;
  
  // Check if video is already playing
  if (!videoElement.paused) {
    console.log("✅ Native video is already playing");
    this.showUnmuteNotification();
    return;
  }
  
  // Try to play muted first
  videoElement.muted = true;
  this.isVideoMuted = true;
  
  videoElement.play().then(() => {
    console.log("✅ Native video started playing (muted)");
    this.showUnmuteNotification();
  }).catch((error: any) => {
    console.warn("⚠️ Native video autoplay failed:", error);
    if (error.name === 'NotAllowedError') {
      console.log("🔇 Native video autoplay blocked by browser policy");
      this.showPlayButton(videoElement);
    }
  });
}

private showUnmuteNotification() {
  this.toasterService.info(
    "Video is playing with muted audio. Click 'Enable Audio' to unmute.",
    "Audio Muted",
    { timeOut: 4000 }
  );
}

private setupRTMPPlayer(adTagUrl: string, imaOptions: any) {
  console.log("Setting up VideoJS for RTMP/HLS stream");
  
  const videoSources = [{
    src: this.liveStreamKeyUrl,
    type: "application/x-mpegURL",
  }];

  this.player = videojs(
    this.target.nativeElement,
    {
      fluid: true,
      aspectRatio: "16:9",
      autoplay: 'muted', // Changed from true to 'muted'
      muted: true, // Start muted
      sources: videoSources,
    },
    () => {
      console.log("RTMP Player ready");
      this.setupPlayerEventHandlers();
      
      // Handle autoplay issues
      this.player.ready(() => {
        this.player.on('loadedmetadata', () => {
          this.handleVideoAutoplay();
        });
      });
      
      if (adTagUrl != "") {
        this.player.ima(imaOptions);
      }
    }
  );

  // Error handling for RTMP streams
  this.player.on("error", () => {
    console.log("RTMP stream error. Retrying...");
    setTimeout(() => {
      this.player.src({
        src: this.liveStreamKeyUrl,
        type: "application/x-mpegURL",
      });
      this.player.play().catch((error: any) => {
        console.warn("Retry play failed:", error);
        this.handleVideoAutoplay();
      });
    }, 5000);
  });
}
// **NEW: WebRTC Player Setup**
private setupWebRTCPlayer(adTagUrl: string, imaOptions: any) {
  console.log("🌐 Setting up WebRTC player");
  
  // For WebRTC, we need to use the native video element directly
  // VideoJS doesn't handle MediaStream objects well
  const videoElement = this.target.nativeElement;
  
  // Remove any existing VideoJS player
  if (this.player) {
    this.player.dispose();
    this.player = null;
  }
  
  // Set up native video element for WebRTC
  videoElement.autoplay = true;
  videoElement.playsInline = true;
  videoElement.muted = true;
  videoElement.controls = false; // We'll add custom controls
  this.isVideoMuted = true;
  
  console.log("✅ Native video element configured for WebRTC");
  console.log("Starting WebRTC subscription...");
  
  // Start WebRTC connection
  this.subscribe().catch((error: any) => {
    console.error("❌ WebRTC subscription failed:", error);
    this.toasterService.error("Failed to connect to WebRTC stream: " + error.message);
  });
  
  if (adTagUrl != "") {
    this.handleWebRTCAds(adTagUrl, imaOptions);
  }
}

// **NEW: Common Player Event Handlers**
private setupPlayerEventHandlers() {
  this.player.ready(() => {
    const customTimeDisplay = document.createElement('div');
    customTimeDisplay.className = 'custom-time-display vjs-time-control vjs-control';

    const controlBar = this.player.controlBar.el();
    controlBar.appendChild(customTimeDisplay);

    setInterval(() => {
      this.updateTotalDuration(this.player, customTimeDisplay);
    }, 1000);
  });
}

// **NEW: Handle ads for WebRTC streams**
private handleWebRTCAds(adTagUrl: string, imaOptions: any) {
  this.player.on("ads-manager", (event: any) => {
    console.log("ads-manager event for WebRTC:", event);
    const adsManager = event.adsManager;

    if (adsManager) {
      const googleNamespace: any = (window as any)["google"];
      if (googleNamespace && googleNamespace.ima) {
        adsManager.addEventListener(
          googleNamespace.ima.AdEvent.Type.COMPLETE,
          () => {
            console.log("Ad completed - WebRTC stream should continue");
            // WebRTC stream continues automatically
          }
        );

        adsManager.addEventListener(
          googleNamespace.ima.AdEvent.Type.SKIPPED,
          () => {
            console.log("Ad skipped - WebRTC stream should continue");
            // WebRTC stream continues automatically
          }
        );
      }
    }
  });
}


  updateTotalDuration(player:any, customTimeDisplay:any): void {
   // Calculate elapsed time since the stream started
   const now = new Date();
   const streamStarted = new Date(this.startTime);
   this.elapsedTime = Math.floor((now.getTime() - streamStarted.getTime()) / 1000);

   // Format the elapsed time string
   const hours = Math.floor(this
    .elapsedTime / 3600);
   const minutes = Math.floor((this.elapsedTime % 3600) / 60);
   const seconds = this.elapsedTime % 60;
   const elapsedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

   // Update custom time display
   customTimeDisplay.innerHTML = elapsedDuration;
  }
  // return Promise
  // connectSocket() {
  //   // Close the existing socket if it exists
  //   if (this.socket) {
  //     this.socket.close();
  //     this.socket = null;
  //     this.clientId = null;
  //   }

  //   // Function to attempt socket connection
  //   const tryConnect = (attemptsLeft: number) => {
  //     return new Promise<void>((resolve, reject) => {
  //       // Create a new socket instance
  //       this.socket = io(environment.socketUrl, {
  //         autoConnect: true,
  //         transports: ["websocket", "polling"],
  //       }).connect();

  //       let messageReceived = false;

  //       // Set a timeout for 2 seconds

  //       let timeoutId = setTimeout(() => {
  //         if (!messageReceived) {
  //           // If no message received within 2 seconds, disconnect and attempt reconnect
  //           console.log(
  //             `No message received within 2 seconds. Reconnecting... Attempts left: ${attemptsLeft}`
  //           );
  //           this.socket.disconnect();
  //           tryConnect(attemptsLeft - 1)
  //             .then(resolve)
  //             .catch(reject);
  //         }
  //       }, 2000);

  //       this.socket.on("connect", function (evt: any) {
  //         console.log("socket.io connected()");
  //       });

  //       this.socket.on(`error${this.liveStreamId}`, function (err: any) {
  //         console.error("socket.io ERROR:", err);
  //         // Clear the timeout as an error occurred or disconnect happened
  //         clearTimeout(timeoutId);
  //         reject(err);
  //       });

  //       this.socket.on(`disconnect${this.liveStreamId}`, function (evt: any) {
  //         console.log("socket.io disconnect:", evt);
  //         // Clear the timeout on disconnect
  //         clearTimeout(timeoutId);
  //         tryConnect(attemptsLeft - 1)
  //           .then(resolve)
  //           .catch(reject);
  //       });
  //       if (attemptsLeft == 0) {
  //         clearTimeout(timeoutId);
  //         console.log("attempt finished");
  //       }
  //       this.socket.on(`message${this.liveStreamId}`, (message: any) => {
  //         // Set the flag to true when a message is received
  //         messageReceived = true;
  //         console.log(
  //           `message${this.liveStreamId}`,
  //           "`message${this.liveStreamId}`"
  //         );
  //         console.log("socket.io message:", message);
  //         if (message.type === "welcome") {
  //           if (this.socket.id !== message.id) {
  //             console.warn(
  //               "WARN: something wrong with clientID",
  //               this.socket.io,
  //               message.id
  //             );
  //           }

  //           this.clientId = message.id;
  //           console.log("connected to server. clientId=" + this.clientId);
  //           resolve();
  //         } else {
  //           console.error("UNKNOWN message from server:", message);
  //         }
  //       });
  //     });
  //   };

  //   // Start the initial connection attempt with a maximum of 5 retries
  //   return tryConnect(5);
  // }

  connectSocket() {
  // Close existing socket
  if (this.socket) {
    this.socket.close();
    this.socket = null;
    this.clientId = null;
  }

  const tryConnect = (attemptsLeft: number) => {
    return new Promise<void>((resolve, reject) => {
      console.log("=== SOCKET CONNECTION ===");
      console.log("Stream ID:", this.liveStreamId);
      console.log("Is RTMP Stream:", this.isRTMPStream);
      console.log("Attempts left:", attemptsLeft);
      
      // **CRITICAL FIX: Use different socket URLs for different stream types**
      let socketUrl;
      if (this.isRTMPStream) {
        // RTMP streams use VOD_BE socket (port 3005)
        socketUrl = environment.socketUrlBe;
        console.log("Connecting to VOD_BE for RTMP stream:", socketUrl);
      } else {
        // WebRTC streams use Video-Processing socket (port 3000)
        socketUrl = environment.socketUrl;
        console.log("Connecting to Video-Processing for WebRTC stream:", socketUrl);
      }
      
      this.socket = io(socketUrl, {
        autoConnect: true,
        transports: ["websocket", "polling"],
        timeout: 10000,
      });

      let messageReceived = false;
      let timeoutId = setTimeout(() => {
        if (!messageReceived && attemptsLeft > 0) {
          console.log(`No message received within timeout. Retrying... Attempts left: ${attemptsLeft - 1}`);
          this.socket.disconnect();
          tryConnect(attemptsLeft - 1).then(resolve).catch(reject);
        } else if (attemptsLeft === 0) {
          reject(new Error("Connection failed after all attempts"));
        }
      }, 10000);

      this.socket.on("connect", () => {
        console.log("Socket connected successfully");
        
        // **NEW: Join stream as viewer immediately after connection**
        if (this.liveStreamId && !this.isRTMPStream) {
          console.log(`Joining stream ${this.liveStreamId} as viewer`);
          this.socket.emit('joinStream', { 
            streamId: this.liveStreamId, 
            role: 'viewer' 
          });
        }
      });

      this.socket.on("connect_error", (error: any) => {
        console.error("Socket connection error:", error);
        clearTimeout(timeoutId);
        if (attemptsLeft > 0) {
          tryConnect(attemptsLeft - 1).then(resolve).catch(reject);
        } else {
          reject(error);
        }
      });

      this.socket.on(`error${this.liveStreamId}`, (err: any) => {
        console.error("socket.io ERROR:", err);
        clearTimeout(timeoutId);
        reject(err);
      });

      this.socket.on(`disconnect${this.liveStreamId}`, (evt: any) => {
        console.log("socket.io disconnect:", evt);
        
        clearTimeout(timeoutId);
        if (attemptsLeft > 0) {
          tryConnect(attemptsLeft - 1).then(resolve).catch(reject);
        }
      });

      this.socket.on(`message${this.liveStreamId}`, (message: any) => {
        messageReceived = true;
        clearTimeout(timeoutId);
        console.log("Received welcome message:", message);
        
        if (message.type === "welcome") {
          this.clientId = message.id;
          console.log("Connected to server. clientId=" + this.clientId);
          resolve();
        } else {
          console.error("UNKNOWN message from server:", message);
          reject(new Error("Unknown message type"));
        }
      });
    });
  };

  return tryConnect(3); // Retry up to 3 times
}

  disconnectSocket() {
    if (this.socket) {
      let connected = JSON.parse(localStorage.getItem("connected") as any);
      console.log(connected, "check connected object");
      if (connected.tabs == 1) {
        this.sendRequest(`disconnect${this.liveStreamId}`, { decrement: true });
        localStorage.removeItem("connected");
      } else {
        connected.tabs -= 1;
        localStorage.setItem("connected", JSON.stringify(connected));
        this.sendRequest(`disconnect${this.liveStreamId}`, {
          decrement: false,
        });
      }
      this.socket.close();
      this.socket = null;
      this.clientId = null;
      console.log("socket.io closed..");
    }
  }

  isSocketConnected() {
    if (this.socket) {
      return true;
    } else {
      return false;
    }
  }

  // sendRequest(type: any, data: any) {
  //   return new Promise((resolve, reject) => {
  //     this.socket.emit(type, data, (err: any, response: any) => {
  //       if (!err) {
  //         // Success response, so pass the mediasoup response to the local Room.
  //         resolve(response);
  //       } else {
  //         reject(err);
  //       }
  //       this.socket.on(`consumerAdded${this.liveStreamId}`, (data: any) => {
  //         console.log(data, "check connected users")
  //       })
  //       this.socket.on(`consumerLeft${this.liveStreamId}`, (count: any) => {
  //         console.log(count, "chekc connected users after leave in viewr")
  //       })
  //     });
  //   });
  // }
  sendRequest(type: any, data: any, maxRetries: number = 3) {
    return new Promise((resolve, reject) => {
      const attemptRequest = (attempt: number) => {
        this.socket.emit(type, data, (err: any, response: any) => {
          if (!err) {
            // Success response, so pass the mediasoup response to the local Room.
            console.log("resolved.....", response);

            resolve(response);
          } else {
            console.log("retry.....");
            if (attempt < maxRetries) {
              // Retry the request
              console.log(`Retry attempt ${attempt + 1}`);
              attemptRequest(attempt + 1);
            } else {
              // Max retries reached, reject the promise with the last error
              reject(err);
            }
          }
        });
      };

      // Start the initial attempt
      attemptRequest(0);

      this.socket.on(`consumerAdded${this.liveStreamId}`, (data: any) => {
        console.log(data, "check connected users");
      });

      this.socket.on(`consumerLeft${this.liveStreamId}`, (count: any) => {
        console.log(count, "check connected users after leave in viewer");
      });
    });
  }

async playVideo(element: any, stream: any) {
  console.log("🎯 Setting up video stream");
  console.log("Element type:", element?.tagName);
  console.log("Stream type:", stream?.constructor?.name);
  
  // Check if we have a VideoJS player or native video element
  if (this.player && typeof this.player.play === 'function') {
    console.log("🎬 Using VideoJS player for stream setup");
    await this.playVideoWithVideoJS(stream);
  } else {
    console.log("🎬 Using native video element for stream setup");
    await this.playVideoWithNativeElement(element, stream);
  }
}

private async playVideoWithVideoJS(stream: any) {
  console.log("🎬 Setting up VideoJS player with stream");
  
  try {
    // For VideoJS, we need to handle the stream differently
    // VideoJS typically works with src URLs, not MediaStream objects
    if (stream instanceof MediaStream) {
      console.log("📹 MediaStream detected - converting for VideoJS");
      // For MediaStream, we might need to create a blob URL
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        this.player.src({ src: url, type: 'video/webm' });
      };
      
      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 1000);
    }
    
    // Set VideoJS player to muted for autoplay
    this.player.muted(true);
    this.isVideoMuted = true;
    
    // Try to play
    await this.player.play();
    console.log("✅ VideoJS player started playing successfully (muted)");
    this.showUnmuteNotification();
    
  } catch (error: any) {
    console.warn("⚠️ VideoJS autoplay failed:", error);
    if (error.name === 'NotAllowedError') {
      console.log("🔇 VideoJS autoplay blocked by browser policy");
      this.showPlayButton(this.player.el());
    } else {
      console.error("❌ Other VideoJS play error:", error);
      this.showPlayButton(this.player.el());
    }
  }
}

  private async playVideoWithNativeElement(element: any, stream: any) {
    console.log("🎬 Setting up native video element with stream");
    
    if (element.srcObject) {
      console.warn("Element already has a stream, replacing it");
    }

    // Set up the video element
    element.srcObject = stream;
    element.volume = 1;
    element.autoplay = true;
    element.playsInline = true;
    element.muted = true; // Start muted
    this.isVideoMuted = true;
    
    console.log("Video element configured with stream");
    
    // Wait for video to be ready
    if (element.readyState < 2) {
      console.log("Waiting for video to be ready...");
      await new Promise<void>((resolve) => {
        const onReady = () => {
          element.removeEventListener('loadedmetadata', onReady);
          element.removeEventListener('canplay', onReady);
          resolve();
        };
        
        element.addEventListener('loadedmetadata', onReady);
        element.addEventListener('canplay', onReady);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          element.removeEventListener('loadedmetadata', onReady);
          element.removeEventListener('canplay', onReady);
          resolve();
        }, 5000);
      });
    }
    
    // Try to play the video
    try {
      console.log("Attempting to play native video...");
      await element.play();
      console.log("✅ Native video started playing successfully (muted)");
      this.showUnmuteNotification();
      
    } catch (error: any) {
      console.warn("⚠️ Native video autoplay failed:", error);
      if (error.name === 'NotAllowedError') {
        console.log("🔇 Native video autoplay blocked by browser policy");
        this.showPlayButton(element);
      } else {
        console.error("❌ Other native video play error:", error);
        this.showPlayButton(element);
      }
    }
  }

  private async playNativeVideoElement(element: any) {
    console.log("🎬 Playing native video element");
    console.log("Element srcObject:", !!element.srcObject);
    console.log("Element src:", element.src);
    console.log("Element readyState:", element.readyState);
    
    // Check if element has any video source
    if (!element.srcObject && !element.src) {
      throw new Error("Video element has no sources (srcObject or src)");
    }
    
    // Ensure video is ready
    if (element.readyState < 2) {
      console.log("⏳ Waiting for video element to be ready...");
      await new Promise<void>((resolve) => {
        const onReady = () => {
          element.removeEventListener('canplay', onReady);
          element.removeEventListener('loadedmetadata', onReady);
          resolve();
        };
        element.addEventListener('canplay', onReady);
        element.addEventListener('loadedmetadata', onReady);
        setTimeout(() => {
          element.removeEventListener('canplay', onReady);
          element.removeEventListener('loadedmetadata', onReady);
          resolve();
        }, 3000);
      });
    }
    
    // Play if paused
    if (element.paused) {
      console.log("▶️ Playing native video element");
      await element.play();
    }
    
    // Unmute
    element.muted = false;
    this.isVideoMuted = false;
    
    console.log("✅ Native video element playing with audio");
  }

  public enableAudio() {
    if (this.target?.nativeElement) {
      const videoElement = this.target.nativeElement;
      if (videoElement.muted) {
        videoElement.muted = false;
        this.isVideoMuted = false;
        
        // Remove the play button if it exists
        this.removePlayButton();
        
        this.toasterService.success(
          "Audio enabled!",
          "Success",
          { timeOut: 2000 }
        );
        console.log("✅ Audio enabled");
      } else {
        this.toasterService.info(
          "Audio is already enabled",
          "Info",
          { timeOut: 2000 }
        );
      }
    }
  }

  public isAudioMuted(): boolean {
    if (this.target?.nativeElement) {
      return this.target.nativeElement.muted;
    }
    return this.isVideoMuted;
  }

  public isVideoPlaying(): boolean {
    if (this.target?.nativeElement) {
      return !this.target.nativeElement.paused;
    }
    return false;
  }

  public getVideoState(): { playing: boolean; muted: boolean; ready: boolean } {
    if (this.player && typeof this.player.paused === 'function') {
      // VideoJS player
      return {
        playing: !this.player.paused(),
        muted: this.player.muted(),
        ready: this.player.readyState() >= 2
      };
    } else if (this.target?.nativeElement) {
      // Native video element
      const element = this.target.nativeElement;
      return {
        playing: !element.paused,
        muted: element.muted,
        ready: element.readyState >= 2
      };
    }
    return { playing: false, muted: this.isVideoMuted, ready: false };
  }

  public debugVideoState(): void {
    console.log("🔍 === VIDEO STATE DEBUG ===");
    console.log("VideoJS player exists:", !!this.player);
    console.log("Target element exists:", !!this.target?.nativeElement);
    
    if (this.player) {
      console.log("VideoJS player state:", {
        paused: this.player.paused(),
        muted: this.player.muted(),
        readyState: this.player.readyState(),
        currentTime: this.player.currentTime(),
        duration: this.player.duration(),
        src: this.player.currentSrc()
      });
    }
    
    if (this.target?.nativeElement) {
      const element = this.target.nativeElement;
      console.log("Native video element state:", {
        tagName: element.tagName,
        paused: element.paused,
        muted: element.muted,
        readyState: element.readyState,
        currentTime: element.currentTime,
        duration: element.duration,
        src: element.src,
        srcObject: !!element.srcObject
      });
    }
    
    console.log("Component state:", {
      isVideoMuted: this.isVideoMuted,
      isRTMPStream: this.isRTMPStream,
      liveStreamKey: this.liveStreamKey,
      liveStreamId: this.liveStreamId
    });
    
    // WebRTC specific debugging
    if (!this.isRTMPStream) {
      const webrtcStatus = this.getWebRTCStatus();
      console.log("WebRTC status:", webrtcStatus);
      console.log("Audio track:", this.audioTrack ? {
        id: this.audioTrack.id,
        enabled: this.audioTrack.enabled,
        readyState: this.audioTrack.readyState
      } : null);
      console.log("Video track:", this.videoTrack ? {
        id: this.videoTrack.id,
        enabled: this.videoTrack.enabled,
        readyState: this.videoTrack.readyState
      } : null);
    }
    
    console.log("🔍 === END DEBUG ===");
  }

  public hasVideoSources(): boolean {
    if (this.player && typeof this.player.currentSrc === 'function') {
      const videoJSSrc = this.player.currentSrc();
      return !!videoJSSrc;
    }
    
    if (this.target?.nativeElement) {
      const element = this.target.nativeElement;
      return !!(element.srcObject || element.src);
    }
    
    return false;
  }

  public getWebRTCStatus(): {
    connected: boolean;
    hasAudio: boolean;
    hasVideo: boolean;
    socketConnected: boolean;
    deviceReady: boolean;
    transportReady: boolean;
  } {
    return {
      connected: this.isSocketConnected(),
      hasAudio: !!this.audioTrack,
      hasVideo: !!this.videoTrack,
      socketConnected: this.isSocketConnected(),
      deviceReady: !!this.device,
      transportReady: !!this.consumerTransport
    };
  }

  public async forcePlayVideo(): Promise<void> {
    console.log("🔧 Force playing video...");
    const videoElement = this.target.nativeElement;
    
    if (!videoElement) {
      console.error("❌ No video element found");
      return;
    }
    
    console.log("Video element state:", {
      readyState: videoElement.readyState,
      paused: videoElement.paused,
      muted: videoElement.muted,
      srcObject: !!videoElement.srcObject,
      src: videoElement.src
    });
    
    try {
      // Ensure video is muted for autoplay
      videoElement.muted = true;
      this.isVideoMuted = true;
      
      // Try to play
      await videoElement.play();
      console.log("✅ Force play successful!");
      this.showUnmuteNotification();
    } catch (error: any) {
      console.error("❌ Force play failed:", error);
      this.showPlayButton(videoElement);
    }
  }

  public testMediaStream(): void {
    console.log("🧪 Testing MediaStream...");
    
    if (!this.audioTrack || !this.videoTrack) {
      console.log("❌ No tracks available for testing");
      return;
    }
    
    // Create a test stream
    const testStream = new MediaStream([this.audioTrack, this.videoTrack]);
    
    // First, test with a simple canvas-generated stream to see if video elements work at all
    console.log("🧪 Testing with canvas-generated stream first...");
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 320, 240);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText('Test Stream', 10, 50);
      
      const canvasStream = canvas.captureStream(30);
      const testVideo1 = document.createElement('video');
      testVideo1.style.position = 'fixed';
      testVideo1.style.top = '10px';
      testVideo1.style.left = '10px';
      testVideo1.style.width = '200px';
      testVideo1.style.height = '150px';
      testVideo1.style.zIndex = '9999';
      testVideo1.style.border = '2px solid green';
      testVideo1.autoplay = true;
      testVideo1.muted = true;
      testVideo1.srcObject = canvasStream;
      document.body.appendChild(testVideo1);
      
      console.log("🧪 Canvas stream test video created");
      
      // Remove after 3 seconds
      setTimeout(() => {
        if (document.body.contains(testVideo1)) {
          document.body.removeChild(testVideo1);
          console.log("🧪 Canvas test video removed");
        }
      }, 3000);
    }
    
    console.log("Test stream info:", {
      id: testStream.id,
      active: testStream.active,
      tracks: testStream.getTracks().map(t => ({
        kind: t.kind,
        id: t.id,
        enabled: t.enabled,
        readyState: t.readyState,
        muted: t.muted
      }))
    });
    
    // Test with a new video element
    const testVideo = document.createElement('video');
    testVideo.autoplay = true;
    testVideo.playsInline = true;
    testVideo.muted = true;
    testVideo.preload = 'auto';
    testVideo.controls = true;
    testVideo.srcObject = testStream;
    testVideo.load();
    
    testVideo.onloadedmetadata = () => {
      console.log("✅ Test video loaded metadata");
      console.log("Test video state:", {
        readyState: testVideo.readyState,
        duration: testVideo.duration,
        videoWidth: testVideo.videoWidth,
        videoHeight: testVideo.videoHeight
      });
    };
    
    testVideo.oncanplay = () => {
      console.log("✅ Test video can play");
      // Try to play the test video
      testVideo.play().then(() => {
        console.log("✅ Test video playing successfully!");
      }).catch((error) => {
        console.error("❌ Test video play failed:", error);
      });
    };
    
    testVideo.onerror = (error) => {
      console.error("❌ Test video error:", error);
    };
    
    // Add to page temporarily
    testVideo.style.position = 'fixed';
    testVideo.style.top = '10px';
    testVideo.style.right = '10px';
    testVideo.style.width = '200px';
    testVideo.style.height = '150px';
    testVideo.style.zIndex = '9999';
    testVideo.style.border = '2px solid red';
    document.body.appendChild(testVideo);
    
    // Monitor the test video state
    const checkTestVideo = () => {
      console.log("🧪 Test video state:", {
        readyState: testVideo.readyState,
        videoWidth: testVideo.videoWidth,
        videoHeight: testVideo.videoHeight,
        currentTime: testVideo.currentTime,
        duration: testVideo.duration
      });
      
      if (testVideo.readyState >= 1) {
        console.log("✅ Test video is ready!");
        // Remove after 5 seconds
        setTimeout(() => {
          if (document.body.contains(testVideo)) {
            document.body.removeChild(testVideo);
            console.log("🧪 Test video removed");
          }
        }, 5000);
      } else {
        setTimeout(checkTestVideo, 500);
      }
    };
    
    checkTestVideo();
  }

  public debugMediaSoupState(): void {
    console.log("🔍 === MEDIASOUP STATE DEBUG ===");
    
    console.log("Device:", {
      exists: !!this.device,
      loaded: (this.device as any)?.loaded,
      rtpCapabilities: !!(this.device as any)?.rtpCapabilities
    });
    
    console.log("Consumer Transport:", {
      exists: !!this.consumerTransport,
      closed: (this.consumerTransport as any)?.closed,
      connectionState: (this.consumerTransport as any)?.connectionState,
      id: (this.consumerTransport as any)?.id
    });
    
    console.log("Video Consumer:", {
      exists: !!this.videoConsumer,
      closed: (this.videoConsumer as any)?.closed,
      paused: (this.videoConsumer as any)?.paused,
      kind: (this.videoConsumer as any)?.kind,
      trackExists: !!(this.videoConsumer as any)?.track,
      trackId: (this.videoConsumer as any)?.track?.id,
      trackReadyState: (this.videoConsumer as any)?.track?.readyState,
      trackEnabled: (this.videoConsumer as any)?.track?.enabled
    });
    
    console.log("Audio Consumer:", {
      exists: !!this.audioConsumer,
      closed: (this.audioConsumer as any)?.closed,
      paused: (this.audioConsumer as any)?.paused,
      kind: (this.audioConsumer as any)?.kind,
      trackExists: !!(this.audioConsumer as any)?.track,
      trackId: (this.audioConsumer as any)?.track?.id,
      trackReadyState: (this.audioConsumer as any)?.track?.readyState,
      trackEnabled: (this.audioConsumer as any)?.track?.enabled
    });
    
    console.log("Component Tracks:", {
      audioTrack: this.audioTrack ? {
        id: this.audioTrack.id,
        kind: this.audioTrack.kind,
        enabled: this.audioTrack.enabled,
        readyState: this.audioTrack.readyState,
        muted: this.audioTrack.muted
      } : null,
      videoTrack: this.videoTrack ? {
        id: this.videoTrack.id,
        kind: this.videoTrack.kind,
        enabled: this.videoTrack.enabled,
        readyState: this.videoTrack.readyState,
        muted: this.videoTrack.muted
      } : null
    });
    
    console.log("🔍 === END MEDIASOUP DEBUG ===");
  }

  public testMediaSoupTracks(): void {
    console.log("🧪 === TESTING MEDIASOUP TRACKS ===");
    
    if (!this.videoConsumer || !this.audioConsumer) {
      console.log("❌ No MediaSoup consumers available");
      return;
    }
    
    // First test with the component tracks
    if (this.videoTrack && this.audioTrack) {
      console.log("🧪 Testing with component tracks...");
      const testStream = new MediaStream([this.videoTrack, this.audioTrack]);
      const testVideo = document.createElement('video');
      testVideo.style.position = 'fixed';
      testVideo.style.top = '100px';
      testVideo.style.left = '10px';
      testVideo.style.width = '200px';
      testVideo.style.height = '150px';
      testVideo.style.zIndex = '9999';
      testVideo.style.border = '2px solid purple';
      testVideo.autoplay = true;
      testVideo.muted = true;
      testVideo.controls = true;
      testVideo.srcObject = testStream;
      document.body.appendChild(testVideo);
      
      console.log("🧪 Component tracks test video created");
      
      // Monitor the test video
      const checkComponentTest = () => {
        console.log("🧪 Component test state:", {
          readyState: testVideo.readyState,
          videoWidth: testVideo.videoWidth,
          videoHeight: testVideo.videoHeight
        });
        
        if (testVideo.readyState >= 1) {
          console.log("✅ Component test is ready!");
          setTimeout(() => {
            if (document.body.contains(testVideo)) {
              document.body.removeChild(testVideo);
              console.log("🧪 Component test removed");
            }
          }, 5000);
        } else {
          setTimeout(checkComponentTest, 500);
        }
      };
      
      checkComponentTest();
    }
    
    // Test video consumer track
    const videoTrack = (this.videoConsumer as any)?.track;
    if (videoTrack) {
      console.log("📹 Video consumer track:", {
        id: videoTrack.id,
        kind: videoTrack.kind,
        enabled: videoTrack.enabled,
        readyState: videoTrack.readyState,
        muted: videoTrack.muted,
        settings: videoTrack.getSettings()
      });
      
      // Try to create a test stream with just the video track
      const videoStream = new MediaStream([videoTrack]);
      const testVideo = document.createElement('video');
      testVideo.style.position = 'fixed';
      testVideo.style.top = '50px';
      testVideo.style.right = '10px';
      testVideo.style.width = '200px';
      testVideo.style.height = '150px';
      testVideo.style.zIndex = '9999';
      testVideo.style.border = '2px solid blue';
      testVideo.autoplay = true;
      testVideo.muted = true;
      testVideo.srcObject = videoStream;
      document.body.appendChild(testVideo);
      
      console.log("🧪 Video-only test stream created");
      
      // Monitor the test video
      const checkVideoTest = () => {
        console.log("🧪 Video test state:", {
          readyState: testVideo.readyState,
          videoWidth: testVideo.videoWidth,
          videoHeight: testVideo.videoHeight
        });
        
        if (testVideo.readyState >= 1) {
          console.log("✅ Video test is ready!");
          setTimeout(() => {
            if (document.body.contains(testVideo)) {
              document.body.removeChild(testVideo);
              console.log("🧪 Video test removed");
            }
          }, 5000);
        } else {
          setTimeout(checkVideoTest, 500);
        }
      };
      
      checkVideoTest();
    } else {
      console.log("❌ No video track in consumer");
    }
    
    // Test audio consumer track
    const audioTrack = (this.audioConsumer as any)?.track;
    if (audioTrack) {
      console.log("🎵 Audio consumer track:", {
        id: audioTrack.id,
        kind: audioTrack.kind,
        enabled: audioTrack.enabled,
        readyState: audioTrack.readyState,
        muted: audioTrack.muted,
        settings: audioTrack.getSettings()
      });
    } else {
      console.log("❌ No audio track in consumer");
    }
    
    console.log("🧪 === END MEDIASOUP TRACKS TEST ===");
  }

  private removePlayButton() {
    const existingButton = document.getElementById('autoplay-play-button');
    if (existingButton) {
      existingButton.remove();
    }
  }

private showPlayButton(element: any) {
  // Remove any existing play buttons
  this.removePlayButton();
  
  console.log("🎯 Creating play button for element:", element);
  console.log("Element type:", element?.tagName);
  console.log("VideoJS player exists:", !!this.player);
  
  // Check current state - handle both VideoJS and native video elements
  let isPlaying = false;
  let isMuted = false;
  
  if (this.player && typeof this.player.paused === 'function') {
    // VideoJS player
    isPlaying = !this.player.paused();
    isMuted = this.player.muted();
    console.log("VideoJS state - playing:", isPlaying, "muted:", isMuted);
  } else if (element && typeof element.paused !== 'undefined') {
    // Native video element
    isPlaying = !element.paused;
    isMuted = element.muted;
    console.log("Native video state - playing:", isPlaying, "muted:", isMuted);
    console.log("Native video sources - srcObject:", !!element.srcObject, "src:", element.src);
  } else {
    console.warn("⚠️ Unknown element type, assuming paused and muted");
    isPlaying = false;
    isMuted = true;
  }
  
  let buttonText = '🔊 Click to Play with Audio';
  if (isPlaying && isMuted) {
    buttonText = '🔊 Click to Enable Audio';
  } else if (isPlaying && !isMuted) {
    // Video is already playing with audio, no button needed
    console.log("✅ Video already playing with audio, no button needed");
    return;
  }
  
  // Create play button
  const playButton = document.createElement('button');
  playButton.innerHTML = buttonText;
  playButton.id = 'autoplay-play-button';
  playButton.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border: 2px solid white;
    padding: 15px 30px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    z-index: 1000;
    transition: all 0.3s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  `;
  
  // Hover effects
  playButton.onmouseover = () => {
    playButton.style.background = 'rgba(0, 0, 0, 0.9)';
    playButton.style.transform = 'translate(-50%, -50%) scale(1.05)';
  };
  
  playButton.onmouseout = () => {
    playButton.style.background = 'rgba(0, 0, 0, 0.8)';
    playButton.style.transform = 'translate(-50%, -50%) scale(1)';
  };
  
  // Click handler
  playButton.onclick = async () => {
    try {
      // Disable button during processing
      playButton.disabled = true;
      playButton.innerHTML = 'Loading...';
      
      console.log("🎯 Play button clicked - attempting to play video");
      
      // Debug current state
      this.debugVideoState();
      
      // Check if video has sources
      if (!this.hasVideoSources()) {
        console.error("❌ No video sources available");
        throw new Error("No video sources available. Please wait for the stream to load or refresh the page.");
      }
      
      console.log("Element type:", element?.tagName);
      console.log("Element readyState:", element?.readyState);
      console.log("Element paused:", element?.paused);
      console.log("Element muted:", element?.muted);
      
              // Check if we have a VideoJS player
        if (this.player && typeof this.player.play === 'function') {
          console.log("🎬 Using VideoJS player");
          
          // Check if VideoJS player has sources
          const currentSrc = this.player.currentSrc();
          console.log("VideoJS current source:", currentSrc);
          
          if (!currentSrc && !this.player.src()) {
            console.warn("⚠️ VideoJS player has no sources - this might be a WebRTC stream");
            
            // For WebRTC streams, we need to ensure the native video element has the stream
            const videoElement = this.target.nativeElement;
            if (videoElement && videoElement.srcObject) {
              console.log("✅ Native video element has srcObject, switching to native playback");
              // Switch to native video element playback
              await this.playNativeVideoElement(videoElement);
              return;
            } else {
              throw new Error("No video sources available for playback");
            }
          }
          
          // Ensure VideoJS player is ready
          if (this.player.readyState() < 2) {
            console.log("⏳ Waiting for VideoJS player to be ready...");
            await new Promise<void>((resolve) => {
              const onReady = () => {
                this.player.off('loadedmetadata', onReady);
                this.player.off('canplay', onReady);
                resolve();
              };
              this.player.on('loadedmetadata', onReady);
              this.player.on('canplay', onReady);
              setTimeout(() => {
                this.player.off('loadedmetadata', onReady);
                this.player.off('canplay', onReady);
                resolve();
              }, 3000);
            });
          }
          
          // Play VideoJS player
          if (this.player.paused()) {
            await this.player.play();
          }
          
          // Unmute VideoJS player
          this.player.muted(false);
          this.isVideoMuted = false;
          
        } else {
          console.log("🎬 Using native video element");
          await this.playNativeVideoElement(element);
        }
      
      console.log("✅ Video started playing with audio after user interaction");
      playButton.remove();
      
      this.toasterService.success(
        "Video is now playing with audio!",
        "Success",
        { timeOut: 3000 }
      );
      
    } catch (error: any) {
      console.error("❌ Play failed even after user interaction:", error);
      console.error("Error details:", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      playButton.disabled = false;
      playButton.innerHTML = buttonText;
      
      this.toasterService.error(
        `Failed to play video: ${error?.message || 'Unknown error'}`,
        "Error",
        { timeOut: 5000 }
      );
    }
  };
  
  // Add button to container
  const container = element.parentElement || element;
  container.style.position = 'relative';
  container.appendChild(playButton);
  
  // Show notification
  this.toasterService.info(
    "Click the play button to start the video with audio",
    "User Interaction Required",
    { timeOut: 5000 }
  );
}

  updateTimePassed() {
    setInterval(() => {
      if (this.player) {
        const currentTime = this.player.currentTime();
        const formattedTime = this.formatTime(currentTime);
        this.timePassed = formattedTime;
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(
      remainingSeconds
    )}`;
  }

  pad(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  pauseVideo(element: any) {
    element.pause();
    element.srcObject = null;
  }

  async addRemoteTrack(id: any, track: any) {
    console.log("🎯 Adding remote track:", track.kind, track.id);
    console.log("Track details:", {
      kind: track.kind,
      id: track.id,
      enabled: track.enabled,
      readyState: track.readyState
    });
    
    if (track.kind === "audio") {
      this.audioTrack = track;
      console.log("🎵 Audio track added");
    } else if (track.kind === "video") {
      this.videoTrack = track;
      console.log("📹 Video track added");
    }

    // Play only when both audio and video tracks are available
    if (this.audioTrack && this.videoTrack) {
      console.log("🎬 Both tracks available, creating combined stream");
      
      // Debug MediaSoup state
      this.debugMediaSoupState();
      
      // Validate tracks before creating stream
      console.log("Audio track state:", {
        id: this.audioTrack.id,
        enabled: this.audioTrack.enabled,
        readyState: this.audioTrack.readyState,
        muted: this.audioTrack.muted
      });
      
      console.log("Video track state:", {
        id: this.videoTrack.id,
        enabled: this.videoTrack.enabled,
        readyState: this.videoTrack.readyState,
        muted: this.videoTrack.muted
      });
      
      // Ensure tracks are enabled
      console.log("🔍 === STARTING MEDIASTREAM SETUP ===");
      console.log("Track availability:", {
        hasAudioTrack: !!this.audioTrack,
        hasVideoTrack: !!this.videoTrack
      });
      
      if (!this.audioTrack.enabled) {
        console.log("🔧 Enabling audio track...");
        this.audioTrack.enabled = true;
      }
      
      if (!this.videoTrack.enabled) {
        console.log("🔧 Enabling video track...");
        this.videoTrack.enabled = true;
      }
      
      console.log("🔧 Creating MediaStream...");
      let combinedStream: MediaStream;
      try {
        combinedStream = new MediaStream([
          this.audioTrack,
          this.videoTrack,
        ]);
        console.log("✅ MediaStream created successfully");
      } catch (error) {
        console.error("❌ Failed to create MediaStream:", error);
        return;
      }
      console.log("Combined stream tracks:", combinedStream.getTracks().map(t => ({
        kind: t.kind,
        id: t.id,
        enabled: t.enabled,
        readyState: t.readyState
      })));
      
      // Check if the stream is actually working
      const tracks = combinedStream.getTracks();
      const activeTracks = tracks.filter(track => track.readyState === 'live');
      console.log("Active tracks:", activeTracks.length, "of", tracks.length);
      
      if (activeTracks.length === 0) {
        console.warn("⚠️ No active tracks in the stream!");
        return;
      }
      
      // Check video track specifically
      const videoTrack = tracks.find(track => track.kind === 'video');
      if (videoTrack) {
        console.log("📹 Video track details:", {
          id: videoTrack.id,
          enabled: videoTrack.enabled,
          readyState: videoTrack.readyState,
          muted: videoTrack.muted
        });
        
        // Check if video track is actually producing frames
        if (videoTrack.readyState === 'live') {
          console.log("✅ Video track is live and producing frames");
        } else {
          console.warn("⚠️ Video track is not live:", videoTrack.readyState);
        }
      } else {
        console.warn("⚠️ No video track found in stream!");
      }
      
      // For WebRTC streams, we need to ensure the native video element gets the stream
      const videoElement = this.target.nativeElement;
      if (videoElement) {
        // Debug the MediaStream before setting it up
        console.log("🔍 MediaStream details:", {
          id: combinedStream.id,
          active: combinedStream.active,
          tracks: combinedStream.getTracks().map(t => ({
            id: t.id,
            kind: t.kind,
            enabled: t.enabled,
            readyState: t.readyState,
            muted: t.muted,
            contentHint: (t as any).contentHint
          }))
        });
        
        // Check if tracks are actually producing data
        const videoTrack = combinedStream.getVideoTracks()[0];
        const audioTrack = combinedStream.getAudioTracks()[0];
        
        if (videoTrack) {
          console.log("📹 Video track details:", {
            id: videoTrack.id,
            enabled: videoTrack.enabled,
            readyState: videoTrack.readyState,
            muted: videoTrack.muted,
            contentHint: (videoTrack as any).contentHint,
            settings: videoTrack.getSettings()
          });
        }
        
        if (audioTrack) {
          console.log("🎵 Audio track details:", {
            id: audioTrack.id,
            enabled: audioTrack.enabled,
            readyState: audioTrack.readyState,
            muted: audioTrack.muted,
            contentHint: (audioTrack as any).contentHint,
            settings: audioTrack.getSettings()
          });
        }
        
        console.log("🎬 Setting up native video element for WebRTC stream");
        console.log("Video element before setup:", {
          srcObject: !!videoElement.srcObject,
          src: videoElement.src,
          readyState: videoElement.readyState,
          paused: videoElement.paused,
          muted: videoElement.muted
        });
        
        // Clear any existing sources completely
        console.log("🧹 Clearing video element sources...");
        videoElement.src = '';
        videoElement.srcObject = null;
        videoElement.removeAttribute('src'); // Remove the src attribute entirely
        videoElement.removeAttribute('data-src'); // Remove any data-src attributes
        console.log("✅ Sources cleared, video element state:", {
          src: videoElement.src,
          srcObject: !!videoElement.srcObject,
          hasSrcAttribute: videoElement.hasAttribute('src'),
          hasDataSrcAttribute: videoElement.hasAttribute('data-src')
        });
        
        // Set up the video element for WebRTC
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = true; // Start muted for autoplay
        videoElement.controls = false; // No controls for WebRTC
        videoElement.preload = 'metadata'; // Changed from 'auto' to 'metadata'
        this.isVideoMuted = true;
        
        console.log("✅ Video element configured for WebRTC:", {
          autoplay: videoElement.autoplay,
          playsInline: videoElement.playsInline,
          muted: videoElement.muted,
          controls: videoElement.controls,
          preload: videoElement.preload,
          src: videoElement.src,
          srcObject: !!videoElement.srcObject
        });
        
        // Verify MediaStream is valid before setting
        console.log("🔍 Verifying MediaStream before setting...");
        console.log("MediaStream validation:", {
          isValid: combinedStream instanceof MediaStream,
          id: combinedStream.id,
          active: combinedStream.active,
          trackCount: combinedStream.getTracks().length,
          tracks: combinedStream.getTracks().map(t => ({
            kind: t.kind,
            enabled: t.enabled,
            readyState: t.readyState
          }))
        });
        
        // Set the MediaStream as srcObject
        console.log("🔧 Setting srcObject...");
        videoElement.srcObject = combinedStream;
        console.log("✅ srcObject set, checking state...");
        console.log("Video element after srcObject assignment:", {
          srcObject: !!videoElement.srcObject,
          src: videoElement.src,
          readyState: videoElement.readyState,
          paused: videoElement.paused,
          muted: videoElement.muted
        });
        
        // Check for any interfering attributes or properties
        console.log("🔍 Checking for interfering properties:", {
          currentSrc: videoElement.currentSrc,
          networkState: videoElement.networkState,
          readyState: videoElement.readyState,
          error: videoElement.error,
          // Check if VideoJS is attached
          hasVideoJS: !!(videoElement as any).player,
          // Check for any data attributes that might interfere
          dataAttributes: Array.from(videoElement.attributes)
            .filter((attr) => (attr as Attr).name.startsWith('data-'))
            .map((attr) => ({ name: (attr as Attr).name, value: (attr as Attr).value }))
        });
        
        // Force the video element to load
        videoElement.load();
        console.log("✅ Video element loaded");
        
        // Add a small delay to let the browser process the MediaStream
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force the video element to process the MediaStream by triggering events
        try {
          // Try to access video properties to force processing
          const _ = videoElement.videoWidth;
          const __ = videoElement.videoHeight;
          console.log('📐 Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
        } catch (e) {
          console.log('⚠️ Could not access video dimensions yet');
        }
        
        // Try to force the video element to recognize the stream by playing it briefly
        try {
          console.log('🔄 Attempting to force video processing...');
          await videoElement.play();
          console.log('✅ Forced play successful, pausing...');
          videoElement.pause();
        } catch (forceError) {
          console.log('⚠️ Forced play failed (expected):', forceError);
        }
        
        // Try a different approach - force the video element to process the stream
        console.log('🔄 Trying alternative video processing approach...');
        
        // Method 1: Try setting srcObject again after a delay
        setTimeout(() => {
          console.log('🔄 Re-setting srcObject...');
          videoElement.srcObject = combinedStream;
          videoElement.load();
        }, 200);
        
        // Method 0: Test with a completely new video element
        setTimeout(() => {
          console.log('🔄 Testing with new video element...');
          const testVideo = document.createElement('video');
          testVideo.style.position = 'fixed';
          testVideo.style.top = '200px';
          testVideo.style.left = '10px';
          testVideo.style.width = '200px';
          testVideo.style.height = '150px';
          testVideo.style.zIndex = '9999';
          testVideo.style.border = '2px solid orange';
          testVideo.autoplay = true;
          testVideo.muted = true;
          testVideo.controls = true;
          testVideo.srcObject = combinedStream;
          document.body.appendChild(testVideo);
          
          console.log('🧪 New test video created with MediaStream');
          
          setTimeout(() => {
            console.log('🧪 New test video state:', {
              readyState: testVideo.readyState,
              videoWidth: testVideo.videoWidth,
              videoHeight: testVideo.videoHeight,
              srcObject: !!testVideo.srcObject,
              src: testVideo.src
            });
            
            if (document.body.contains(testVideo)) {
              document.body.removeChild(testVideo);
              console.log('🧪 New test video removed');
            }
          }, 1000);
        }, 100);
        
        // Method 2: Try with different video element attributes
        setTimeout(() => {
          console.log('🔄 Trying with different attributes...');
          videoElement.preload = 'auto';
          videoElement.crossOrigin = 'anonymous';
          videoElement.srcObject = combinedStream;
          videoElement.load();
        }, 400);
        
        // Method 3: Try accessing video properties to force processing
        setTimeout(() => {
          console.log('🔄 Forcing video property access...');
          try {
            const width = videoElement.videoWidth;
            const height = videoElement.videoHeight;
            const duration = videoElement.duration;
            console.log('📐 Forced property access - Width:', width, 'Height:', height, 'Duration:', duration);
          } catch (e) {
            console.log('⚠️ Property access failed:', e);
          }
        }, 600);
        
        // Add event listeners to monitor the video element state
        const onLoadedMetadata = () => {
          console.log("✅ loadedmetadata event fired");
          console.log("Video state after loadedmetadata:", {
            readyState: videoElement.readyState,
            duration: videoElement.duration,
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight
          });
        };
        
        const onCanPlay = () => {
          console.log("✅ canplay event fired");
          console.log("Video state after canplay:", {
            readyState: videoElement.readyState,
            duration: videoElement.duration,
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight
          });
        };
        
        const onError = (event: any) => {
          console.error("❌ Video error event:", event);
          console.error("Video error details:", videoElement.error);
        };
        
        videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.addEventListener('canplay', onCanPlay);
        videoElement.addEventListener('error', onError);
        
        console.log("Video element after setup:", {
          srcObject: !!videoElement.srcObject,
          src: videoElement.src,
          readyState: videoElement.readyState,
          paused: videoElement.paused,
          muted: videoElement.muted
        });
        
        // Wait for the video to be ready
        if (videoElement.readyState < 2) {
          console.log("⏳ Waiting for video to be ready...");
          console.log("Current readyState:", videoElement.readyState);
          
          // Test if video elements work at all with a simple canvas stream
          console.log("🧪 Testing video element with canvas stream...");
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'blue';
            ctx.fillRect(0, 0, 320, 240);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('Test', 10, 50);
            
            const canvasStream = canvas.captureStream(30);
            const testVideo = document.createElement('video');
            testVideo.style.position = 'fixed';
            testVideo.style.top = '10px';
            testVideo.style.left = '10px';
            testVideo.style.width = '100px';
            testVideo.style.height = '75px';
            testVideo.style.zIndex = '9999';
            testVideo.style.border = '2px solid green';
            testVideo.autoplay = true;
            testVideo.muted = true;
            testVideo.srcObject = canvasStream;
            document.body.appendChild(testVideo);
            
            setTimeout(() => {
              console.log("🧪 Canvas test video state:", {
                readyState: testVideo.readyState,
                videoWidth: testVideo.videoWidth,
                videoHeight: testVideo.videoHeight
              });
              if (document.body.contains(testVideo)) {
                document.body.removeChild(testVideo);
              }
            }, 1000);
          }
          
          await new Promise<void>((resolve) => {
            const onReady = () => {
              console.log("✅ Video ready event fired");
              videoElement.removeEventListener('loadedmetadata', onReady);
              videoElement.removeEventListener('canplay', onReady);
              videoElement.removeEventListener('loadeddata', onReady);
              resolve();
            };
            
            videoElement.addEventListener('loadedmetadata', onReady);
            videoElement.addEventListener('canplay', onReady);
            videoElement.addEventListener('loadeddata', onReady);
            
            // Also listen for any errors
            const onError = (error: any) => {
              console.error("❌ Video error during ready wait:", error);
              videoElement.removeEventListener('error', onError);
            };
            videoElement.addEventListener('error', onError);
            
            setTimeout(() => {
              console.log("⏰ Timeout reached, forcing continue...");
              videoElement.removeEventListener('loadedmetadata', onReady);
              videoElement.removeEventListener('canplay', onReady);
              videoElement.removeEventListener('loadeddata', onReady);
              videoElement.removeEventListener('error', onError);
              resolve();
            }, 5000);
          });
        }
        
        // If video is still not ready after timeout, try a different approach
        if (videoElement.readyState < 2) {
          console.log("⚠️ Video still not ready after timeout, trying alternative approach...");
          
          // Try multiple approaches to get the video working
          let workingVideoElement = null;
          
          // Approach 1: New video element with aggressive settings
          const newVideoElement = document.createElement('video');
          newVideoElement.autoplay = true;
          newVideoElement.playsInline = true;
          newVideoElement.muted = true;
          newVideoElement.controls = false;
          newVideoElement.preload = 'auto'; // Try 'auto' instead of 'metadata'
          newVideoElement.crossOrigin = 'anonymous'; // Add cross-origin
          
          // Set the MediaStream
          newVideoElement.srcObject = combinedStream;
          
          // Force load and wait a bit
          newVideoElement.load();
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Check if this approach worked
          if (newVideoElement.readyState >= 1) {
            console.log("✅ New video element approach worked!");
            workingVideoElement = newVideoElement;
          } else {
            console.log("❌ New video element approach failed, trying approach 2...");
            
            // Approach 2: Try with different preload settings
            const altVideoElement = document.createElement('video');
            altVideoElement.autoplay = true;
            altVideoElement.playsInline = true;
            altVideoElement.muted = true;
            altVideoElement.controls = false;
            altVideoElement.preload = 'metadata';
            
            // Try setting srcObject after a delay
            setTimeout(() => {
              altVideoElement.srcObject = combinedStream;
              altVideoElement.load();
            }, 100);
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            if (altVideoElement.readyState >= 1) {
              console.log("✅ Alternative approach worked!");
              workingVideoElement = altVideoElement;
            } else {
              console.log("❌ Alternative approach also failed, using original element");
              workingVideoElement = newVideoElement; // Use the first one anyway
            }
          }
          
                      // Replace the old video element
            const container = videoElement.parentElement;
            if (container && workingVideoElement) {
              container.replaceChild(workingVideoElement, videoElement);
              // Update the target reference
              this.target.nativeElement = workingVideoElement;
              console.log("✅ Replaced video element with new one");
              
              // Use the working video element for the rest of the function
              const updatedVideoElement = workingVideoElement;
            
            console.log("Video element state before play attempt:", {
              readyState: updatedVideoElement.readyState,
              paused: updatedVideoElement.paused,
              muted: updatedVideoElement.muted,
              srcObject: !!updatedVideoElement.srcObject,
              src: updatedVideoElement.src,
              currentTime: updatedVideoElement.currentTime,
              duration: updatedVideoElement.duration
            });
            
            // Try to play immediately
            try {
              console.log("▶️ Attempting to play WebRTC stream...");
              await updatedVideoElement.play();
              console.log("✅ WebRTC stream started playing (muted)");
              this.showUnmuteNotification();
            } catch (error: any) {
              console.warn("⚠️ WebRTC autoplay failed:", error);
              console.error("Play error details:", {
                name: error.name,
                message: error.message,
                code: error.code
              });
              
              if (error.name === 'NotAllowedError') {
                console.log("🔇 WebRTC autoplay blocked, showing play button");
                this.showPlayButton(updatedVideoElement);
              } else {
                console.error("❌ WebRTC play error:", error);
                
                // Try a fallback approach - wait a bit and try again
                console.log("🔄 Trying fallback play approach...");
                setTimeout(async () => {
                  try {
                    console.log("🔄 Fallback: Attempting to play again...");
                    await updatedVideoElement.play();
                    console.log("✅ Fallback play successful!");
                    this.showUnmuteNotification();
                  } catch (fallbackError: any) {
                    console.error("❌ Fallback play also failed:", fallbackError);
                    this.showPlayButton(updatedVideoElement);
                  }
                }, 1000);
              }
            }
            return; // Exit early since we handled the new video element
          }
        }
        
        console.log("Video element state before play attempt:", {
          readyState: videoElement.readyState,
          paused: videoElement.paused,
          muted: videoElement.muted,
          srcObject: !!videoElement.srcObject,
          src: videoElement.src,
          currentTime: videoElement.currentTime,
          duration: videoElement.duration
        });
        
        // Try to play immediately
        try {
          console.log("▶️ Attempting to play WebRTC stream...");
          await videoElement.play();
          console.log("✅ WebRTC stream started playing (muted)");
          this.showUnmuteNotification();
        } catch (error: any) {
          console.warn("⚠️ WebRTC autoplay failed:", error);
          console.error("Play error details:", {
            name: error.name,
            message: error.message,
            code: error.code
          });
          
          if (error.name === 'NotAllowedError') {
            console.log("🔇 WebRTC autoplay blocked, showing play button");
            this.showPlayButton(videoElement);
          } else {
            console.error("❌ WebRTC play error:", error);
            
            // Try a fallback approach - wait a bit and try again
            console.log("🔄 Trying fallback play approach...");
            setTimeout(async () => {
              try {
                console.log("🔄 Fallback: Attempting to play again...");
                await videoElement.play();
                console.log("✅ Fallback play successful!");
                this.showUnmuteNotification();
              } catch (fallbackError: any) {
                console.error("❌ Fallback play also failed:", fallbackError);
                this.showPlayButton(videoElement);
              }
            }, 1000);
          }
        }
      } else {
        console.error("❌ No video element found for WebRTC stream");
      }
    } else {
      console.log("⏳ Waiting for both tracks...", {
        audio: !!this.audioTrack,
        video: !!this.videoTrack
      });
    }
  }

  addRemoteVideo(id: any) {
    // let existElement = this.findRemoteVideo(id);
    // if (existElement) {
    //   console.warn("remoteVideo element ALREADY exist for id=" + id);
    //   return existElement;
    // }

    // let element = document.createElement("video");
    // this.remote_container.nativeElement.appendChild(element);
    // element.id = "remote";
    // element.style.marginLeft = "auto"
    // element.style.marginRight = "auto"
    // element.style.width = "54%"
    // element.cla
    // element.width = 240;
    // element.height = 180;
    // element.volume = 1;
    //element.controls = true;
    // element.style.border = "solid black 1px;";
    // let player = videojs(this.target.nativeElement,{
    //   fluid: true,
    //   aspectRatio: '16:9',
    //   autoplay: true,
    // })

    return this.player;
  }

  @HostListener("window:unload", ["$event"])
  ngOnDestroy(): void {
    console.log("ng on ondestroy");
    this.disconnect();
    let video = document.getElementById("remote");
    video?.remove();
  }

  findRemoteVideo(id: any) {
    let element = document.getElementById("remote_" + id);
    return element;
  }

  removeRemoteVideo(id: any) {
    console.log(" ---- removeRemoteVideo() id=" + id);
    let element = document.getElementById("remote_" + id);
    if (element) {
      (element as any).pause();
      (element as any).srcObject = null;
      this.remote_container.nativeElement.removeChild(element);
    } else {
      console.log("child element NOT FOUND");
    }
  }

  removeAllRemoteVideo() {
    while (this.remote_container.nativeElement.firstChild) {
      (this.remote_container.nativeElement.firstChild as any).pause();
      (this.remote_container.nativeElement.firstChild as any).srcObject = null;
      this.remote_container.nativeElement.removeChild(
        this.remote_container.nativeElement.firstChild
      );
    }
  }

  // ============ UI button ==========
  async apiCall() {
    this.videoService
      .startLiveStream(this.liveStreamId)
      .subscribe(async (res) => {
        console.log(res, "check res");
        // await this.connectSocket()
        await this.subscribe();
      });
  }
  async addUserToRoom() {}
  // async subscribe() {
  //   if (!this.isSocketConnected()) {
  //     let toast = this.toasterService.info(
  //       "You have subscribed the video. Please wait..."
  //     );
  //     setTimeout(() => {
  //       this.toasterService.remove(toast.toastId);
  //     }, 2000);
  //     try {
  //       await this.connectSocket();
  //       // --- get capabilities --
  //       const data = await this.sendRequest(
  //         `getRouterRtpCapabilities${this.liveStreamId}`,
  //         {}
  //       );
  //       console.log("getRouterRtpCapabilities:", data);
  //       await this.loadDevice(data);
  //       this.updateButtons();
  //       // --- prepare transport ---
  //       console.log("--- createConsumerTransport --");
  //       const params = await this.sendRequest(
  //         `createConsumerTransport${this.liveStreamId}`,
  //         {
  //           userId: this.userId,
  //           latitude: this.latitude,
  //           longitude: this.longitude,
  //           platform: this.platform,
  //         }
  //       );
  //       console.log(params, "params");

  //       this.socket.on("bandwidthUsed", (data: any) => {
  //         let toast = this.toasterService.warning(
  //           `${data.bandwidthUsed.toFixed(2)} mb used`
  //         );
  //         setTimeout(() => {
  //           this.toasterService.remove(toast.toastId);
  //         }, 1000);
  //       });
  //       this.socket.on("endBandwidth", (data: any) => {
  //         let toast = this.toasterService.error(`${data.message}`);
  //         setTimeout(() => {
  //           this.toasterService.remove(toast.toastId);
  //         }, 5000);
  //       });
  //       console.log("transport params:", params);
  //       this.consumerTransport = (this.device as any).createRecvTransport(
  //         params
  //       );
  //       console.log("createConsumerTransport:", this.consumerTransport);

  //       // --- NG ---
  //       //sendRequest('connectConsumerTransport', { dtlsParameters: dtlsParameters })
  //       //  .then(callback)
  //       //  .catch(errback);

  //       // --- try --- not well
  //       //sendRequest('connectConsumerTransport', { dtlsParameters: params.dtlsParameters })
  //       //  .then(() => console.log('connectConsumerTransport OK'))
  //       //  .catch(err => console.error('connectConsumerTransport ERROR:', err));

  //       // --- join & start publish --
  //       (this.consumerTransport as any).on(
  //         "connect",
  //         async ({ dtlsParameters }: any, callback: any, errback: any) => {
  //           console.log("--consumer trasnport connect");
  //           let obj = {
  //             connected: true,
  //             tabs: 1,
  //           };
  //           let exists = localStorage.getItem("connected");
  //           if (!exists) {
  //             localStorage.setItem("connected", JSON.stringify(obj));
  //             this.sendRequest(`connectConsumerTransport${this.liveStreamId}`, {
  //               dtlsParameters: dtlsParameters,
  //               increment: true,
  //             })
  //               .then()
  //               .then(callback)
  //               .catch(errback);
  //           } else {
  //             let parsedObj = JSON.parse(exists);
  //             parsedObj.tabs += 1;
  //             localStorage.setItem("connected", JSON.stringify(parsedObj));
  //             this.sendRequest(`connectConsumerTransport${this.liveStreamId}`, {
  //               dtlsParameters: dtlsParameters,
  //               increment: false,
  //             })
  //               .then()
  //               .then(callback)
  //               .catch(errback);
  //           }

  //           //consumer = await consumeAndResume(consumerTransport);
  //         }
  //       );

  //       (this.consumerTransport as any).on(
  //         "connectionstatechange",
  //         (state: any) => {
  //           switch (state) {
  //             case "connecting":
  //               console.log("subscribing...");
  //               break;

  //             case "connected":
  //               this.videoRendered = true;
  //               this.spinnerService.setLoading(false);
  //               console.log("subscribed");
  //               break;

  //             case "failed":
  //               console.log("failed");
  //               (this.consumerTransport as any).close();
  //               break;

  //             default:
  //               break;
  //           }
  //         }
  //       );

  //       (this.videoConsumer as any) = await this.consumeAndResume(
  //         this.consumerTransport,
  //         "video"
  //       );
  //       (this.audioConsumer as any) = await this.consumeAndResume(
  //         this.consumerTransport,
  //         "audio"
  //       );

  //       this.updateButtons();
  //     } catch (error) {}
  //   }
  // }
// In viewer.component.ts, update the subscribe method:

private async checkStreamStatus() {
  try {
    console.log("Checking stream status for:", this.liveStreamId);
    
    // **FIXED**: Use the correct backend for stream status
    const url = `${environment.socketUrl}/api/livestream/stream-status/${this.liveStreamId}`;
    console.log("Stream status URL:", url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Stream status response:", data);
    
    if (!data.active) {
      throw new Error("Stream is not active or not found");
    }
    
    return data;
    
  } catch (error) {
    console.error("Stream status check failed:", error);
    throw error;
  }
}

async subscribe() {
  console.log("🌐 Starting WebRTC subscription process...");
  
  if (!this.isSocketConnected()) {
    try {
      // **1. Check stream status from VOD_BE (port 3005)**
      console.log("📡 Checking stream status...");
      await this.checkStreamStatus();
      console.log("✅ Stream is active, proceeding with connection...");
      
      let toast = this.toasterService.info("Connecting to stream...");
      setTimeout(() => {
        this.toasterService.remove(toast.toastId);
      }, 2000);
      
      // **2. Connect to Video-Processing server (port 3000) for WebRTC**
      console.log("🔌 Connecting to Video-Processing server...");
      await this.connectSocket();

      // **3. Get router capabilities from Video-Processing server**
      console.log("Getting router capabilities...");
      const data = await this.sendRequest(
        `getRouterRtpCapabilities${this.liveStreamId}`,
        {}
      );
      
      if (!data) {
        throw new Error("Failed to get router capabilities");
      }
      
      console.log("Router capabilities received");
      await this.loadDevice(data);
      this.updateButtons();
      
      // **4. Continue with MediaSoup connection...**
      console.log("Creating consumer transport...");
      // const params = await this.sendRequest(
      //   `createConsumerTransport${this.liveStreamId}`,
      //   {
      //     userId: this.userId,
      //     latitude: this.latitude,
      //     longitude: this.longitude,
      //     platform: this.platform,
      //     increment: true,
      //   }
      // );
      
      // if (!params || Object.keys(params).length === 0) {
      //   throw new Error("Failed to create consumer transport");
      // }
      const params = await this.sendRequest(
        `createConsumerTransport${this.liveStreamId}`,
        {
          userId: this.userId,
          latitude: this.latitude,
          longitude: this.longitude,
          platform: this.platform,
          increment: true,
        }
      );

      console.log("=== SERVER RESPONSE ===");
      console.log("Raw response:", params);
      
      // **IMPROVED ERROR HANDLING**
      if (!params) {
        throw new Error("Server returned null/undefined response");
      }
      
      if (params && typeof params === 'object' && 'error' in params && (params as any).error === "STREAM_NOT_ACTIVE") {
        throw new Error("Stream is not currently broadcasting. Please try again later.");
      }
      
      if (Object.keys(params).length === 0) {
        throw new Error("Unable to connect to stream. This may be due to bandwidth limitations or the stream may have ended.");
      }
      
      
      console.log("Transport params received");
      
      // **5. Create consumer transport**
      this.consumerTransport = (this.device as any).createRecvTransport(params);
      
      (this.consumerTransport as any).on("connect", ({ dtlsParameters }: any, callback: any, errback: any) => {
        console.log("--consumer transport connect");
        this.sendRequest(`connectConsumerTransport${this.liveStreamId}`, {
          dtlsParameters,
        })
          .then(callback)
          .catch(errback);
      });

      (this.consumerTransport as any).on("consume", ({ rtpCapabilities }: any, callback: any, errback: any) => {
        console.log("--consumer transport consume");
        this.sendRequest(`consume${this.liveStreamId}`, {
          rtpCapabilities,
        })
          .then(callback)
          .catch(errback);
      });

      // **6. Consume video and audio tracks**
      console.log("Consuming video track...");
      this.videoConsumer = await this.consumeAndResume(this.consumerTransport, "video");
      
      console.log("Consuming audio track...");
      this.audioConsumer = await this.consumeAndResume(this.consumerTransport, "audio");
      
      console.log("✅ WebRTC connection established successfully");
      
      // **7. Set up event listeners for new consumers**
      this.socket.on(`newConsumer${this.liveStreamId}`, async (data: any) => {
        console.log("New consumer event:", data);
        const { kind } = data;
        
        if (kind === "video" && !this.videoConsumer) {
          this.videoConsumer = await this.consumeAndResume(this.consumerTransport, "video");
        } else if (kind === "audio" && !this.audioConsumer) {
          this.audioConsumer = await this.consumeAndResume(this.consumerTransport, "audio");
        }
      });
      
    } catch (error: any) {
      console.error("Error in subscribe:", error);
            // **BETTER ERROR MESSAGES**
      let errorMessage = "Failed to connect to stream";
      if (error.message.includes("bandwidth")) {
        errorMessage = "Bandwidth limit reached. Please upgrade your subscription.";
      } else if (error.message.includes("STREAM_NOT_ACTIVE")) {
        errorMessage = "Stream is not currently broadcasting. Please try again later.";
      } else if (error.message.includes("empty object")) {
        errorMessage = "Unable to connect. The stream may have ended or you may have reached your bandwidth limit.";
      }
      
      this.toasterService.error(errorMessage);
      this.toasterService.error("Failed to connect to stream: " + error.message);
    }
  }
}

  async consumeAndResume(transport: any, kind: any) {
    const consumer = await this.consume(this.consumerTransport, kind);
    if (consumer) {
      console.log("-- track exist, consumer ready. kind=" + kind);
      this.updateButtons();
      if (kind === "video") {
        console.log("-- resume kind=" + kind);
        this.sendRequest(`resume${this.liveStreamId}`, { kind: kind })
          .then(() => {
            console.log("resume OK");
            return consumer;
          })
          .catch((err) => {
            console.error("resume ERROR:", err);
            return consumer;
          });
      } else {
        console.log("-- do not resume kind=" + kind);
        return null;
      }
    } else {
      console.log("-- no consumer yet. kind=" + kind);
      return null;
    }

    return null;
  }

  disconnect() {
    if (this.videoConsumer) {
      (this.videoConsumer as any).close();
      this.videoConsumer = null;
    }
    if (this.audioConsumer) {
      (this.audioConsumer as any).close();
      this.audioConsumer = null;
    }
    if (this.consumerTransport) {
      (this.consumerTransport as any).close();
      this.consumerTransport = null;
    }

    this.removeAllRemoteVideo();

    this.disconnectSocket();
    this.updateButtons();
    this.router.navigate(["/dashboard"]);
  }

  async loadDevice(routerRtpCapabilities: any) {
    try {
      (this.device as any) = new mediaSoup.Device();
    } catch (error: any) {
      if (error.name === "UnsupportedError") {
        console.error("browser not supported");
      }
    }
    await (this.device as any).load({ routerRtpCapabilities });
  }

  async consume(transport: any, trackKind: any) {
    console.log("🎯 Starting consume for kind:", trackKind);
    
    if (!this.device) {
      console.error("❌ MediaSoup device not initialized");
      return null;
    }
    
    const { rtpCapabilities }: any = this.device;
    console.log("📡 RTP Capabilities:", rtpCapabilities);
    
    try {
      const data = await this.sendRequest(`consume${this.liveStreamId}`, {
        rtpCapabilities: rtpCapabilities,
        kind: trackKind,
      });
      
      console.log("📡 Consume response:", data);
      
      if (!data) {
        console.warn("⚠️ No data received from consume request");
        return null;
      }
      
      const { producerId, id, kind, rtpParameters }: any = data;

      if (producerId) {
        console.log("✅ Producer found, creating consumer...");
        let codecOptions = {};
        const consumer = await transport.consume({
          id,
          producerId,
          kind,
          rtpParameters,
          codecOptions,
        });
        
        console.log("✅ Consumer created:", {
          id: consumer.id,
          kind: consumer.kind,
          trackId: consumer.track?.id,
          trackKind: consumer.track?.kind,
          trackEnabled: consumer.track?.enabled,
          trackReadyState: consumer.track?.readyState
        });

        // Validate the track before adding it
        if (!consumer.track) {
          console.error("❌ Consumer track is null or undefined");
          return null;
        }

        if (consumer.track.readyState !== 'live') {
          console.warn("⚠️ Track is not live yet, waiting...");
          // Wait for track to become live
          await new Promise<void>((resolve) => {
            const checkTrackState = () => {
              if (consumer.track.readyState === 'live') {
                console.log("✅ Track is now live");
                resolve();
              } else {
                console.log("⏳ Track still not live, checking again...");
                setTimeout(checkTrackState, 100);
              }
            };
            checkTrackState();
            
            // Timeout after 10 seconds
            setTimeout(() => {
              console.warn("⏰ Track live timeout reached");
              resolve();
            }, 10000);
          });
        }

        // Add the track to the video element
        await this.addRemoteTrack(this.clientId, consumer.track);

        console.log("✅ Consume completed successfully");
        return consumer;
      } else {
        console.warn("⚠️ Remote producer NOT READY for kind:", trackKind);
        return null;
      }
    } catch (error: any) {
      console.error("❌ Consume error:", error);
      return null;
    }
  }

  // ---- UI control ----
  updateButtons() {
    if (this.isSocketConnected()) {
      this.enabelElement(this.disconnect_button.nativeElement);
    } else {
      this.disableElement(this.disconnect_button.nativeElement);
    }

    if (this.consumerTransport) {
      this.disableElement(this.subscribe_button.nativeElement);
    } else {
      this.enabelElement(this.subscribe_button.nativeElement);
    }
  }

  enabelElement(element: any) {
    if (element) {
      element.removeAttribute("disabled");
    }
  }

  disableElement(element: any) {
    if (element) {
      element.setAttribute("disable", "1");
    }
  }
}
