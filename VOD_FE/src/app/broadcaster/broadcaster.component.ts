import {
  Component,
  EventEmitter,
  OnInit,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
  AfterViewInit,
  Inject,
  HostListener,
} from "@angular/core";
import { Socket, SocketIoModule, SocketIoConfig } from "ngx-socket-io";
import { VideoService } from "../services/video.service";
import * as mediaSoup from "mediasoup-client";
import io from "socket.io-client";
import { environment } from "src/environments/environment";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { ToastrService } from "ngx-toastr";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";

@Component({
  selector: "app-broadcaster",
  templateUrl: "./broadcaster.component.html",
  styleUrls: ["./broadcaster.component.scss"],
})
export class BroadcasterComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild("local_video") localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild("state_span") stateSpan!: ElementRef<HTMLSpanElement>;
  @ViewChild("use_audio") use_audio!: ElementRef<HTMLInputElement>;
  @ViewChild("use_video") use_video!: ElementRef<HTMLInputElement>;
  @ViewChild("start_video_button")
  start_video_button!: ElementRef<HTMLButtonElement>;
  @ViewChild("stop_video_button")
  stop_video_button!: ElementRef<HTMLButtonElement>;
  @ViewChild("publish_button") publish_button!: ElementRef<HTMLButtonElement>;
  @ViewChild("camera_button") camera_button!: ElementRef<HTMLButtonElement>;
  @ViewChild("disconnect_button")
  disconnect_button!: ElementRef<HTMLButtonElement>;
  localStream = null;
  clientId = null;
  // device = null;
  thumbnailIntervalId!: any;
  device: mediaSoup.Device | null = null;
  producerTransport: mediaSoup.types.Transport | null = null;
  videoProducer: mediaSoup.types.Producer | null = null;
  audioProducer: mediaSoup.types.Producer | null = null;
  socket!: any;
  socketBe!: any;
  streamId: any = "";
  published: boolean = false;
  connectedUsers: any = 0;
  isConnecting: boolean = false;
  isPublishing: boolean = false;
  connectionState: string = 'disconnected';
  error = "";
  recordingStarted: boolean = false;
  activePlan: any;
  link: any;
  usageTableId: any;
  storageEnd: boolean = false;
  buttonDisabled: boolean = true;
  canRecord: boolean = false;
  ipAddress!: string;
  location!: string;
  city!: string;
  region!: string;
  country!: string;
  latitude!: string;
  longitude!: string;
  constructor(
    // private socketV: Socket,
    private videoService: VideoService,
    public dialog: MatDialog,
    private router: Router,
    private toaster: ToastrService // private simpleWebRTCService:SimpleWebRTCService
  ) {
    this.link = environment.UI_URL;
  }

  ngOnInit(): void {
    this.videoService.getCurrentSubscription().subscribe((res) => {
      console.log((res as any).body.data, "check res");
      this.connectSocket();
      if (Number((res as any).body.data.storageLeft) < 1) {
        this.storageEnd = true;
      }
      this.activePlan = (res as any).body.data;
    });
  }
async ngAfterViewInit(): Promise<void> {
  console.log("Component initialized");
  
  // Check device support first
  if (!this.checkDeviceSupport()) {
    this.error = "Your browser does not support WebRTC";
    return;
  }
  
  this.updateButtons();
  console.log("=== ready ===");
  this.published = false;
  this.startMedia();
}
// In broadcaster.component.ts - Fix the socket connection
async connectSocket() {
  // Close existing socket
  if (this.socket) {
    this.socket.close();
    this.socket = null;
    this.clientId = null;
  }

  const tryConnect = (attemptsLeft: number) => {
    return new Promise<void>((resolve, reject) => {
      console.log("=== SOCKET CONNECTION ATTEMPT ===");
      console.log("Stream ID:", this.streamId);
      console.log("Attempts left:", attemptsLeft);
      
      const socketUrl = environment.socketUrl; // Should be http://localhost:3000
      console.log("Connecting to:", socketUrl);
      
      this.socket = io(socketUrl, {
        autoConnect: true,
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
        reconnection: false // Disable auto-reconnection for manual control
      });

      let connected = false;
      let timeoutId = setTimeout(() => {
        if (!connected && attemptsLeft > 0) {
          console.log(`Connection timeout. Retrying... Attempts left: ${attemptsLeft - 1}`);
          this.socket.disconnect();
          tryConnect(attemptsLeft - 1).then(resolve).catch(reject);
        } else if (attemptsLeft === 0) {
          console.error("❌ All connection attempts failed");
          reject(new Error("Connection failed after all attempts"));
        }
      }, 20000);

      this.socket.on("connect", () => {
        console.log("✅ Socket connected successfully");
        console.log("Socket ID:", this.socket.id);
        connected = true;
        clearTimeout(timeoutId);
        
        // Send welcome message immediately
        this.socket.emit(`message${this.streamId}`, { type: "join", streamId: this.streamId });
        
        resolve();
      });

      this.socket.on("connect_error", (error: any) => {
        console.error("❌ Socket connection error:", error);
        clearTimeout(timeoutId);
        if (attemptsLeft > 0 && !connected) {
          console.log(`Retrying connection... Attempts left: ${attemptsLeft - 1}`);
          tryConnect(attemptsLeft - 1).then(resolve).catch(reject);
        } else {
          reject(new Error(`Connection error: ${error.message || error}`));
        }
      });

      this.socket.on("disconnect", (reason: any) => {
        console.log("Socket disconnected:", reason);
        connected = false;
      });

      // **IMPORTANT**: Listen for welcome message
      this.socket.on(`message${this.streamId}`, (message: any) => {
        console.log("Received message:", message);
        
        if (message.type === "welcome") {
          this.clientId = message.id;
          console.log("✅ Received welcome, clientId:", this.clientId);
          this.canRecord = true;
        }
      });

      // Add error handler
      this.socket.on("error", (error: any) => {
        console.error("Socket error:", error);
      });
    });
  };

  return tryConnect(3);
}
  connectSocketBe() {
    if (this.socketBe) {
      this.socketBe.close();
      this.socketBe = null;
    }
    console.log("Connection establishing");
    return new Promise<void>((resolve, reject) => {
      console.log("Connection established");

      this.socketBe = io(environment.socketUrlBe, {
        autoConnect: true,
        transports: ["websocket", "polling"],
      }).connect();
      console.log(this.socketBe, "Socket");

      // Event handlers
      this.socketBe.on("connect", function (evt: any) {
        console.log("socket.io be connected()");
        resolve(evt);
      });

      this.socketBe.on(`error${this.streamId}`, function (err: any) {
        console.error("socket.io ERROR:", err);
        reject(err);
      });
    });
  }

  disconnectSocket() {
    console.log("=== DISCONNECTING SOCKET ===");
    console.log("Stream ID:", this.streamId);
    console.log("Published:", this.published);
    console.log("Is Publishing:", this.isPublishing);
    
    if (this.socket) {
      // Send disconnect event to server before closing
      if (this.streamId) {
        this.socket.emit(`disconnect${this.streamId}`, { 
          decrement: false,
          reason: 'broadcaster_disconnect'
        });
      }
      
      this.socket.close();
      this.socket = null;
      this.clientId = null;
      console.log("✅ Socket disconnected");
    }
  }

  isSocketConnected() {
    if (this.socket) {
      return true;
    } else {
      return false;
    }
  }

  @HostListener("window:unload", ["$event"])
  ngOnDestroy(): void {
    this.stopMedia();
    if (this.streamId && this.published) {
      this.stopThumbnailInterval();
      this.videoService
        .endLiveStream(this.streamId, this.recordingStarted, this.usageTableId)
        .subscribe(async (res) => {
          console.log(res, "Res ended");
        });
      this.sendRequest(`disconnect${this.streamId}`, {});
      console.log(this.socket, "on destroy broadcast");
      this.disconnect();
    }
  }
// Update your sendRequest method to better handle errors
async sendRequest(type: any, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!this.socket || !this.socket.connected) {
      reject(new Error("Socket not connected"));
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout for ${type}`));
    }, 30000);

    console.log(`📤 Sending ${type}:`, data);

    this.socket.emit(type, data, (err: any, response: any) => {
      clearTimeout(timeout);
      
      console.log(`📥 Response for ${type}:`, { err, response });
      
      if (!err) {
        resolve(response);
      } else {
        // Better error logging
        console.error(`❌ Error in ${type}:`, err);
        if (typeof err === 'object') {
          console.error('Error details:', JSON.stringify(err, null, 2));
        }
        reject(new Error(typeof err === 'string' ? err : JSON.stringify(err)));
      }
    });
  });
}
checkDeviceSupport(): boolean {
  try {
    // Check if MediaSoup Device is supported
    const testDevice = new mediaSoup.Device();
    return true;
  } catch (error: any) {
    if (error.name === 'UnsupportedError') {
      console.error('Browser not supported for MediaSoup');
      return false;
    }
    return true; // Other errors might be recoverable
  }
}

// start_recording() {
//   console.log("=== Start Recording Debug ===");
//   console.log("Can record:", this.canRecord);
//   console.log("Published:", this.published);
//   console.log("Socket connected:", this.socket?.connected);
//   console.log("Storage end:", this.storageEnd);
//   console.log("Recording started:", this.recordingStarted);
//   console.log("Stream ID:", this.streamId);
//   console.log("Video Producer exists:", !!this.videoProducer);
//   console.log("Audio Producer exists:", !!this.audioProducer);

//   // Enhanced validation
//   if (!this.canRecord) {
//     console.error("Cannot record - canRecord is false");
//     this.toaster.error("Please wait for connection to establish");
//     return;
//   }
  
//   if (!this.published) {
//     console.error("Cannot record - not published");
//     this.toaster.error("Please publish stream first");
//     return;
//   }
  
//   if (!this.socket || !this.socket.connected) {
//     console.error("Cannot record - socket not connected");
//     this.toaster.error("Socket connection lost");
//     return;
//   }
  
//   // **NEW: Check if producers exist**
//   if (!this.videoProducer && !this.audioProducer) {
//     console.error("Cannot record - no media producers available");
//     this.toaster.error("No media stream available. Please restart streaming.");
//     return;
//   }
  
//   if (this.recordingStarted) {
//     console.warn("Recording already started");
//     this.toaster.info("Recording already started");
//     return;
//   }
  
//   if (this.storageEnd) {
//     console.error("Cannot record - storage full");
//     this.toaster.error("Insufficient storage space");
//     return;
//   }

//   try {
//     console.log("Sending START_RECORDING event...");
//     this.sendRequest(`START_RECORDING${this.streamId}`, "")
//       .then(() => {
//         console.log("Recording request sent successfully");
//         this.recordingStarted = true;
//         this.toaster.success("Recording started");
//       })
//       .catch((error) => {
//         console.error("Error sending recording request:", error);
//         this.toaster.error("Failed to start recording");
//       });
//   } catch (error) {
//     console.error("Error in start_recording:", error);
//     this.toaster.error("Failed to start recording");
//   }
// }
  // stop_recording(){
  //   if(this.socket){
  //     this.sendRequest(`STOP_RECORDING${this.streamId}`, '')
  //   }
  // }


start_recording() {
  console.log("=== Start Recording Debug ===");
  console.log("Can record:", this.canRecord);
  console.log("Published:", this.published);
  console.log("Socket connected:", this.socket?.connected);
  console.log("Transport connected:", this.producerTransport?.connectionState);

  // **ENHANCED VALIDATION**
  if (!this.canRecord) {
    console.error("Cannot record - canRecord is false");
    this.toaster.error("Please wait for connection to establish");
    return;
  }
  
  if (!this.published) {
    console.error("Cannot record - not published");
    this.toaster.error("Please publish stream first");
    return;
  }
  
  if (!this.socket || !this.socket.connected) {
    console.error("Cannot record - socket not connected");
    this.toaster.error("Socket connection lost");
    return;
  }

  // **NEW**: Check transport state
  if (!this.producerTransport || this.producerTransport.connectionState !== 'connected') {
    console.error("Cannot record - transport not connected");
    this.toaster.error("Transport connection lost. Please restart streaming.");
    return;
  }
  
  // **NEW**: Check if we have active producers
  if (!this.videoProducer && !this.audioProducer) {
    console.error("Cannot record - no active producers");
    this.toaster.error("No media stream available. Please restart streaming.");
    return;
  }
  
  if (this.recordingStarted) {
    console.warn("Recording already started");
    this.toaster.info("Recording already started");
    return;
  }
  
  if (this.storageEnd) {
    console.error("Cannot record - storage full");
    this.toaster.error("Insufficient storage space");
    return;
  }

  try {
    console.log("Sending START_RECORDING event...");
    this.sendRequest(`START_RECORDING${this.streamId}`, "")
      .then(() => {
        console.log("Recording request sent successfully");
        this.recordingStarted = true;
        this.toaster.success("Recording started");
      })
      .catch((error) => {
        console.error("Error sending recording request:", error);
        this.toaster.error("Failed to start recording");
      });
  } catch (error) {
    console.error("Error in start_recording:", error);
    this.toaster.error("Failed to start recording");
  }
}
async stream_end() {
  if (!this.published) {
    this.toaster.error("No active stream to end");
    return;
  }

  try {
    // Stop recording if active
    if (this.recordingStarted) {
      await this.sendRequest(`STOP_RECORDING${this.streamId}`, "");
      this.recordingStarted = false;
    }

    // Disconnect from socket
    await this.sendRequest(`disconnect${this.streamId}`, {});
    
    // Stop thumbnail capture
    this.stopThumbnailInterval();
    
    // End live stream on backend
    await this.videoService.endLiveStream(
      this.streamId, 
      this.recordingStarted, 
      this.usageTableId
    ).toPromise();
    
    // Reset state
    this.published = false;
    this.canRecord = false;
    this.disconnect();
    
    localStorage.removeItem("connected");
    this.router.navigate(["live-streaming"]);
    
  } catch (error) {
    console.error("Error ending stream:", error);
    this.toaster.error("Error ending stream");
  }
}

  // =========== media handling ==========
  stopLocalStream(stream: any) {
    let tracks = stream.getTracks();
    if (!tracks) {
      console.warn("NO tracks");
      return;
    }

    tracks.forEach((track: any) => track.stop());
  }

  // return Promise
  playVideo(element: any, stream: any) {
    if (element.srcObject) {
      console.warn("element ALREADY playing, so ignore");
      return;
    }
    element.srcObject = stream;
    element.volume = 0;
    return element.play();
  }

  pauseVideo(element: any) {
    console.log(element, "Ele");
    element.pause();
    element.srcObject = null;
  }

  // ============ UI button ==========

  checkUseVideo() {
    const useVideo = this.use_video.nativeElement.checked;
    return useVideo;
  }

  checkUseAudio() {
    const useAudio = this.use_audio.nativeElement.checked;
    return useAudio;
  }
  enableMedia() {
    this.startMedia();
  }
  startThumbnailInterval(): void {
    console.log("Thumbnail capture triggered");
    this.captureScreenshot(); // Capture screenshot immediately

    // Set interval to capture screenshot every 30 seconds
    this.thumbnailIntervalId = setInterval(() => {
      this.captureScreenshot();
    }, environment.thumbnailInterval);
  }

  stopThumbnailInterval(): void {
    clearInterval(this.thumbnailIntervalId);
  }

  captureScreenshot(): void {
    if (!this.streamId) {
      console.log("No stream Id");
      return;
    }

    const videoElement = this.localVideo.nativeElement;
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Convert canvas to Blob
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      const formData = new FormData();
      formData.append("thumbnail", blob, "thumbnail.png");
      formData.append("streamId", this.streamId);
      this.updateThumbnail(formData);
    }, "image/png");
  }

  updateThumbnail(formData: FormData): void {
    this.videoService.updateLiveStreamThumbnail(formData).subscribe((res) => {
      console.log("Thumbnail Updated");
    });
  }

  startMedia() {
    console.log("=== STARTING MEDIA ===");
    
    if (this.localStream) {
      console.warn("WARN: local media ALREADY started");
      this.error = "";
      this.buttonDisabled = true;
      this.addNoDropClass(this.camera_button.nativeElement);
      this.removeNoDropClass(this.publish_button.nativeElement);
      return;
    }

    const useVideo = this.checkUseVideo();
    const useAudio = this.checkUseAudio();
    console.log("Video enabled:", useVideo);
    console.log("Audio enabled:", useAudio);

    // Improved webcam constraints for better compatibility
    const constraints = {
      video: useVideo ? {
        width: { ideal: 1280, min: 640, max: 1920 },
        height: { ideal: 720, min: 480, max: 1080 },
        frameRate: { ideal: 30, min: 15, max: 60 },
        facingMode: "user", // Ensure front camera
      } : false,
      audio: useAudio ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: { ideal: 48000 },
        channelCount: { ideal: 2 },
      } : false,
    };

    console.log("Requesting media with constraints:", constraints);

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream: any) => {
        console.log("✅ Media stream obtained successfully");
        console.log("Video tracks:", stream.getVideoTracks().length);
        console.log("Audio tracks:", stream.getAudioTracks().length);

        this.localStream = stream;
        this.addNoDropClass(this.camera_button.nativeElement);
        this.playVideo(this.localVideo.nativeElement, this.localStream);
        this.removeNoDropClass(this.publish_button.nativeElement);
        this.updateButtons();
        this.error = "";
        this.buttonDisabled = true;

        // Log track details for debugging
        stream.getVideoTracks().forEach((track: any, index: number) => {
          console.log(`Video track ${index}:`, {
            label: track.label,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            settings: track.getSettings()
          });
        });

        stream.getAudioTracks().forEach((track: any, index: number) => {
          console.log(`Audio track ${index}:`, {
            label: track.label,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState
          });
        });
      })
      .catch((err: any) => {
        console.error("❌ Error accessing media devices:", err);

        // Provide more specific error messages
        let errorMessage = "Please enable camera from your browser settings";
        if (err.name === "NotAllowedError") {
          errorMessage = "Camera/microphone access denied. Please allow access and try again.";
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera or microphone found. Please check your devices.";
        } else if (err.name === "NotReadableError") {
          errorMessage = "Camera or microphone is already in use by another application.";
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "Camera doesn't support the requested settings. Trying with basic settings...";
          // Try with basic constraints
          this.startMediaWithBasicConstraints();
          return;
        }

        this.error = errorMessage;
        this.toaster.error(errorMessage);
        this.addNoDropClass(this.publish_button.nativeElement);
        this.buttonDisabled = true;
        this.removeNoDropClass(this.camera_button.nativeElement);
      });
  }

  // Fallback method with basic constraints
  private startMediaWithBasicConstraints() {
    console.log("Trying with basic constraints...");
    const useVideo = this.checkUseVideo();
    const useAudio = this.checkUseAudio();
    
    const basicConstraints = {
      video: useVideo,
      audio: useAudio
    };

    navigator.mediaDevices
      .getUserMedia(basicConstraints)
      .then((stream: any) => {
        console.log("✅ Media stream obtained with basic constraints");
        this.localStream = stream;
        this.addNoDropClass(this.camera_button.nativeElement);
        this.playVideo(this.localVideo.nativeElement, this.localStream);
        this.removeNoDropClass(this.publish_button.nativeElement);
        this.updateButtons();
        this.error = "";
        this.buttonDisabled = true;
      })
      .catch((err: any) => {
        console.error("❌ Failed even with basic constraints:", err);
        this.error = "Unable to access camera/microphone. Please check your browser permissions.";
        this.toaster.error("Unable to access camera/microphone. Please check your browser permissions.");
        this.addNoDropClass(this.publish_button.nativeElement);
        this.buttonDisabled = true;
        this.removeNoDropClass(this.camera_button.nativeElement);
      });
  }

  stopMedia() {
    if (this.localStream) {
      this.pauseVideo(this.localVideo.nativeElement);
      this.stopLocalStream(this.localStream);
      this.removeNoDropClass(this.camera_button.nativeElement);
      this.localStream = null;
      
    }
    this.removeNoDropClass(this.camera_button.nativeElement);
    this.updateButtons();
    if (this.socket) {
      this.sendRequest(`STOP_RECORDING${this.streamId}`, "");
    }
  }

async apiCall() {
  if (this.published) {
    return;
  }

  const dialogRef = this.dialog.open(UserLiveVideoInfoComponent, {
    width: "550px",
    height: "40vh",
  });

  dialogRef.afterClosed().subscribe(async (result) => {
    if (result !== undefined) {
      try {
        let time = `${Date.now()}`;
        result = { ...result, time: time };
        
        // Create live stream record first
        await this.videoService.createLiveStreamRecord(result).toPromise();
        
        // Start live stream and get stream ID
        const streamRes = await this.videoService.startLiveStream(time).toPromise();
        console.log("Stream response:", streamRes);
        
        // Handle different response structures
        if ((streamRes as any).body?.data?.streamId) {
          this.streamId = (streamRes as any).body.data.streamId;
        } else if ((streamRes as any).data?.streamId) {
          this.streamId = (streamRes as any).data.streamId;
        } else {
          throw new Error("Invalid stream response structure");
        }
        
        console.log("Stream ID set to:", this.streamId);
        
        if (this.streamId) {
          // Now connect socket with proper streamId
          await this.connectSocket();
          await this.publish();
          this.published = true;
        }
      } catch (error) {
        console.error("Error starting live stream:", error);
        this.toaster.error("Failed to start live stream");
      }
    }
  });
}
  //   openDialog() {
  //     const dialogRef = this.dialog.open(UserLiveVideoInfoComponent, {
  //         width: '550px',
  //         // height: '590px'
  //         height: '80vh'
  //     })

  //     dialogRef.afterClosed().subscribe(result => {
  //        console.log(result,"result")
  //        return result
  //     });
  // }

// Fix the publish method:
async publish() {
  if (this.isPublishing) {
    console.log("Already publishing, ignoring");
    return;
  }
  
  this.isPublishing = true;
  
  console.log("=== Starting Publish Process ===");
  
  if (!this.localStream) {
    this.toaster.error("Please enable camera first");
    this.resetPublishState();
    return;
  }

  try {
    // Step 1: Connect socket
    console.log("Step 1: Connecting socket...");
    await this.connectSocket();
    console.log("✅ Socket connected");

    // Step 2: Get router capabilities
    console.log("Step 2: Getting router capabilities...");
    const routerCapabilities = await this.sendRequest(
      `getRouterRtpCapabilities${this.streamId}`,
      {}
    );
    
    if (!routerCapabilities) {
      throw new Error("Failed to get router capabilities");
    }
    console.log("✅ Router capabilities received");

    // Step 3: Load device
    console.log("Step 3: Loading MediaSoup device...");
    await this.loadDevice(routerCapabilities);
    
    if (!this.device?.loaded) {
      throw new Error("Device failed to load");
    }
    console.log("✅ Device loaded successfully");

    // Step 4: Create producer transport
    console.log("Step 4: Creating producer transport...");
    const transportParams = await this.sendRequest(
      `createProducerTransport${this.streamId}`,
      {}
    );
    
    if (!transportParams) {
      throw new Error("Failed to create producer transport");
    }
    console.log("✅ Transport params received");

    // Step 5: Create transport
    console.log("Step 5: Creating WebRTC transport...");
    this.producerTransport = this.device.createSendTransport(transportParams);
    console.log("✅ Producer transport created");

    // Step 6: Set up handlers BEFORE producing
    console.log("Step 6: Setting up transport handlers...");
    this.setupTransportHandlers();

    // Step 7: Start producing media (this will trigger the connect event)
    console.log("Step 7: Starting media production...");
    await this.startMediaProduction();

    // **REMOVED**: No more waiting logic - the connection state handler will manage this
    console.log("✅ Media production started - connection state will be handled by events");
    
  } catch (error: any) {
    console.error("❌ Publish failed:", error);
    this.toaster.error(`Failed to start stream: ${error.message}`);
    this.resetPublishState();
  }
}

// Add new method to wait for transport connection:
private async waitForTransportConnection(): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Transport connection timeout"));
    }, 15000); // 15 second timeout

    if (!this.producerTransport) {
      clearTimeout(timeout);
      reject(new Error("Producer transport is null"));
      return;
    }

    console.log("=== WAITING FOR TRANSPORT CONNECTION ===");
    console.log("Current transport state:", this.producerTransport.connectionState);

    // Check if already connected
    if (this.producerTransport.connectionState === 'connected') {
      console.log("✅ Transport already connected");
      clearTimeout(timeout);
      this.onTransportConnected();
      resolve();
      return;
    }

    // Set up one-time listener for connection
    const onConnectionStateChange = (state: any) => {
      console.log(`🔄 Transport state changed to: ${state}`);
      
      if (state === 'connected') {
        console.log("✅ Transport connected successfully");
        clearTimeout(timeout);
        this.producerTransport?.off('connectionstatechange', onConnectionStateChange);
        this.onTransportConnected();
        resolve();
      } else if (state === 'failed' || state === 'disconnected') {
        console.error("❌ Transport connection failed:", state);
        clearTimeout(timeout);
        this.producerTransport?.off('connectionstatechange', onConnectionStateChange);
        reject(new Error(`Transport connection failed: ${state}`));
      }
    };

    this.producerTransport.on('connectionstatechange', onConnectionStateChange);
  });
}

private onTransportConnected() {
  this.canRecord = true;
  this.connectionState = 'published';
  this.isPublishing = false;
  this.published = true;
  this.startThumbnailInterval();
  this.updateButtons();
  console.log("🎉 Stream is now LIVE!");
}

private setupTransportHandlers() {
  const transport = this.producerTransport;
  
  if (!transport) {
    console.error("Producer transport is null, cannot set up handlers.");
    return;
  }

  console.log("Setting up transport event handlers...");

  // **CRITICAL**: The connect event is triggered when we call transport.produce()
  transport.on("connect", async ({ dtlsParameters }: any, callback: any, errback: any) => {
    console.log("🔗 TRANSPORT CONNECT EVENT TRIGGERED");
    console.log("Stream ID:", this.streamId);
    console.log("DTLS Parameters received");
    
    try {
      console.log("Sending connectProducerTransport request...");
      await this.sendRequest(`connectProducerTransport${this.streamId}`, {
        dtlsParameters: dtlsParameters,
      });
      
      console.log("✅ Transport connect successful, calling callback");
      callback(); // This is CRITICAL - it tells MediaSoup the connection succeeded
      
    } catch (error: any) {
      console.error("❌ Transport connection failed:", error);
      errback(error);
    }
  });

  transport.on("produce", async ({ kind, rtpParameters }: any, callback: any, errback: any) => {
    console.log(`🎬 TRANSPORT PRODUCE EVENT (${kind})`);
    try {
      const response = await this.sendRequest(`produce${this.streamId}`, {
        transportId: transport.id,
        kind,
        rtpParameters,
      });
      
      console.log(`✅ ${kind} producer created with ID:`, response.id);
      callback({ id: response.id });
    } catch (err) {
      console.error(`❌ Failed to produce ${kind}:`, err);
      errback(err);
    }
  });

  // Listen for connection state changes
  transport.on("connectionstatechange", (state: any) => {
    console.log(`🔄 Transport connection state: ${state}`);
    
    if (state === 'connected') {
      console.log("✅ Transport successfully connected!");
      this.onTransportConnected();
    } else if (state === 'failed' || state === 'disconnected') {
      console.error("❌ Transport connection failed:", state);
      this.onTransportFailed();
    } else if (state === 'connecting') {
      console.log("🔄 Transport is connecting...");
    }
  });
}



private onTransportFailed() {
  this.resetPublishState();
  this.toaster.error("Transport connection failed");
}

private async startMediaProduction() {
  console.log("=== STARTING MEDIA PRODUCTION ===");
  
  if (!this.producerTransport) {
    throw new Error("Producer transport is null");
  }
  
  const useVideo = this.checkUseVideo();
  const useAudio = this.checkUseAudio();
  
  console.log("Media options:", { useVideo, useAudio });
  
  if (!this.localStream) {
    throw new Error("Local stream is null");
  }
  
  // **IMPORTANT**: Produce media sequentially, not in parallel
  const producers = [];
  
  if (useVideo) {
    const videoTrack = (this.localStream as any).getVideoTracks()[0];
    if (videoTrack) {
      console.log("🎥 Creating video producer...");
      console.log("Video track settings:", videoTrack.getSettings());
      
      // **CRITICAL**: Ensure video track is enabled and active
      if (!videoTrack.enabled) {
        console.warn("⚠️ Video track is disabled, enabling it...");
        videoTrack.enabled = true;
      }
      
      // **CRITICAL**: Wait for track to be ready
      if (videoTrack.readyState !== 'live') {
        console.warn("⚠️ Video track is not live, waiting...");
        await new Promise<void>((resolve) => {
          const checkReady = () => {
            if (videoTrack.readyState === 'live') {
              console.log("✅ Video track is now live");
              resolve();
            } else if (videoTrack.readyState === 'ended') {
              console.error("❌ Video track ended while waiting");
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
          
          // Timeout after 5 seconds
          setTimeout(() => {
            console.warn("⏰ Video track ready timeout");
            resolve();
          }, 5000);
        });
      }
      
      try {
        const videoProducer = await this.producerTransport.produce({ 
          track: videoTrack,
          // Simplified encoding parameters
          encodings: [{ maxBitrate: 1000000 }],
        });
        
        this.videoProducer = videoProducer;
        producers.push(videoProducer);
        console.log("✅ Video producer created:", videoProducer.id);
        
        // **CRITICAL**: Verify producer is active
        console.log("📊 Video producer state:", {
          id: videoProducer.id,
          kind: videoProducer.kind,
          paused: videoProducer.paused,
          closed: videoProducer.closed,
          track: videoProducer.track ? {
            id: videoProducer.track.id,
            enabled: videoProducer.track.enabled,
            readyState: videoProducer.track.readyState
          } : 'No track'
        });
        
        // Set up producer event handlers
        videoProducer.on("trackended", () => {
          console.log("Video track ended");
        });
        
        videoProducer.on("transportclose", () => {
          console.log("Video producer transport closed");
        });
        
      } catch (error) {
        console.error("❌ Failed to create video producer:", error);
        throw error;
      }
    } else {
      console.error("❌ No video track found in local stream");
      throw new Error("No video track available");
    }
  }
  
  if (useAudio) {
    const audioTrack = (this.localStream as any).getAudioTracks()[0];
    if (audioTrack) {
      console.log("🎵 Creating audio producer...");
      console.log("Audio track settings:", audioTrack.getSettings());
      
      // **CRITICAL**: Ensure audio track is enabled and active
      if (!audioTrack.enabled) {
        console.warn("⚠️ Audio track is disabled, enabling it...");
        audioTrack.enabled = true;
      }
      
      // **CRITICAL**: Wait for track to be ready
      if (audioTrack.readyState !== 'live') {
        console.warn("⚠️ Audio track is not live, waiting...");
        await new Promise<void>((resolve) => {
          const checkReady = () => {
            if (audioTrack.readyState === 'live') {
              console.log("✅ Audio track is now live");
              resolve();
            } else if (audioTrack.readyState === 'ended') {
              console.error("❌ Audio track ended while waiting");
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
          
          // Timeout after 5 seconds
          setTimeout(() => {
            console.warn("⏰ Audio track ready timeout");
            resolve();
          }, 5000);
        });
      }
      
      try {
        const audioProducer = await this.producerTransport.produce({ 
          track: audioTrack,
        });
        
        this.audioProducer = audioProducer;
        producers.push(audioProducer);
        console.log("✅ Audio producer created:", audioProducer.id);
        
        // **CRITICAL**: Verify producer is active
        console.log("📊 Audio producer state:", {
          id: audioProducer.id,
          kind: audioProducer.kind,
          paused: audioProducer.paused,
          closed: audioProducer.closed,
          track: audioProducer.track ? {
            id: audioProducer.track.id,
            enabled: audioProducer.track.enabled,
            readyState: audioProducer.track.readyState
          } : 'No track'
        });
        
        // Set up producer event handlers
        audioProducer.on("trackended", () => {
          console.log("Audio track ended");
        });
        
        audioProducer.on("transportclose", () => {
          console.log("Audio producer transport closed");
        });
        
      } catch (error) {
        console.error("❌ Failed to create audio producer:", error);
        throw error;
      }
    } else {
      console.error("❌ No audio track found in local stream");
      throw new Error("No audio track available");
    }
  }

  if (producers.length === 0) {
    throw new Error("No media producers created");
  }

  console.log(`✅ Created ${producers.length} producer(s) successfully`);
  return producers;
}

private resetPublishState() {
  this.isPublishing = false;
  this.connectionState = 'disconnected';
  this.published = false;
  this.canRecord = false;
  this.buttonDisabled = false;
  this.removeNoDropClass(this.publish_button.nativeElement);
  
  // Clean up transport if it exists
  if (this.producerTransport) {
    this.producerTransport.close();
    this.producerTransport = null;
  }
}

  disconnect() {
    if (this.localStream) {
      this.pauseVideo(this.localVideo.nativeElement);
      this.stopLocalStream(this.localStream);
      this.localStream = null;
    }
    if (this.videoProducer) {
      (this.videoProducer as any).close(); // localStream will stop
      this.videoProducer = null;
    }
    if (this.audioProducer) {
      (this.audioProducer as any).close(); // localStream will stop
      this.audioProducer = null;
    }
    if (this.producerTransport) {
      (this.producerTransport as any).close(); // localStream will stop
      this.producerTransport = null;
    }

    this.disconnectSocket();
    this.updateButtons();
  }

async loadDevice(routerRtpCapabilities: any) {
  try {
    // Create new device instance
    this.device = new mediaSoup.Device();
    
    // Check if device can load the capabilities
    if (!routerRtpCapabilities) {
      throw new Error('Router RTP capabilities not provided');
    }
    
    console.log('Loading device with capabilities:', routerRtpCapabilities);
    
    // Load the device with router capabilities
    await this.device.load({ routerRtpCapabilities });
    
    console.log('Device loaded successfully:', {
      loaded: this.device.loaded,
      handlerName: this.device.handlerName,
      rtpCapabilities: this.device.rtpCapabilities ? 'Available' : 'Not available'
    });
    
  } catch (error: any) {
    console.error('Error loading device:', error);
    if (error.name === "UnsupportedError") {
      this.error = "Your browser does not support WebRTC";
      this.toaster.error("Browser not supported for WebRTC");
    } else {
      this.error = "Failed to initialize media device";
      this.toaster.error("Failed to initialize media device");
    }
    throw error;
  }
}

  // ---- UI control ----
// In broadcaster.component.ts
updateButtons() {
  // Enable/disable camera button
  if (this.localStream) {
    this.addNoDropClass(this.camera_button.nativeElement);
  } else {
    this.removeNoDropClass(this.camera_button.nativeElement);
  }

  // Enable/disable publish button
  if (this.localStream && !this.published && !this.isPublishing) {
    this.removeNoDropClass(this.publish_button.nativeElement);
    this.buttonDisabled = false;
  } else {
    this.addNoDropClass(this.publish_button.nativeElement);
    this.buttonDisabled = true;
  }

  // Update recording button state
  const recordButton = document.querySelector('.start-rec-btn') as HTMLElement;
  if (recordButton) {
    const canStartRecording = this.published && 
                             this.socket?.connected && 
                             !this.storageEnd && 
                             this.canRecord &&
                             (this.videoProducer || this.audioProducer) && // **NEW: Check producers**
                             !this.recordingStarted;
                             
    if (canStartRecording) {
      recordButton.classList.remove('nodrop');
    } else {
      recordButton.classList.add('nodrop');
    }
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

  addNoDropClass(element: any): void {
    if (element) {
      element.classList.add("nodrop");
    }
  }
  removeNoDropClass(element: any): void {
    if (element) {
      element.classList.remove("nodrop");
    }
  }
}
@Component({
  selector: "user-video-info-modal",
  templateUrl: "./user-video-info-modal.html",
  styleUrls: ["./broadcaster.component.scss"],
})
export class UserLiveVideoInfoComponent {
  videoInfo = new FormGroup({
    Title: new FormControl("", [Validators.required]),
    description: new FormControl("", [Validators.required]),
  });

  constructor(
    private videoService: VideoService,
    public dialogRef: MatDialogRef<UserLiveVideoInfoComponent>,
    private toasterService: ToastrService
  ) {}
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
