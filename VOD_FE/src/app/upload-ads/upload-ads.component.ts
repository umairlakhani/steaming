import { ChangeDetectorRef, EventEmitter, Inject, Component, ViewChild, Output, ElementRef, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { VideoService } from '../services/video.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserData } from '../guard.guard';

@Component({
  selector: 'app-upload-ads',
  templateUrl: './upload-ads.component.html',
  styleUrls: ['./upload-ads.component.scss']
})
export class UploadAdsComponent {
  @ViewChild('videoUpload') videoUpload?: ElementRef;
  @ViewChild('videoPlayer') videoPlayer?: ElementRef;
  selectedOption: any = 'select';
  selectedFile: File | undefined;
  isVideoLoaded: boolean = false;
  videoLength: any;
  urlTypeSelected: any = '';
  userData: any = UserData;
  weight = [
    { label: '0 (paused)', value: "0" },
    { label: '1', value: "1" },
    { label: '2', value: "2" },
    { label: '3', value: "3" },
    { label: '4', value: "4" },
    { label: '5', value: "5" },
    { label: '6', value: "6" },
    { label: '7', value: "7" },
    { label: '8', value: "8" },
    { label: '9', value: "9" },
    { label: '10 (more often)', value: "10" },
    { label: 'Auto', value: '11' }
  ];
  @Output() adId = new EventEmitter<any>()
  constructor(
    private videoService: VideoService,
    private changeDetectorRef: ChangeDetectorRef,
    private toasterService: ToastrService,
    private router: Router,
    private dialog: MatDialog
  ) {
    if (!this.userData.premiumUser) {
      this.router.navigate(['/profile'])
    }
  }


  onOptionChange(e: any) {
    console.log(e.target.value)
    this.selectedOption = e.target.value
    this.changeDetectorRef.detectChanges();
  }
  onUrlTypeChange(e: any) {
    console.log(e.target.value)
    this.urlTypeSelected = e.target.value
    console.log(this.urlTypeSelected, "check url type")
  }
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    let length = this.loadVideo()
    //    console.log(length,"check length")
  }
  loadVideo() {
    if (this.videoPlayer && this.selectedFile) {
      const videoUrl = URL.createObjectURL(this.selectedFile);
      this.videoPlayer.nativeElement.src = videoUrl;
      this.videoPlayer.nativeElement.load();
      this.isVideoLoaded = false;
      this.videoPlayer.nativeElement.addEventListener('loadedmetadata', this.onVideoMetadataLoaded.bind(this));
    }
  }
  onVideoMetadataLoaded() {
    this.isVideoLoaded = true;
    this.getVideoDuration();

    this.videoPlayer?.nativeElement.removeEventListener('loadedmetadata', this.onVideoMetadataLoaded.bind(this));
  }
  getVideoDuration() {
    if (this.videoPlayer && this.isVideoLoaded) {
      const durationInSeconds = Math.floor(this.videoPlayer.nativeElement.duration);
      console.log('Video duration:', durationInSeconds);
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      const seconds = Math.floor(durationInSeconds % 60);
      const formattedHours = String(hours).padStart(2, '0');
      const formattedMinutes = String(minutes).padStart(2, '0');
      const formattedSeconds = String(seconds).padStart(2, '0');
      this.videoLength = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
      console.log(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`, "`${formattedHours}:${formattedMinutes}:${formattedSeconds}`")

    }
  }

  adUploadForm = new FormGroup({
    type: new FormControl('', [Validators.required]),
    // new FormControl('', [Validators.required]),
    videourl: new FormControl(''),
    skipAd: new FormControl(false),
    skipTime: new FormControl(null, [Validators.required, Validators.min(1)]),
    clickurl: new FormControl(''),
    name: new FormControl('', [Validators.required]),
    wrapperUrl: new FormControl(''),
    urlType: new FormControl('vidCheckUrl', [Validators.required]),
    weight: new FormControl(null),
    // vidCheck:new FormControl('', [Validators.required]),
    // wrapCheck:new FormControl('', [Validators.required]),
  })

  createAd() {
    // let payload: any = this.adUploadForm.value
    // console.log(payload,"payload before")
    const skipTime = this.adUploadForm.get('skipTime');
    if (!this.adUploadForm.value.skipAd) {
      console.log("false")
      skipTime?.clearValidators()
      skipTime?.updateValueAndValidity()
    } else {
      skipTime?.addValidators([Validators.required])
      skipTime?.updateValueAndValidity()
    }
    Object.values(this.adUploadForm.controls).forEach((control: any) => {
      control.markAsDirty();
    });
    if (!this.adUploadForm.valid) {
      console.log('adUploadForm is invalid');
      return;
    }
    const formData = new FormData();
    formData.append('video', this.selectedFile ? this.selectedFile : '');
    let payload: any = this.adUploadForm.value;


    console.log(payload, "check payload")
    // if(payload.method =="streamVideoAd"){
    //   payload.clickurl = ""
    // }
    if (payload.urlType == "wrapCheckUrl") {
      payload.videourl = ""
    }
    if (payload.videourl == '' && payload.wrapperUrl == '') {
      let errorToast = this.toasterService.error('Please attach video file or wrapper url')
      setTimeout(() => {
        this.toasterService.remove(errorToast.toastId)
      }, 2000)
      return
    } else {
      const toast = this.toasterService.info('Your Ad is being uploaded ...... Please wait')

      // let obj = {
      //   name:payload.name,
      //   // videoId:videoFile.body.data.video.newFilename,
      //   skipAd:payload.skipAd,
      //   clickurl:payload.clickurl,
      //   // videourl:videoFile.body.data.videourl,
      //   type:payload.type,
      //   // size:videoFile.body.data.video.size,
      //   length:this.videoLength,
      //   weight:this.adUploadForm.value.weight != null ? this.adUploadForm.value.weight:'1',
      //   skippable:this.adUploadForm.value.skipAd == false ? '' : this.adUploadForm.value.skipTime 
      // }

      // console.log(obj ,"chck obj")
      if (payload.urlType !== "wrapCheckUrl") {
        this.videoService.uploadVideoAdFile(formData)
          .subscribe((videoFile: any) => {
            console.log(videoFile.body.data.video, "asd")
            let payload: any = this.adUploadForm.value;
            payload.videoId = videoFile.body.data.video.newFilename;
            payload.size = videoFile.body.data.video.size;
            payload.length = this.videoLength;
            payload.videourl = videoFile.body.data.videourl

            let obj = {
              name: payload.name,
              videoId: videoFile.body.data.video.newFilename,
              skipAd: payload.skipAd,
              clickurl: payload.clickurl.includes('https://') ? 
              payload.clickurl : 
              payload.clickurl != '' ?
              `https://${payload.clickurl}`: 
              payload.clickurl,
              videourl: videoFile.body.data.videourl,
              type: payload.type,
              size: videoFile.body.data.video.size,
              length: this.videoLength,
              weight: this.adUploadForm.value.weight != null ? this.adUploadForm.value.weight : '1',
              skippable: this.adUploadForm.value.skipAd == false ? 0 : this.adUploadForm.value.skipTime,
              duration: Math.floor(this.videoPlayer?.nativeElement.duration)

            }
            console.log(obj, "check obj after uploading video")
            console.log('Video ad file uploaded successfully!');
            this.videoService.uploadVideoAd(obj)
              .subscribe(result => {
                this.toasterService.remove(toast.toastId)
                this.router.navigateByUrl('/ads-list');
                console.log("video ad uploaded successfully")
              })
          })
      }
      else {

        let obj = {
          name: payload.name,
          skipAd: payload.skipAd,
          type: payload.type,
          wrapperUrl: payload.wrapperUrl,
          clickurl: payload.clickurl
        }
        console.log(obj)
        //  payload.videoId = videoFile.body.data.video.newFilename;
        //     payload.size = videoFile.body.data.video.size;
        //     payload.length =this.videoLength;
        //     payload.videourl = videoFile.body.data.videourl

        //     console.log('Video ad file uploaded successfully!');
        this.videoService.uploadWrapperVideoAd(obj)
          .subscribe(result => {
            this.toasterService.remove(toast.toastId)
            this.router.navigateByUrl('/ads-list');
            console.log("video wrapper ad uploaded successfully")
          })
      }
    }






    // // // // // //


    // this.videoService.uploadVideoAdFile(formData)
    // .subscribe((videoFile:any)=>{

    //   console.log(videoFile.body.data.video,"asd")
    //   let payload: any = this.adUploadForm.value;

    //   if(payload.method == "AS.Ads.createVASTWrapper"){
    //     payload.videoId = videoFile.body.data.video.newFilename;
    //     payload.size = videoFile.body.data.video.size;
    //     payload.length =this.videoLength;
    //     payload.videourl = videoFile.body.data.videourl
    //     console.log('Video ad file uploaded successfully!');
    //     this.videoService.uploadWrapperVideoAd(payload)
    //     .subscribe(result=>{
    //       this.toasterService.remove(toast.toastId)
    //       console.log("video wrapper ad uploaded successfully")
    //     })
    //   }else{
    //     payload.videoId = videoFile.body.data.video.newFilename;
    //     payload.size = videoFile.body.data.video.size;
    //     payload.length =this.videoLength;
    //     payload.videourl = videoFile.body.data.videourl

    //     console.log('Video ad file uploaded successfully!');
    //     this.videoService.uploadVideoAd(payload)
    //     .subscribe(result=>{
    //       this.toasterService.remove(toast.toastId)
    //       console.log("video ad uploaded successfully")
    //     })
    //   }

    // })
    // console.log(payload,"payload after")
  }
}

