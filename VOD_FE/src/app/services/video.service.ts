import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { SpinnerService } from 'src/shared/services/spinner.service';

@Injectable({
    providedIn: 'root'
})
export class VideoService {

    constructor(
        private http: HttpClient,
        private spinnerService: SpinnerService,
    ) {
    }

    uploadVideo(payload: any) {
        this.spinnerService.setLoading(true)
        console.log(payload, "check payload in archive video")
        return this.http.post(environment.apiUrl + '/video/create', payload, {
            observe: 'response',
            withCredentials: true
        });
    }
    startLiveStream(time?: any) {
        // const time = new Date().getTime();
        this.spinnerService.setLoading(true)
        return this.http.get(`${environment.streamUrl}/livestream/live-stream-create?time=${time}`, {
            observe: 'response',
            withCredentials: true
        });
    }
    createLiveStreamRecord(payload: any) {
        this.spinnerService.setLoading(true)
        return this.http.post(`${environment.apiUrl}/livestreaming/live-stream-create-record`, payload, {
            observe: 'response',
            withCredentials: true
        });
    }
    updateLiveStreamThumbnail(payload: any) {
        return this.http.post(`${environment.apiUrl}/livestreaming/update-live-stream-thumbnail`, payload, {
            observe: 'response',
            withCredentials: true
        });
    }
    generateStreamKey(payload: any) {
        this.spinnerService.setLoading(true)
        return this.http.post(`${environment.apiUrl}/livestreaming/generate-stream-key`, payload, {
            observe: 'response',
            withCredentials: true
        });
    }
    getStreamKey() {
        this.spinnerService.setLoading(true)
        return this.http.get(`${environment.apiUrl}/livestreaming/get-stream-key`, {
            observe: 'response',
            withCredentials: true
        });
    }

    getCurrentSubscription() {
        this.spinnerService.setLoading(true);
        return this.http.get(environment.apiUrl + '/users/active-plan', {
            observe: 'response', withCredentials: true, headers:
                new HttpHeaders(
                    {
                        "Content-Type": "application/json"
                    })
        });
    }

    checkVideoOnAir(id: any) {
        this.spinnerService.setLoading(true)
        return this.http.get(`${environment.apiUrl}/livestreaming/check-video-onair/${id}`, {
            observe: 'response',
            withCredentials: true
        });
    }

    endLiveStream(streamID: string, record: boolean, usageTableId: any) {
        // const time = new Date().getTime();
        this.spinnerService.setLoading(true)
        return this.http.get(`${environment.streamUrl}/livestream/live-stream-end?time=${streamID}&record=${record}&usage=${usageTableId}`, {
            // return this.http.get(`https://192.168.18.186:3000/livestream/live-stream-create?time=${streamID}` ,{
            observe: 'response',
            withCredentials: true
        });
    }

    editVideo(payload: any) {
        this.spinnerService.setLoading(true)

        console.log("edit api")
        console.log(payload, "check")
        return this.http.post(environment.apiUrl + '/video/update', payload, {
            observe: 'response',
            withCredentials: true
        });
    }

    archiveVideo(payload: any) {
        // this.spinnerService.setLoading(true)
        return this.http.post(environment.apiUrl + '/video/archive', payload, {
            observe: 'response',
            withCredentials: true
        });
    }

    removeVideo(payload: any) {
        this.spinnerService.setLoading(true)
        return this.http.post(environment.apiUrl + '/video/delete', payload, {
            observe: 'response',
            withCredentials: true
        });
    }

    getVideo(payload: any) {
        this.spinnerService.setLoading(true)
        console.log(payload, " check payload")
        const data = this.http.get(environment.apiUrl + `/video/get/${payload}`)
        console.log(data)
        return data
    }
    getVideoByVideoId(payload: any) {
        this.spinnerService.setLoading(true)
        console.log(payload, " check payload")
        const data = this.http.get(environment.apiUrl + `/video/get/videoId/${payload}`)
        console.log(data)
        return data
    }
    changeStatus(id: any, status: any) {
        this.spinnerService.setLoading(true)
        let obj = {
            type: status
        }
        if (status == 'PUBLIC') {
            obj.type = 'PRIVATE'
        } else {
            obj.type = 'PUBLIC'

        }
        return this.http.put(environment.apiUrl + `/video/type/${id}`, obj, {
            observe: 'response',
            withCredentials: true
        });
    }
    getUserPublicVideos(payload: any, search?: any, page?: any, limit?: any) {
        console.log(page, "page")
        console.log(limit, "limit")
        this.spinnerService.setLoading(true)
        let url = environment.apiUrl + `/video/public/${payload}?page=${page}&limit=${limit}`
        if (search) {
            url = url + `&title=${search}`
        }
        const data = this.http.get(url)
        return data
    }

    ownedListArchived(page?: any, limit?: any, search?: any) {
        this.spinnerService.setLoading(true)
        page = page || 1
        limit = limit || 10
        let url = environment.apiUrl + `/video/owned/archived?page=${page}&limit=${limit}`
        if (search) {
            url = url + `&title=${search}`
        }
        return this.http.get(url, {
            observe: 'response',
            withCredentials: true
        });
    }

    ownedListPublished(page?: any, limit?: any, search?: any) {
        this.spinnerService.setLoading(true)
        page = page || 1
        limit = limit || 10
        let url = environment.apiUrl + `/video/owned/published?page=${page}&limit=${limit}`
        if (search) {
            url = url + `&title=${search}`
        }
        return this.http.get(url, {
            observe: 'response',
            withCredentials: true
        });
    }

    ownedListCompleteArchived() {
        this.spinnerService.setLoading(true)
        let url = environment.apiUrl + "/video/owned/complete-archived"
        return this.http.get(url, {
            observe: 'response',
            withCredentials: true
        });
    }

    ownedListCompletePublished() {
        this.spinnerService.setLoading(true)
        let url = environment.apiUrl + "/video/owned/complete-published"
        return this.http.get(url, {
            observe: 'response',
            withCredentials: true
        });
    }

    ownedListSinglePublished(videoId:any) {
        let url = environment.apiUrl + `/video/owned/publishedById/${videoId}`
        return this.http.get(url, {
            observe: 'response',
            withCredentials: true
        });
    }

    ownedListPublishedProcessed(title?: string, page?: any, limit?: any) {
        this.spinnerService.setLoading(true)
        let url;
        if (title) {
            url = environment.apiUrl + `/video/owned/published/processed?title=${title}&page=${page}&limit=${limit}`

        } else {
            url = environment.apiUrl + `/video/owned/published/processed?page=${page}&limit=${limit}`

        }
        return this.http.get(url, {
            observe: 'response',
            withCredentials: true
        });
    }
    liveStreamVideos(title?: string, page?: any, limit?: any) {
        this.spinnerService.setLoading(true)
        let url;
        if (title) {
            url = environment.apiUrl + `/video/livestreaming-videos?title=${title}&page=${page}&limit=${limit}`

        } else {
            url = environment.apiUrl + `/video/livestreaming-videos?page=${page}&limit=${limit}`

        }
        return this.http.get(url, {
            observe: 'response',
            withCredentials: true
        });
    }
    userLiveStreamVideos(title?: string, page?: any, limit?: any) {
        this.spinnerService.setLoading(true)
        let url;
        if (title) {
            url = environment.apiUrl + `/video/livestreaming/user?title=${title}&page=${page}&limit=${limit}`

        } else {
            url = environment.apiUrl + `/video/livestreaming/user?page=${page}&limit=${limit}`

        }
        return this.http.get(url, {
            observe: 'response',
            withCredentials: true
        });
    }

    uploadVideoFile(payload: any) {
        this.spinnerService.setLoading(true)
        return this.http.post(environment.apiUrl + '/video/video-upload', payload, {
            observe: 'response',
            withCredentials: true
        });
    }
    uploadVideoAdFile(payload: any) {
        this.spinnerService.setLoading(true)

        console.log(payload, "check payload")
        return this.http.post(environment.apiUrl + '/adspeed/video-upload', payload, {
            observe: 'response',
            withCredentials: true
        });
    }
    uploadVideoAd(payload: any) {
        this.spinnerService.setLoading(true)

        console.log(payload, "check pay")
        return this.http.post(environment.apiUrl + '/adspeed/create-video-ad', payload, {
            observe: 'response',
            withCredentials: true
        });
    }

    uploadWrapperVideoAd(payload: any) {
        this.spinnerService.setLoading(true)

        console.log(payload, "check pay")
        return this.http.post(environment.apiUrl + '/adspeed/create-wrappervideo-ad', payload, {
            observe: 'response',
            withCredentials: true
        });
    }

    scheduleVideo(payload: any) {
        this.spinnerService.setLoading(true)

        console.log(payload, "check payload")
        return this.http.post(environment.apiUrl + '/schedule/create', payload, {
            observe: 'response',
            withCredentials: true
        });
    }

    saveSchedule(payload: any) {
        this.spinnerService.setLoading(true)
        console.log(payload, "check payload")
        return this.http.post(environment.apiUrl + '/schedule/saveSchedule', payload, {
            observe: 'response',
            withCredentials: true
        });
    }

    slotProcessing(id: any, payload: any) {
        this.spinnerService.setLoading(true)
        console.log(payload, "check payload")
        return this.http.put(environment.apiUrl + `/schedule/processSlots/${id}`, payload, {
            observe: 'response',
            withCredentials: true
        })
    }

    updateSaveSchedule(id: any, payload: any, matchStart?: any, matchEnd?: any) {
        this.spinnerService.setLoading(true)
        console.log(payload, "check payload")
        return this.http.put(environment.apiUrl + `/schedule/updateSchedule/${id}?matchStart=${matchStart}&matchEnd=${matchEnd}`, payload, {
            observe: 'response',
            withCredentials: true
        });
    }


    editScheduleVideo(scheduleId: any, payload: any) {
        this.spinnerService.setLoading(true)

        console.log(payload, "check payload")
        return this.http.put(environment.apiUrl + '/schedule/update/' + scheduleId, payload, {
            observe: 'response',
            withCredentials: true
        });
    }
    getSchedule(id: any, date?: any) {
        console.log(date, "check date in videoservice")
        this.spinnerService.setLoading(true)
        let url;
        if (!date) {
            url = environment.apiUrl + `/schedule/get/` + id

        } else {
            url = environment.apiUrl + `/schedule/get/${id}?date=${date}`
        }

        return this.http.get(url, { observe: 'response', withCredentials: true })
    }

    getSchedules(page?: any, limit?: any, search?: any) {
        // this.spinnerService.setLoading(true)
        page = page || 1
        limit = limit || 10
        let url = environment.apiUrl + `/schedule/all?page=${page}&limit=${limit}`
        if (search) {
            url = url + `&name=${search}`
        }
        return this.http.get(url, { observe: 'response', withCredentials: true });
    }
    getScheduleData(id?: any, date?: any) {
        // this.spinnerService.setLoading(true)
        let url;
        if (id) {
            url = environment.apiUrl + `/schedule/scheduleData?id=${id}`
        } else {
            url = environment.apiUrl + `/schedule/scheduleData`
        }
        return this.http.get(url, { observe: 'response', withCredentials: true });
    }

    deleteSchedules(id: any) {
        this.spinnerService.setLoading(true)

        return this.http.delete(environment.apiUrl + '/schedule/delete/' + id, {
            observe: 'response',
            withCredentials: true
        });
    }

    liveStreaming(id: any) {
        this.spinnerService.setLoading(true)

        return this.http.get(environment.apiUrl + '/livestreaming/streaming/' + id, {
            observe: 'response',
            withCredentials: true
        });
    }
      getStreamStatus(streamId: string) {
        return this.http.get(`${environment.apiUrl}/livestream/stream-status/${streamId}`);
  }

    getLiveStreamingRecord(id: any) {
        return this.http.get(environment.apiUrl + '/livestreaming/streamingrecord/' + id, {
            observe: 'response',
            withCredentials: true
        });
    }

    sendFileLiveStream(file: any, stream_name: any) {
        const formData = new FormData();

        formData.append('file', file);
        formData.append('name', stream_name);
        return this.http.put(`${environment.apiUrl}/livestreaming/live-stream-upload`, formData)
        // fetch(`${environment.apiUrl}/live-stream-upload`, {
        //     method: 'PUT',
        //     body: formData
        // });
    }
    // getLatestChunk(stream_name: any) {

    //     return this.http.get(`${environment.apiUrl}/livestreaming/live-stream-chunk?name=${stream_name}`)
    //     // fetch(`${environment.apiUrl}/live-stream-upload`, {
    //     //     method: 'PUT',
    //     //     body: formData
    //     // });
    // }

    // userLeft(stream_name: any) {
    //     return this.http.get(`${environment.apiUrl}/livestreaming/live-stream-user-leave/${stream_name}`)
    // }

    terminateRecording(stream_name: any) {
        let obj = {
            name: stream_name
        }
        return this.http.post(environment.apiUrl + '/livestreaming/live-stream-endtime', obj, {
            observe: 'response',
            withCredentials: true
        });
    }

    getUserZoneTag(streamId: any) {
        this.spinnerService.setLoading(true)
        return this.http.get(environment.apiUrl + '/zone/livestream/tag/' + streamId, {
            observe: 'response',
            withCredentials: true
        });
    }



}
