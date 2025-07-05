import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { SpinnerService } from "src/shared/services/spinner.service";
import { environment } from "src/environments/environment";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class DashboardService {
  constructor(
    private http: HttpClient,
    private spinnerService: SpinnerService
  ) {}
  getData(bucketId: any) {
    // this.spinnerService.setLoading(true)
    return this.http.get(
      environment.apiUrl + `/analytics/get-analytics/${bucketId}`
    );
  }
  getAnalyticData(startDate: string, endDate: string) {
    this.spinnerService.setLoading(true);
    return this.http.get(
      environment.apiUrl +
        `/analytics/get-periodic-analytics/${startDate}/${endDate}`
    );
  }
}
