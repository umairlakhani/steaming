import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { SpinnerService } from "src/shared/services/spinner.service";

@Injectable({
    providedIn:'root'
})
export class StorageService{
    constructor(
        private http: HttpClient,
        private spinnerService: SpinnerService,
        ) {
    }

    createUserBucket(){
        this.spinnerService.setLoading(true)
        // console.log(payload,"check payload in archive video")
        return this.http.get(environment.apiUrl + '/storage/create-space', {
            observe: 'response',
            withCredentials: true
        });
    }
    getUserBucketStorage(id:any){
        this.spinnerService.setLoading(true)
        // console.log(payload,"check payload in archive video")
        return this.http.get(environment.apiUrl + `/storage/bucket-space/${id}`, {
            observe: 'response',
            withCredentials: true
        });
    }
}