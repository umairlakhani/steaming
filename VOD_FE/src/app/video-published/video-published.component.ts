import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged, map, Subject, tap } from 'rxjs';
import { VideoService } from '../services/video.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { VideoinfoComponent } from '../video-archive/video-archive.component';
import { ScheduleModal } from '../components/new-schedule/new-schedule.component';

@Component({
  selector: 'app-video-published',
  templateUrl: './video-published.component.html',
  styleUrls: ['./video-published.component.scss']
})

export class VideoPublishedComponent implements OnInit {
  videos: any[] = [];
  currentPage = 1;
  itemsPerPage = 6;
  totalItems = 0;
  searchQuery = ''

  constructor(
    private videoService: VideoService,
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {

    this.inputSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      ).subscribe(value => {
        console.log(value);
        this.searchQuery = value;
        this.getData()
        // perform any other desired action with the input value
      });

    /*this.videoService.ownedListPublished()
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

    this.getData()
  }

  archiveVideo(id: string) {
    this.videoService.archiveVideo({
      id: id,
      archive: true,
      published: false
    }).subscribe((result: any) => {
      this.getData()
    });
  }
  openVideoInfo(id: any) {
    const dialogRef = this.dialog.open(VideoinfoComponent, {
      width: '550px',
      height: '480px',
      data: id
    })
    // dialogRef.afterOpened().subscribe(()=>{
    //     this.getVideoInfo(id)
    // })
    // console.log("working")
  }
  changeStatus(id: any, status: any) {
    console.log(id, "id")
    console.log(status, 'status')
    this.videoService.changeStatus(Number(id), status).subscribe((res) => {
      console.log(res)
      window.location.reload()
    })
  }

  getVideoInfo(id: any) {
    this.videoService.getVideo({
      id: id
    }).subscribe((result) => {
      console.log(result, "result")
    })
  }

  openJsonModal(videoData: any) {
    this.videoService.ownedListSinglePublished(videoData.id)
    .subscribe((res: any) => {
      console.log(res.body.data.result, "res.body.data.result")
      const videoJson = res.body.data.result;
      const dialogRef = this.dialog.open(VideoJSONComponent, {
        width: '550px',
        data: videoJson
      });

    })
  }


  getAllVideosJson() {
    this.videoService.ownedListCompletePublished()
      .subscribe((res: any) => {
        let videoJson = res.body.data.results;

        console.log(videoJson,"videoJson")

        const blob = new Blob([JSON.stringify(videoJson, null, 2)], { type: 'application/json' })
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = 'video-data-published.json'
        downloadLink.click();
      });
  }

  getVideoTime(length: any) {
    return length > 3599 ? new Date(length * 1000).toISOString().slice(11, 19) : new Date(length * 1000).toISOString().slice(14, 19);
  }

  openDialog(id: string) {
    const dialogRef = this.dialog.open(ScheduleModal, {
      width: '600px',
      height: '350px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.getData()
      }
    });
  }

  getData() {
    this.videoService.ownedListPublished(this.currentPage.toString(), this.itemsPerPage.toString(), this.searchQuery)
      .subscribe((res: any) => {
        this.videos = res.body.data.results;
        console.log(this.videos, "this.videos")
        this.totalItems = res.body.data.totalRecords;
      });
    /*this.http.get('https://example.com/api/data', { params }).subscribe((response: any) => {
      this.data = response.data;
      this.totalItems = response.totalItems;
    });*/
  }

  onPageChange(event: any) {
    console.log({ event })
    this.currentPage = event;
    this.getData();
  }

  inputSubject = new Subject<string>();

  SearchData(target: any) {
    this.inputSubject.next(target.value)
  }
}

@Component({
  selector: 'video-json',
  templateUrl: 'video-json.html',
  styleUrls: ['./video-published.component.scss']
})
export class VideoJSONComponent {
  constructor(
    private videoService: VideoService, 
    public dialogRef: MatDialogRef<VideoJSONComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  copyToClipboard() {
    const jsonString = JSON.stringify(this.data, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      // You could add a toast notification here
      console.log('JSON copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy JSON: ', err);
    });
  }
}

@Component({
  selector: 'schedule-video',
  templateUrl: 'schedule-video.html',
})
export class ScheduleVideoComponent {

  constructor(private videoService: VideoService, public dialogRef: MatDialogRef<ScheduleVideoComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
  }
}
