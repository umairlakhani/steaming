import {
  Component,
  EventEmitter,
  OnInit,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
  AfterViewInit,
} from "@angular/core";
import { VideoService } from "../services/video.service";
import { environment } from "src/environments/environment";
import { Socket } from "ngx-socket-io";
import { SpinnerService } from "src/shared/services/spinner.service";
// const config: SocketIoConfig = {
// 	url: 'localhost', // socket server url;
// 	options: {
// 		transports: ['websocket']
// 	}
// }
@Component({
  selector: "app-live-chat",
  templateUrl: "./live-chat.component.html",
  styleUrls: ["./live-chat.component.scss"],
  // encapsulation: ViewEncapsulation.None,
})
export class LiveChatComponent implements AfterViewInit {
  @ViewChild("live_stream") video!: ElementRef<HTMLVideoElement>;
  @ViewChild("shareable_link")
  shareable_link!: ElementRef<HTMLParagraphElement>;
  stream_id!: string;
  streamingDis: boolean = false;
  stopDis: boolean = true;
  startDis: boolean = true;
  videoStream!:any

  public mediaRecorder: any;
  STREAM_NAME: any;
  constructor(
    private socket: Socket,
    private videoService: VideoService, // private simpleWebRTCService:SimpleWebRTCService
    private spinnerService: SpinnerService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    this.STREAM_NAME = this.getName();
  }

  startStreaming() {
    if (this.permittedGetUserMedia()) {
      const video = this.video.nativeElement;
      const mediaSource = new MediaSource();
      console.log(mediaSource, "Media Source");
      // video.src = URL.createObjectURL(mediaSource);

      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then((stream) => {
          const videoTracks = stream.getVideoTracks();
          console.log(videoTracks, "Tracks");
          //   console.log('Got stream with constraints:', constraints);
          console.log(`Using video device: ${videoTracks[0].label}`);
          // window.stre = stream; // make variable available to browser console
          video.srcObject = stream;
          this.processStream(stream);
          this.streamingDis = true;
          this.stopDis = false;
          this.videoStream = stream
        });
    }
  }

  getName() {
    return +new Date();
  }
  permittedGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  registerRecord(stream: any) {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm; codecs="opus,vp8"',
      // videoBitsPerSecond: 3 * 1024 * 1024,
    });

    this.mediaRecorder = mediaRecorder;
    // const chunks = [];
    console.log("Working");
    let countUploadChunk = 0;

    mediaRecorder.ondataavailable = (data) => {
      console.log("Data available");
      console.log(data.data.size, "SIze", countUploadChunk, "Chunk ");
      this.videoService
        .sendFileLiveStream(data.data, this.STREAM_NAME)
        .subscribe((re: any) => {
          console.log(re, "re");
          // countUploadChunk + 1;
          if (re["file_name"]) {
            this.stream_id = re["file_name"];
          }
        });
      if (data.data.size > 12000) {
      }
      // mediaRecorder.onstop = () => {

      // }
    };

    const inte = setInterval(() => {
      if (mediaRecorder.state === "recording") {
        console.log(mediaRecorder.state, "State");
        // mediaRecorder.requestData();
        mediaRecorder.stop();

        mediaRecorder.start(10000);
      }
    }, 1500);

    mediaRecorder.start(10000);

    const stream_name_interval = setInterval(() => {
      if (this.stream_id) {
        this.shareable_link.nativeElement.innerHTML = `https://dev.mediapilot.io/#/live-view?stream=${this.stream_id}`;

        clearInterval(stream_name_interval);
      }
    }, 3000);

    //  mediaRecorder.requestData()
  }

  processStream(stream: any) {
    this.registerRecord(stream);
  }

  stopRecording() {
    this.mediaRecorder.stop();
    this.video.nativeElement.remove()
    this.stopDis = true;
    this.startDis = false;
    
  }
  startRecording() {
    this.mediaRecorder.start(10000);
    this.video.nativeElement.play();
    this.stopDis = false;
    this.startDis = true;
  }

  terminateRecording(){
    this.videoStream.getVideoTracks()[0].stop();
    this.mediaRecorder.stop();
    // this.video.nativeElement.remove();
    this.video.nativeElement.srcObject = null
    
    // for (const track of ((this.video.nativeElement as any).srcObject as any).getTracks()) {
    //   track.stop();
    // }
    // navigator.mediaDevices
    //     .getUserMedia({
    //       video: false,
    //       audio: false,
    //     }).then((stream:any)=>{
    //       stream.getVideoTracks()[0].stop()
    //       // stream.getTracks().forEach((track)=>track.stop())
    //       console.log(stream, "tream")
    //       stream.getTracks().forEach((track:any) => {
    //           track.stop();
    //       });
    //       stream = null;
    //     })
    this.stopDis = true;
    this.startDis = false;
      this.streamingDis = false
  
    this.videoService.terminateRecording(this.STREAM_NAME).subscribe((res)=>{
      console.log(res,"chec terminate response")
      // window.location.reload()
    })
  }
  ngOnDestroy(){
    this.terminateRecording()
  }
}
