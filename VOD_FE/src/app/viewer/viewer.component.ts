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

// **NEW: RTMP Player Setup**
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
      autoplay: true,
      sources: videoSources,
    },
    () => {
      console.log("RTMP Player ready");
      this.setupPlayerEventHandlers();
      
      if (adTagUrl != "") {
        this.player.ima(imaOptions);
      }
    }
  );

  // Error handling for RTMP streams
  const retryOnError = () => {
    console.log("RTMP stream error. Retrying...");
    setTimeout(() => {
      this.player.src({
        src: this.liveStreamKeyUrl,
        type: "application/x-mpegURL",
      });
      this.player.play();
    }, 5000);
  };

  this.player.on("error", retryOnError);
}

// **NEW: WebRTC Player Setup**
private setupWebRTCPlayer(adTagUrl: string, imaOptions: any) {
  console.log("Setting up VideoJS for WebRTC stream (no video sources)");
  
  // Create VideoJS player WITHOUT sources (WebRTC will provide video)
  this.player = videojs(
    this.target.nativeElement,
    {
      fluid: true,
      aspectRatio: "16:9",
      autoplay: true,
      sources: [], // **IMPORTANT: No sources for WebRTC**
    },
    () => {
      console.log("WebRTC Player ready");
      this.setupPlayerEventHandlers();
      
      // Hide VideoJS error display since we're using WebRTC
      let ele = document.querySelector(".vjs-error-display");
      this.rendered.setStyle(ele, "display", "none");
      
      // **START WEBRTC CONNECTION**
      console.log("Starting WebRTC subscription...");
      this.subscribe();
      
      // Handle ads after WebRTC connection
      if (adTagUrl != "") {
        this.handleWebRTCAds(adTagUrl, imaOptions);
      }
    }
  );
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
      console.log("Connecting to:", environment.socketUrl);
      console.log("Stream ID:", this.liveStreamId);
      console.log("Attempts left:", attemptsLeft);
      
      // **Use the Video-Processing server for WebRTC streams**
      this.socket = io(environment.socketUrl, {
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

  // return Promise
  playVideo(element: any, stream: any) {
    console.log(element, "check element");
    if (element.srcObject) {
      console.warn("element ALREADY playing, so ignore");
      return;
    }
    element.srcObject = stream;
    element.volume = 1;
    console.log(element.srcObject, stream, "Element stream");
    // this.player.play()
    element.play();
    this.player.currentTime(1000)
    // this.updateTimePassed();
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

  addRemoteTrack(id: any, track: any) {
    const newStream = new MediaStream();
    newStream.addTrack(track);

    if (track.kind === "audio") {
      this.audioTrack = track;
    } else if (track.kind === "video") {
      this.videoTrack = track;
    }

    // Play only when both audio and video tracks are available
    if (this.audioTrack && this.videoTrack) {
      const combinedStream = new MediaStream([
        this.audioTrack,
        this.videoTrack,
      ]);
      this.playVideo(this.target.nativeElement, combinedStream);
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

private async checkStreamStatus() {
  try {
    console.log("Checking stream status for:", this.liveStreamId);
    
    // Use the correct URL for stream status (VOD_BE backend)
    const url = `${environment.streamUrl}/livestream/stream-status/${this.liveStreamId}`;
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
  if (!this.isSocketConnected()) {
    try {
      // **1. Check stream status from VOD_BE (port 3005)**
      console.log("Checking stream status...");
      await this.checkStreamStatus();
      console.log("Stream is active, proceeding with connection...");
      
      let toast = this.toasterService.info("Connecting to stream...");
      setTimeout(() => {
        this.toasterService.remove(toast.toastId);
      }, 2000);
      
      // **2. Connect to Video-Processing server (port 3000) for WebRTC**
      console.log("Connecting to Video-Processing server...");
      await this.connectSocket();

            try {
        const routerCaps = await this.sendRequest(
          `getRouterRtpCapabilities${this.liveStreamId}`,
          {}
        );
        console.log("✅ Router capabilities received:", !!routerCaps);
      } catch (error) {
        console.error("❌ Failed to get router capabilities:", error);
        throw new Error("Stream not found on Video-Processing server. Make sure broadcaster is active.");
      }
      
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
      
      // ... rest of your existing MediaSoup logic
      
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
    console.log("--start of consume --kind=" + trackKind);
    const { rtpCapabilities }: any = this.device;
    //const data = await socket.request('consume', { rtpCapabilities });
    const data = await this.sendRequest(`consume${this.liveStreamId}`, {
      rtpCapabilities: rtpCapabilities,
      kind: trackKind,
    }).catch((err) => {
      console.error("consume ERROR:", err);
    });
    const { producerId, id, kind, rtpParameters }: any = data;

    if (producerId) {
      let codecOptions = {};
      const consumer = await transport.consume({
        id,
        producerId,
        kind,
        rtpParameters,
        codecOptions,
      });
      //const stream = new MediaStream();
      //stream.addTrack(consumer.track);

      this.addRemoteTrack(this.clientId, consumer.track);

      console.log("--end of consume");
      //return stream;

      return consumer;
    } else {
      console.warn("--- remote producer NOT READY");

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
