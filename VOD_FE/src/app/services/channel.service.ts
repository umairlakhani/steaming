import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ChannelService {

  constructor(private http: HttpClient) { }

  getChannel(): Observable<any>{
    return this.http.get(environment.apiUrl + '/channel/owned');
  }

  createChannel(payload: any): Observable<any> {
    return this.http.post(environment.apiUrl + '/channel/create', payload); 
  }

  updateChannel(payload: any): Observable<any> {
    return this.http.post(environment.apiUrl + '/channel/update', payload);
  }

  imagesUpdateChannel(payload: any, id: number): Observable<any> {
    return this.http.post(environment.apiUrl + '/channel/images?id=' + id, payload, { observe: 'response', withCredentials: true });
  }

  deleteChannel(id: number): Observable<any> {
    return this.http.delete(environment.apiUrl + '/channel/delete?id=' + id);
  }
}
  