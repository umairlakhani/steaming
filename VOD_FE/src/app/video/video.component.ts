import {
  AfterViewInit,
  Component,
  ElementRef,
  OnChanges,
  OnInit,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { VideoService } from "../services/video.service";
import videojs from "video.js";
import io from "socket.io-client";
// import 'video.js/dist/video-js.css'
import "videojs-contrib-quality-levels";
import "videojs-contrib-ads";
import "videojs-ima";
import "videojs-hls-quality-selector";
import { environment } from "src/environments/environment";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-video",
  templateUrl: "./video.component.html",
  styleUrls: ["./video.component.scss"],
})
export class VideoComponent implements OnInit, OnChanges {
  @ViewChild("target", { static: true })
  target!: ElementRef;
  socket!: any;
  private startTime: number = 0;
  private endTime: number = 0;
  private totalBytesLoaded: number = 0;
  private videStartTime: number = 0;
  private totalPlaytime: number = 0;
  private oneMb: number = 1048576;
  private videoSize: number = 0;
  private lastUpdateTime: number = 0;
  private totalPlayTime: number = 0;
  private lastPlayTimeUpdate: number = 0;
  private isPlaying: boolean = false;
  private accumulatedPlayTime: number = 0;
  private updateInterval: any;
  private updateTimeoutId: any;
  private bandwidthUpdateTimeout: any;
  private socketInitialized: boolean = false;
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
  platform!: string;
  analyticId: any;
  url: any = "";
  htmlContent = `<div id="switch-btn" class="vjs-menu-button vjs-menu-button-popup vjs-control vjs-button vjs-quality-selector">
  <button
      class="vjs-menu-button vjs-menu-button-popup vjs-button" type="button" aria-disabled="false"
      aria-haspopup="true" aria-expanded="true"><span class="vjs-icon-placeholder" aria-hidden="true">qual</span><span
          class="vjs-control-text" aria-live="polite"></span></button>
  <div class="vjs-menu vjs-lock-showing">
      <ul id="menu-list" class="vjs-menu-content d-none" role="menu">
          <li class="vjs-menu-title" tabindex="-1">Quality</li>
          <li id="low" class="vjs-menu-item" tabindex="-1" role="menuitemradio" aria-disabled="false" aria-checked="false">
              <span class="vjs-menu-item-text">360p</span><span class="vjs-control-text" aria-live="polite"></span>
          </li>
          <li id="mid" class="vjs-menu-item" tabindex="-1" role="menuitemradio" aria-disabled="false" aria-checked="false">
              <span class="vjs-menu-item-text">480p</span><span class="vjs-control-text" aria-live="polite"></span>
          </li>
          <li id="high" class="vjs-menu-item" tabindex="-1" role="menuitemradio" aria-disabled="false" aria-checked="false">
              <span class="vjs-menu-item-text">720p</span><span class="vjs-control-text" aria-live="polite">, selected</span>
          </li>
      </ul>
  </div>
</div>`;
  currentPlaybackTime = 0;
  video: any = {};
  schedulesData: any[] = [];
  onAir: boolean = true;
  startTimestamp: any;
  latitude!: string;
  longitude!: string;
  adsLoaded: boolean = false;
  xml = `<Zone id="124309" name="video" status="active">
  <ServingCode type="regular" format="comprehensive">
      <!-- AdSpeed.com  Tag 8.1 for [Zone] video -1x-1 -->
      <script type="text/javascript">
          var asdate = new Date();
          var q = '&tz=' + asdate.getTimezoneOffset() / 60 + '&ck=' + (navigator.cookieEnabled ? 'Y' : 'N') + '&jv=' + (navigator.javaEnabled() ? 'Y' : 'N') + '&scr=' + screen.width + 'x' + screen.height + 'x' + screen.colorDepth + '&z=' + Math.random() + '&ref=' + escape(document.referrer.substr(0, 255)) + '&uri=' + escape(document.URL.substr(0, 255));
          document.write('<iframe width="-1" height="-1" src="http://g.adspeed.net/ad.php?do=html&zid=124309&oid=28121&wd=-1&ht=-1&target=_blank' + q + '" frameborder="0" scrolling="no" allowtransparency="true" hspace="0" vspace="0"></iframe>');
      </script>
      <noscript>
          <iframe width="-1" height="-1" src="http://g.adspeed.net/ad.php?do=html&zid=124309&oid=28121&wd=-1&ht=-1&target=_blank" frameborder="0" scrolling="no" allowtransparency="true" hspace="0" vspace="0">
              <a href="http://g.adspeed.net/ad.php?do=clk&zid=124309&oid=28121&wd=-1&ht=-1&pair=as" target="_blank">
                  <img style="border:0;max-width:100%;height:auto;" src="http://g.adspeed.net/ad.php?do=img&zid=124309&oid=28121&wd=-1&ht=-1&pair=as" alt="i" width="-1" height="-1" />
              </a>
          </iframe>
      </noscript><!-- AdSpeed.com End -->
  </ServingCode>
</Zone>`;
  adTriggered = false;
  constructor(
    private route: ActivatedRoute,
    private videoService: VideoService,
    private renderer: Renderer2,
    private toaster: ToastrService,
    private el: ElementRef
  ) {}
  ngOnInit(): void {
    const userAgent = window.navigator.platform.toLowerCase();
    console.log(userAgent);
    this.platform = userAgent;
    this.getLocation();
    let vastUrl = this.extractUrl(this.xml);
    console.log(vastUrl, "check vastUrl");
  }
  ngOnChanges(): void {
    // this.playVideo()
  }

  openVideo() {}

  changeVideoSource(newSourceUrl: string) {
    this.currentPlaybackTime = this.player.currentTime();
    this.player.pause();
    console.log(newSourceUrl, "check whether url passed or not");
    // this.player.src({
    //   src: newSourceUrl,
    // });
    this.player.src({
      src: newSourceUrl,
      // type: 'video/m3u8'/*video type*/
    });
    // this.player.src(newSourceUrl);
    this.player.load();
    this.player.currentTime(this.currentPlaybackTime);
    this.player.play();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      console.log("socket.io closed..");
      this.socket = io(environment.socketUrlBe, {
        autoConnect: true,
      }).connect();
      this.socket.emit("videoStarted", {
        videoId: this.url,
        userId: localStorage.getItem("userId"),
        latitude: this.latitude,
        longitude: this.longitude,
        platform: this.platform,
      });
      this.socket.on("analyticId", (data: any) => {
        this.analyticId = data.analyticId;
      });
    }
  }
  getLocation() {
    console.log("getting location");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(position, "position");

          this.latitude = position.coords.latitude.toString();
          this.longitude = position.coords.longitude.toString();
          this.playVideo();
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            if (window.location.href.includes("public")) {
              console.error("User denied location access");
              let toast = this.toaster.warning(
                "Location access denied! Please enable the location"
              );
              setTimeout(() => {
                this.toaster.remove(toast.toastId);
              }, 2500);
            } else {
              this.playVideo();
            }
          } else {
            console.error(error);
          }
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }
  playVideo() {
    console.log(this.latitude, " ", this.longitude, "coords");

    this.route.params.subscribe((params) => {
      this.url = params["id"];

      this.videoService.getVideoByVideoId(params["id"]).subscribe((res) => {
        console.log(res, "check res ");
        this.video = (res as any).data.data;
        this.videoSize = this.video.size / this.oneMb;

        if (window.location.href.includes("public")) {
          // Initialize socket connection
          this.setupSocket();

          const { midRoll, postRoll, preRoll } = this.video;
          let imaObj = {
            id: "vid",
            adTagUrl: this.video.vastUrl,
            adsPreroll: preRoll || false,
            adsMidroll: midRoll || false,
            adsPostroll: postRoll || false,
          };

          this.initializeVideoPlayer(res);

          // Setup bandwidth tracking
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (entry.initiatorType === "xmlhttprequest") {
                if (this.player && !this.player.isDisposed()) {
                  try {
                    const duration = this.player.duration();
                    if (duration && duration > 0) {
                      const bufferedEnd = this.player.bufferedEnd(0);
                      if (typeof bufferedEnd === 'number') {
                        const videosDownloaded = this.videoSize * (bufferedEnd / duration);
                        this.updateBandwidth(videosDownloaded);
                      }
                    }
                  } catch (e) {
                    console.error("Error in PerformanceObserver calculating bandwidth:", e);
                  }
                }
              }
            });
          });
          observer.observe({ entryTypes: ["resource"] });

          this.player.on("progress", () => {
            if (this.player && !this.player.isDisposed()) {
              try {
                const duration = this.player.duration();
                if (duration && duration > 0) {
                  const bufferedEnd = this.player.bufferedEnd(0);
                  if (typeof bufferedEnd === 'number') {
                    const videosDownloaded = this.videoSize * (bufferedEnd / duration);
                    this.updateBandwidth(videosDownloaded);
                  }
                }
              } catch (e) {
                console.error("Error in progress event calculating bandwidth:", e);
              }
            }
          });
          this.player.on("timeupdate", (e: any) => {
            // Calculate playtime when video is paused

            if (!this.videStartTime) this.videStartTime = Date.now();
            if (this.videStartTime) {
              const currentTime = Date.now();
              const elapsed = (currentTime - this.videStartTime) / 1000; // Convert to seconds
              // Update previous duration with the current playtime
              this.totalPlayTime += elapsed;
              // Update start time
              this.videStartTime = currentTime;
              // Log or use previous duration as needed
              console.log("Total playtime:", this.totalPlayTime);
            }
            // Update total time played every second
            const currentTime = this.player.currentTime();
            if (currentTime > 0 && currentTime % 1 === 0) {
              this.totalPlayTime++;
              console.log("Total time played:", this.totalPlayTime, "seconds");
            }

            this.socket.emit("videoStarted", {
              videoId: this.url,
              userId: localStorage.getItem("userId"),
              playTime: Math.floor(this.totalPlayTime),
              latitude: this.latitude,
              longitude: this.longitude,
              platform: this.platform,
            });
            // console.log(this.player.currentTime(), "this.player.currentTime()")
            if (this.video.midRoll) {
              let parsedConfig = this.video.midRollConfig;
              const elapsedTime = Math.floor(this.player.currentTime());
              let intervalTime;
              if (parsedConfig["intervalType"] == "min") {
                intervalTime = Number(parsedConfig["interval"]) * 60;
              } else {
                intervalTime = Number(parsedConfig["interval"]);
              }
              if (
                !this.adTriggered &&
                elapsedTime > 0 &&
                elapsedTime % intervalTime === 0
              ) {
                console.log("ad triggered");
                this.player.ima.requestAds();
                this.player.trigger("adsready");
                this.player.trigger("play");

                this.adTriggered = true;
              }
              if (elapsedTime % intervalTime !== 0) {
                this.adTriggered = false;
              }
            }
          });
          this.player.on("ended", () => {
            if (this.video.postRoll) {
              console.log("post-roll ad triggered");
              this.player.ima.requestAds();
              this.player.trigger("adsready");
              this.player.trigger("play");
            }
          });
          // }

          this.player.on("ima3.adstart", () => {
            console.log("IMA Ad Started");
          });

          this.player.on("ima3.adend", () => {
            console.log("IMA Ad Ended");
          });
        }
        if (
          !window.location.href.includes("live") &&
          !window.location.href.includes("public")
        ) {
          console.log(
            (res as any).data.data.preSignedUrl360p,
            "(res as any).data.data.preSignedUrl360p"
          );
          console.log(
            (res as any).data.data.preSignedUrl720p,
            "(res as any).data.data.preSignedUrl720p"
          );
          this.player = videojs(
            this.target.nativeElement,
            {
              fluid: true,
              aspectRatio: "16:9",
              autoplay: true,
              sources: [
                {
                  src: (res as any).data.data.preSignedUrl360p,
                  label: "360p",
                },
              ],
            },
            () => {
              console.log("Player ready");
              this.player.qualityLevels();
              const controlBarDiv =
                this.el.nativeElement.querySelector(".vjs-control-bar");
              const divElement = this.renderer.createElement("div");
              divElement.innerHTML = this.htmlContent;

              this.renderer.appendChild(controlBarDiv, divElement);
              const buttonElement =
                this.el.nativeElement.querySelector("#switch-btn");
              console.log(buttonElement, "buttonElement");
              if (buttonElement) {
                this.renderer.listen(buttonElement, "mouseover", () => {
                  const menu =
                    this.el.nativeElement.querySelector("#menu-list");
                  this.renderer.removeClass(menu, "d-none");
                });
                this.renderer.listen(buttonElement, "mouseout", () => {
                  const menu =
                    this.el.nativeElement.querySelector("#menu-list");
                  this.renderer.addClass(menu, "d-none");
                });
              }

              const resolutionButtonElement720 =
                this.el.nativeElement.querySelector("#high");
              const resolutionButtonElement480 =
                this.el.nativeElement.querySelector("#mid");
              const resolutionButtonElement360 =
                this.el.nativeElement.querySelector("#low");

              this.renderer.listen(resolutionButtonElement720, "click", () => {
                let url = (res as any).data.data.preSignedUrl720p;
                this.changeVideoSource(url);
                console.log("720 p clicked");
                console.log((res as any).data.data);
              });
              this.renderer.listen(resolutionButtonElement480, "click", () => {
                let url = (res as any).data.data.preSignedUrl480p;
                this.changeVideoSource(url);
                console.log("480 p clicked");
                console.log(url, "480p url");
              });
              this.renderer.listen(resolutionButtonElement360, "click", () => {
                let url = (res as any).data.data.preSignedUrl360p;
                this.changeVideoSource(url);
                console.log("360 p clicked");
                console.log(url, "360p url");
              });
              console.log(
                (res as any).data.data.vastUrl,
                (res as any).data.data.vastUrl
              );
              console.log(this.player.ima, "this.player.ima");
              this.player.on("adsready", () => {
                console.log("ads ready");
              });
            }
          );
        }
      });
    });
  }

  extractUrl(servingCode: any) {
    var regex = /zid=(\d+)&oid=(\d+)&wd=(-?\d+)&ht=(-?\d+)/;
    var match = servingCode.match(regex);
    console.log(match, "ceheck match");
    if (match) {
      var currentTimeUTC = new Date().getTime();
      var vastUrl = `https://g.adspeed.net/ad.php?do=vast&zid=${match[1]}&oid=${match[2]}&wd=${match[3]}&ht=${match[4]}&vastver=3&cb=${currentTimeUTC}`;
      return vastUrl;
    } else {
      return "";
    }
  }
  ngOnDestroy(): void {
    if (this.player) {
      this.updatePlayTime(true);
      this.player.dispose();
    }
    if (this.socket) {
      this.socket.disconnect();
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.updateTimeoutId) {
      clearTimeout(this.updateTimeoutId);
    }
    if (this.bandwidthUpdateTimeout) {
      clearTimeout(this.bandwidthUpdateTimeout);
    }
  }

  isVideoOnAir(videoId: string): boolean {
    const currentTimestamp = Date.now();
    let onAir = [];
    this.schedulesData.forEach((el: any) => {
      const startTimestamp = new Date(el.startTimestamp).getTime();
      this.startTimestamp = startTimestamp;
      const endTimestamp = new Date(el.endTimestamp).getTime();
      if (
        startTimestamp <= currentTimestamp &&
        currentTimestamp <= endTimestamp
      ) {
        console.log("video on air currently");
        onAir.push("true");
      }
    });
    console.log(onAir.length, "check onAir.length before");
    if (onAir.length > 0) {
      console.log(onAir.length, "check onAir.length");
      return true;
    } else {
      return false;
    }
  }
  setVideoQuality(quality: string): void {
    const selectedSource = this.options.sources.find(
      (source) => source.label === quality
    );

    if (selectedSource) {
      this.player.src({
        src: selectedSource.src,
        // type: selectedSource.type
      });
      this.player.play();
    }
  }

  decodeAdsSpeedResponse(escapedXmlString: any) {
    const decodedXmlString = escapedXmlString
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&");

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(decodedXmlString, "text/xml");

    const serializer = new XMLSerializer();
    const formattedXmlString = serializer.serializeToString(xmlDoc);

    return formattedXmlString;
  }

  private setupSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(environment.socketUrlBe, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    }).connect();

    this.socket.on("connect", () => {
      if (!this.socketInitialized) {
        this.socketInitialized = true;
        this.socket.emit("videoStarted", {
          videoId: this.url,
          userId: localStorage.getItem("userId"),
          latitude: this.latitude,
          longitude: this.longitude,
          platform: this.platform,
        });
      }
    });

    this.socket.on("analyticId", (data: any) => {
      this.analyticId = data.analyticId;
      // Initialize play time tracking through player events
      this.lastPlayTimeUpdate = Date.now();
    });

    this.socket.on("disconnect", () => {
      // On disconnect, we'll mark socket as uninitialized
      this.socketInitialized = false;
    });
  }

  private updatePlayTime(isFinal: boolean = false) {
    if (!this.analyticId) return;

    const now = Date.now();
    if (this.lastPlayTimeUpdate) {
      const newPlayTime = (now - this.lastPlayTimeUpdate) / 1000;
      this.accumulatedPlayTime += this.isPlaying ? newPlayTime : 0;
    }
    this.lastPlayTimeUpdate = now;

    // Debounce the emit to prevent too many updates
    if (this.updateTimeoutId) clearTimeout(this.updateTimeoutId);
    this.updateTimeoutId = setTimeout(() => {
      this.socket.emit('updatePlayTime', {
        analyticId: this.analyticId,
        playTime: this.player ? this.player.currentTime() : Math.round(this.accumulatedPlayTime),
        videoId: this.url,
        userId: localStorage.getItem('userId'),
        isFinal
      });
    }, 1000);
  }

  private updateBandwidth(videosDownloaded: number) {
    if (!this.analyticId) return;

    // MODIFIED: Ensure videosDownloaded is a valid number before toFixed
    const validVideosDownloaded = (typeof videosDownloaded === 'number' && !isNaN(videosDownloaded)) ? videosDownloaded : 0;

    if (this.bandwidthUpdateTimeout) clearTimeout(this.bandwidthUpdateTimeout);
    this.bandwidthUpdateTimeout = setTimeout(() => {
      this.socket.emit("bandwidth", {
        playTime: Math.floor(this.accumulatedPlayTime),
        analyticId: this.analyticId,
        downloaded: validVideosDownloaded.toFixed(2), // MODIFIED: Use the validated value
        videoId: this.url,
        userId: localStorage.getItem("userId"),
      });
    }, 1000);
  }

  private initializeVideoPlayer(res: any) {
    const playerConfig = this.getPlayerConfig(res);
    
    this.player = videojs(this.target.nativeElement, playerConfig, () => {
      console.log("Player ready");
      
      this.player.on('play', () => {
        this.isPlaying = true;
        this.lastPlayTimeUpdate = Date.now();
        this.updatePlayTime();
      });

      this.player.on('pause', () => {
        this.isPlaying = false;
        this.updatePlayTime();
      });

      this.player.on('timeupdate', () => {
        if (this.isPlaying) {
          this.updatePlayTime();
        }
      });

      this.player.on('ended', () => {
        this.isPlaying = false;
        this.updatePlayTime(true);
        if (this.videoSize) {
            this.updateBandwidth(this.videoSize); 
        }
      });

      // Setup quality selector and other UI elements
      this.setupVideoQualitySelector();
    });
  }

  private setupVideoQualitySelector() {
    this.player.qualityLevels();
    const controlBarDiv = this.el.nativeElement.querySelector(".vjs-control-bar");
    const divElement = this.renderer.createElement("div");
    divElement.innerHTML = this.htmlContent;

    this.renderer.appendChild(controlBarDiv, divElement);
    this.setupQualityButtonListeners();
  }

  private setupQualityButtonListeners() {
    const buttonElement = this.el.nativeElement.querySelector("#switch-btn");
    if (buttonElement) {
      this.renderer.listen(buttonElement, "mouseover", () => {
        const menu = this.el.nativeElement.querySelector("#menu-list");
        this.renderer.removeClass(menu, "d-none");
      });
      this.renderer.listen(buttonElement, "mouseout", () => {
        const menu = this.el.nativeElement.querySelector("#menu-list");
        this.renderer.addClass(menu, "d-none");
      });
    }

    // Setup resolution buttons
    this.setupResolutionButtons();
  }

  private setupResolutionButtons() {
    const resolutions = [
      { id: 'high', quality: '720p' },
      { id: 'mid', quality: '480p' },
      { id: 'low', quality: '360p' }
    ];

    resolutions.forEach(({ id, quality }) => {
      const button = this.el.nativeElement.querySelector(`#${id}`);
      if (button) {
        this.renderer.listen(button, "click", () => {
          const url = this.video[`preSignedUrl${quality}`];
          this.changeVideoSource(url);
        });
      }
    });
  }

  private getPlayerConfig(res: any) {
    return {
      fluid: true,
      aspectRatio: "16:9",
      autoplay: true,
      sources: [
        {
          src: res.data.data.preSignedUrl360p,
          label: "360p",
        },
      ],
    };
  }
}
