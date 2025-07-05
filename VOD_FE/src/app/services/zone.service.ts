import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { SpinnerService } from "src/shared/services/spinner.service";

@Injectable({
    providedIn: 'root'
})
export class ZoneService {
    constructor(
        private http: HttpClient,
        private spinnerService: SpinnerService,
        ) {
    }

    createZone(payload: any) {
        this.spinnerService.setLoading(true)
        console.log(payload,"check payload for zone")
        return this.http.post(environment.apiUrl + '/zone/create', payload, {
            observe: 'response',
            withCredentials: true
        });
    }
}