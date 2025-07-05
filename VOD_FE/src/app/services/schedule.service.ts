import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { SpinnerService } from "src/shared/services/spinner.service";

@Injectable({
    providedIn: 'root',
})
export class ScheduleService {
    constructor(
        private http: HttpClient,
        private spinnerService: SpinnerService,
    ) { }

    getSchedules(id: any) {
        // this.spinnerService.setLoading(true)
        return this.http.get(environment.apiUrl + `/schedule/public/all/${id}`, {
            observe: 'response',
            withCredentials: true
        });
    }

    getUserLiveStreamingData(id: any) {
        // this.spinnerService.setLoading(true)
        return this.http.get(environment.apiUrl + `/schedule/public/livestream/${id}`, {
            observe: 'response',
            withCredentials: true
        });
    }

    getScheduleStatus(id: any) {
        this.spinnerService.setLoading(true)
        return this.http.get(environment.apiUrl + `/schedule/public/scheduleStatus/${id}`, {
            observe: 'response',
            withCredentials: true
        });
    }
}