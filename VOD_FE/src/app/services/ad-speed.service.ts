import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SpinnerService } from 'src/shared/services/spinner.service';

@Injectable({
  providedIn: 'root'
})
export class AdSpeedService {

  constructor(
    private http: HttpClient,
    private spinnerService: SpinnerService
    ) { }
  getAllAds(page?: any, limit?: any){
    this.spinnerService.setLoading(true)
    return this.http.get(environment.apiUrl + `/adspeed/get?page=${page}&limit=${limit}`, { observe: 'response', withCredentials: true })
  }
  getAdData(id:any){
    this.spinnerService.setLoading(true)

    console.log(id,"check id sending")
    return this.http.get(environment.apiUrl + `/adspeed/get/${id}`, { observe: 'response', withCredentials: true })
  }

  editAd(payload:any){
    this.spinnerService.setLoading(true)

    console.log(payload,"check payload")
        return this.http.post(environment.apiUrl + '/adspeed/edit-ad', payload, {
            observe: 'response',
            withCredentials: true
        });
  }

  deleteAd(payload:any){
    this.spinnerService.setLoading(true)

    console.log(payload,"check payload")
    let obj = {id:payload}
    return this.http.post(environment.apiUrl + '/adspeed/delete', obj, {
        observe: 'response',
        withCredentials: true
    });
  }

}
