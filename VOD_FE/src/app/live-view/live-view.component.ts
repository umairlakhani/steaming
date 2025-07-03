import { DOCUMENT } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import {
  Component,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  OnInit,
  Inject,
  HostListener
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
// import { Socket, SocketIoModule, SocketIoConfig } from "ngx-socket-io";
import { environment } from "src/environments/environment";
import { VideoService } from "../services/video.service";
// import videojs from 'video.js';

@Component({
  selector: "app-live-view",
  templateUrl: "./live-view.component.html",
  styleUrls: ["./live-view.component.scss"],
})
export class LiveViewComponent implements AfterViewInit {
  // public chatClosed: EventEmitter<void> = new EventEmitter<void>();
  userId: any;
  STREAM_NAME: any;
  @ViewChild("live_video") video!: ElementRef<HTMLVideoElement>;
  @ViewChild("streaming") streaming_content!: ElementRef<HTMLHeadingElement>;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    @Inject(DOCUMENT) private document: any,
    private videoService: VideoService
  ) // private video: ElementRef<HTMLVideoElement>
  {}

  async ngAfterViewInit(): Promise<void> {
    const video = this.video.nativeElement;
    console.log(video, "Video");
    this.route.queryParams.subscribe((params) => {
      console.log(params); // { orderby: "price" }
      this.STREAM_NAME = params["stream"];
      console.log(this.STREAM_NAME); // price
    });

    if (
      "MediaSource" in window &&
      MediaSource.isTypeSupported("video/webm;codecs=vp8")
    ) {
      console.log("Supported");
    } else {
      console.log("Not supported mime type");
    }

    this.videoService.getLatestChunk(this.STREAM_NAME).subscribe((re) => {
      console.log(re, "chunk");
      let countDownloadChunk = parseInt(re as string);
      // let countDownloadChunk = 0;
      // 1. Create a `MediaSource`
      var mediaSource = new MediaSource();
      // 3. Set the video's `src` to the object URL

      // 4. On the `sourceopen` event, create a `SourceBuffer`
      var sourceBuffer: any = null;
      var segment_length = [];
      const STREAM_NAME = this.STREAM_NAME;
      const streaming_content = this.streaming_content
      mediaSource.addEventListener("sourceopen", async function () {
        // NOTE: Browsers are VERY picky about the codec being EXACTLY
        // right here. Make sure you know which codecs you're using!
        sourceBuffer = mediaSource.addSourceBuffer(
          'video/webm; codecs="opus,vp8"'
        );
        // (sourceBuffer as SourceBuffer).mode = 'sequence';
        // (sourceBuffer as SourceBuffer).appendWindowStart = countDownloadChunk
        console.log((sourceBuffer as SourceBuffer).mode);
        (sourceBuffer as SourceBuffer).mode = 'sequence';
        // console.log(sourceBuffer.mode, "Mode")
        // sourceBuffer.timestampOffset = 10
        // console.log(sourceBuffer.timestampOffset, "timestampOffset")
        // console.log("source buffer", sourceBuffer);

        sourceBuffer.addEventListener("error", (e: any) => {
          console.error("sourceBuffer error", e);
        });

        let status;

        do {
          const response = await fetch(
            `${environment.apiUrl}/livestreaming/live-stream-download?name=${STREAM_NAME}&chunk=${countDownloadChunk}`
          );
          status = response.status;
          // if(response.status != 200 ){
          //   video.
          // }
          const buff = await response.arrayBuffer();
          (sourceBuffer as SourceBuffer).appendBuffer(buff);
          console.log(sourceBuffer);
          if (
            mediaSource.readyState === "open" &&
            sourceBuffer &&
            sourceBuffer.updating === false
            ) {

          }
          if(status != 200){
            console.log(video.duration, "duration")
            video.pause()
            video.src = '';
            streaming_content.nativeElement.innerHTML = 'This live stream has ended';
          }
          countDownloadChunk++;
          // arrayOfBlobs.push(buff);
          await new Promise((res) => {
            setTimeout(res, 1000);
          });
        } while (status === 200);

        sourceBuffer.onupdateend = () => {
          console.info("onupdateend");
          if (!sourceBuffer.updating && mediaSource.readyState === "open") {
            mediaSource.endOfStream();
          }
        };
      });

      video.src = URL.createObjectURL(mediaSource);

      mediaSource.addEventListener("sourceended", () => {
        console.log("mediaSource ended");
      });
      mediaSource.addEventListener("sourceclose", () => {
        console.log("mediaSource closed");
      });

      mediaSource.addEventListener("error", () => {
        console.error("mediaSource error");
      });

      mediaSource.addEventListener("abort", () => {
        console.error("mediaSource abort");
      });
    });
    
  }
  @HostListener('window:unload', ['$event'])
  ngOnDestroy() {
    console.log("ngOndestroy works")
    this.videoService.userLeft(this.STREAM_NAME).subscribe((res)=>{
      console.log(res,"res")
    })
  }
}
