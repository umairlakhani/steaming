import { Component, Inject, Input, OnInit, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from "@angular/router";
import { VideoService } from 'src/app/services/video.service';
import { DeleteConfirmationComponent, VideoUploadComponent } from 'src/app/video-archive/video-archive.component';
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-new-schedule',
    templateUrl: './new-schedule.component.html',
    styleUrls: ['./new-schedule.component.scss']
})
export class NewScheduleComponent implements OnInit {
    items: any[] = [];
    searchQuery = ''
    schedule = {}
    mobileView: boolean = false
    currentDate: any
    totItems: any
    totalItems = 0;
    currentPage = 1;
    itemsPerPage = 10;

    constructor(
        private router: Router,
        private videoService: VideoService,
        public dialog: MatDialog,

    ) {
    }

    ngOnInit() {
        const dateObj = new Date();
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'short', // 'Tue'
            month: 'short',   // 'Aug'
            day: '2-digit',   // '01'
            year: 'numeric',  // '2023'
        });
        console.log(formattedDate, "formattedDate")
        this.currentDate = formattedDate
        if (window.innerWidth < 768) {
            this.mobileView = true
        }


        // if (!sessionStorage.getItem('isReloaded')) {
        //     sessionStorage.setItem('isReloaded', 'true'); // Set sessionStorage flag to prevent repeated reloads
        //     location.reload(); // Reload the page on load
        // }
        /*this.videoService.getSchedules().subscribe((results: any) => {
            this.items = results.body?.data;
        });*/
        console.log(this.router.url, "check")
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
        this.getData();
        // console.log(this.scheduleId)
    }
    navigateEdit(id: any) {
        console.log(id, "check id ")
        console.log(this.currentDate, "check this.currentDate ")
        this.router.navigate([`/new-schedule`], { queryParams: { id: id, date: this.currentDate } })
    }
    navigateToSchedule(id: any) {
        // this.router.navigate([`/new-schedule?id=${id}&date=${new Date().getDate()}`])
        // this.router.navigate([`/new-schedule`],{queryParams:{id:id,date:new Date().toDateString()}})
        this.router.navigate([`/schedule-date`], { queryParams: { id: id } })
    }
    navigateToPublic() {
        let userId = localStorage.getItem('userId')
        this.router.navigateByUrl(`/public/${userId}`)
    }
    createSchedule() {

    }

    removeSchedule(id: any) {
        const dialogRef = this.dialog.open(DeleteConfirmationComponent, {
            width: '350px',
            data: {
                title: "Delete Schedule",
                text: "Would you like to delete this schedule?"
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.videoService.deleteSchedules(id).subscribe((result: any) => {
                    console.log(result.body?.message);
                    this.items = this.items?.filter((element) => element.id !== id);
                });
            }
        });
    }

    displayDate(streamAt: any) {
        return new Date(streamAt).toString().split(' GMT')[0];
    }
    handleScheduleEdit(id: any) {
        this.router.navigate(['./new-schedule.component.html'])
    }
    getData() {
        this.videoService.getSchedules(this.currentPage.toString(), this.itemsPerPage.toString(), this.searchQuery)
            .subscribe((res: any) => {
                console.log(res.body.data, "res.body.data")
                this.items = res.body.data;
                this.totalItems = res.body.data.totalRecords;
            });
    }
    openScheduleModal(id: any) {
        console.log(id, "check id")
        this.videoService.getSchedule(id)
            .subscribe((res: any) => {

                console.log(res)
                this.schedule = res.body
                const dialogRef = this.dialog.open(ScheduleDialog, {
                    width: '590px',
                    height: '590px',
                    // data:id
                    data: res.body
                })
            })


        // dialogRef.afterClosed().subscribe((result)=>{
        //     if(result == true){
        //         console.log("modal closed")
        //     }
        // })
        // console.log(id,"id")
    }

    openCreateSchedule() {
        const dialogRef = this.dialog.open(ScheduleModal, {
            width: '600px',
            height: '350px'
        })
        dialogRef.afterClosed().subscribe((res) => {
            console.log(res, "check res")
            if (res != undefined) {
                this.items = [res, ...this.items]
            }
        })
    }
    onPageChange(event: any) {
        console.log({ event })
        this.currentPage = event;
        // this.itemsPerPage = event.pageSize;
        this.getData();
    }

    inputSubject = new Subject<string>();

    SearchData(target: any) {
        this.inputSubject.next(target.value)
    }

}

@Component({
    selector: 'schedule-dialog',
    templateUrl: 'schedule-dialog.html'
})
export class ScheduleDialog {
    schedule: any;
    constructor(
        public dialogRef: MatDialogRef<ScheduleDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        // private videoService:VideoService
    ) {
    }
    getDate(timstamp: any) {
        const dateTime = new Date(timstamp);
        const year = dateTime.getFullYear();
        const month = dateTime.getMonth() + 1; // Months are zero-based, so add 1
        const day = dateTime.getDate();
        const date = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
        return date
    }
    getTime(timstamp: any) {
        const dateTime = new Date(timstamp);
        const hours = dateTime.getHours();
        const minutes = dateTime.getMinutes();
        const seconds = dateTime.getSeconds();
        const time = `${hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        return time
    }
}

@Component({
    selector: 'schedule-modal',
    templateUrl: 'schedule-modal.html',
    styleUrls: ['./new-schedule.component.scss']
})
export class ScheduleModal {
    schedule = new FormGroup({
        name: new FormControl('', [Validators.required]),
        description: new FormControl(''),
        // image: new FormControl('')
    })
    constructor(
        public dialogRef: MatDialogRef<ScheduleModal>,
        private videoService: VideoService,
        private router: Router

    ) { }
    saveSchedule() {
        if (!this.schedule.valid) {
            return
        } else {
            this.videoService.saveSchedule(this.schedule.value).subscribe((res) => {
                console.log(res, "checl res")
                this.dialogRef.close({ id: (res as any).body.data.id, ...this.schedule.value })
                console.log(this.schedule.value, "check schedule value sending")
                if (window.location.href.includes('published')) {
                    // this.router.navigate([``],)
                    this.router.navigate([`/schedule-date`], { queryParams: { id: (res as any).body.data.id } })

                } else {
                    // window.location.reload()
                }
            })
        }

    }
}
