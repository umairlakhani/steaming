import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private dataSubject = new Subject<any>();

  sendData(data: any) {
    this.dataSubject.next(data);
  }

  getData() {
    return this.dataSubject.asObservable();
  }

  sendFilledData(data:any){
    this.dataSubject.next(data);
  }

  getFilledData() {
    return this.dataSubject.asObservable();
  }
}