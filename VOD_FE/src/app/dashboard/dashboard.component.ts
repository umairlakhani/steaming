import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from "@angular/core";
import { UserInfo } from "../model/profile.model";
import { IDoughnutChartCfg } from "../model/charts.model";
import { Chart, Plugin } from 'chart.js/auto';
import { DashboardService } from "../services/dashboard.service";
import { UserService } from "../services/user.service";
import { ActivatedRoute, Router, NavigationEnd } from "@angular/router";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements AfterViewInit, OnInit {
  upload = false;
  userInfo!: UserInfo;
  userData: any = this.userService.getTokenData()
  analyticsData: any
  @ViewChild('storage') storageChartRef!: ElementRef
  storage!: Chart;
  @ViewChild('bandwidth') bandwidthChartRef!: ElementRef
  bandwidth!: Chart;
  storageChartCfg!: IDoughnutChartCfg;
  bandwidthChartCfg!: IDoughnutChartCfg;
  public chart: any;

  // public doughnutChartDatasets: Chart.ChartConfiguration<'doughnut'>['data']['datasets'] = [
  //     { data: [ 350 ], label: 'Series A' },
  //   ];

  // public doughnutChartOptions: Chart.ChartConfiguration<'doughnut'>['options'] = {
  //   responsive: false,
  //   backgroundColor:"#FFAA0E",
  // };
  // public Bandwidth: Chart.ChartConfiguration<'doughnut'>['options'] = {
  //   responsive: false,
  //   backgroundColor:"#811630",
  // };
  constructor(
    private dashboardService: DashboardService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  // ngOnInit(): void {

  //     this.userInfo = {
  //       name: "John",
  //       renewOn: "2023-10-05T14:48:00.000Z",
  //       package: "Professional",
  //       storage: "0.56",
  //       bandwidth: "0.38",
  //     };

  //     this.storageChartCfg = {
  //       datasets: [
  //         {
  //           backgroundColor: ["#0000FF", "#E3E3FC"],
  //           data: [Math.round(+this.userInfo.storage * 100), 100],
  //           borderRadius: 2
  //         },
  //       ],
  //     };
  //     this.bandwidthChartCfg = {
  //       datasets: [
  //         {
  //           backgroundColor: ["#FFAA0E", "#E3E3FC"],
  //           data: [Math.round(+this.userInfo.bandwidth * 100), 100],
  //           borderRadius: 2
  //         },
  //       ],
  //     };

  //     var myChart = new Chart ("myChart", {
  //       type: 'doughnut',
  //       data: {
  //           datasets: [{
  //               label: '# of Votes',
  //               data: [12, 19, 3, 5, 2, 3],
  //               backgroundColor: [
  //                   'rgba(255, 99, 132, 0.2)',
  //                   'rgba(54, 162, 235, 0.2)',
  //                   'rgba(255, 206, 86, 0.2)',
  //                   'rgba(75, 192, 192, 0.2)',
  //                   'rgba(153, 102, 255, 0.2)',
  //                   'rgba(255, 159, 64, 0.2)'
  //               ],
  //               borderColor: [
  //                   'rgba(255, 99, 132, 1)',
  //                   'rgba(54, 162, 235, 1)',
  //                   'rgba(255, 206, 86, 1)',
  //                   'rgba(75, 192, 192, 1)',
  //                   'rgba(153, 102, 255, 1)',
  //                   'rgba(255, 159, 64, 1)'
  //               ],
  //               borderWidth: 1
  //           }]
  //       },
  //       options: {
  //           scales: {
  //               y: {
  //                   beginAtZero: true
  //               }
  //           }
  //       }
  //   });
  // this.chart = myChart


  //   }
  ngOnInit(): void {
    //  this.router.events.subscribe((event)=>{
    //   if (event instanceof NavigationEnd) {
    //     const currentUrl = event.url;
    //     const previousUrl = event.urlAfterRedirects;
    //     console.log('Current URL:', currentUrl);
    //     console.log('Previous URL:', previousUrl);
    //   }
    //  })
    this.dashboardService.getData(this.userData.bucketId).subscribe((res) => {
      let now = Date.now()
      console.log(this.userData,"check user data")
      console.log((res as any).data, "(res as any).data")
      console.log(this.userData.premiumUser, "this.userData.premiumUser")
      console.log((res as any).data.subscriptionId, "(res as any).data subscriptionId")
      console.log(Number((res as any).data.to) > now, "> now")
      let response = (res as any).data
      // if (this.userData.premiumUser == false &&
      //   response.subscriptionId != null &&
      //   Number(response.to) > now
      // ) {
      //   console.log("reload page")
      //   window.location.reload()
      // }
      if (this.userData.premiumUser == true &&
        response.subscriptionId == null &&
        !sessionStorage.getItem('reloaded')
      ) {
        sessionStorage.setItem('reloaded', 'true');
        console.log("reload page")
        window.location.reload()
      }
      this.analyticsData = (res as any).data
      // Ensure charts are initialized only after data is available
      if (this.analyticsData) {
        this.initStorageChart();
        this.initBandwidthChart();
      }
      console.log(res, "check res")
    })

  }
  ngAfterViewInit() {
    // Remove chart initialization from here to prevent errors with undefined data
    // this.initStorageChart();
    // this.initBandwidthChart();
  }
  private initStorageChart() {
    const ctx = this.storageChartRef.nativeElement.getContext('2d');
    let val: any;
    console.log("this.analyticsData",this.analyticsData);
    
    if (this.analyticsData) {
      val = (((Number(this.analyticsData.used)/ 1024) / (Number(this.analyticsData.total) / 1024)) * 100).toFixed(2)
    } else {
      val = 0
    }
    console.log(val, "check val")
    const doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          // data: [6, 6],
          // data: [this.analyticsData.used, this.analyticsData.left],
          data: this.analyticsData ? [this.analyticsData.left / 1024, this.analyticsData.used / 1024] : [1, 0],
          backgroundColor: ['#E3E3FC', '#811630'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '75%',
        responsive: true,
        maintainAspectRatio: false,
        // plugins: {
        // title: {
        //   display: true,
        //   text: "Views",
        //   font: {
        //     size: 20,
        //     family: 'Arial',
        //     weight: 'bold'
        //   },
        //   color: 'black'
        // },
        // }
      },
      plugins: [{
        id: 'centerText',
        afterDatasetsDraw(chart, args, pluginOptions) {
          const { ctx } = chart
          ctx.save()
          const x = chart.getDatasetMeta(0).data[0].x
          const y = chart.getDatasetMeta(0).data[0].y
          ctx.textAlign = "center"
          ctx.textBaseline = 'middle'
          ctx.font = 'bold 22px sans-serif'
          ctx.fillStyle = "#811630"
          // ctx.fillText("50%",x,y)
          ctx.fillText(`${val}%`, x, y)
        }
      }],
    });
  }
  private initBandwidthChart() {
    // let centerText={
    //   id: 'centerText',

    // }
    const ctx = this.bandwidthChartRef.nativeElement.getContext('2d');
    let val: any;
    if (this.analyticsData.bandwidth) {
      val = (((Number(this.analyticsData.bandwidth.used)/ 1024) / (Number(this.analyticsData.bandwidth.total) / 1024)) * 100).toFixed(2)
    } else {
      val = 0
    }
    const doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data:this.analyticsData.bandwidth ? [this.analyticsData.bandwidth.left / 1024, this.analyticsData.bandwidth.used / 1024] : [1, 0],
          backgroundColor: ['#E3E3FC', '#FFAA0E'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '75%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          // title: {
          //   display: true,
          //   text: "Views",
          //   font: {
          //     size: 20,
          //     family: 'Arial',
          //     weight: 'bold'
          //   },
          //   color: 'black'
          // },
        }
      },
      plugins: [{
        id: 'centerText',
        afterDatasetsDraw(chart, args, pluginOptions) {
          const { ctx } = chart
          ctx.save()
          const x = chart.getDatasetMeta(0).data[0].x
          const y = chart.getDatasetMeta(0).data[0].y
          ctx.textAlign = "center"
          ctx.textBaseline = 'middle'
          ctx.font = 'bold 22px sans-serif'
          ctx.fillStyle = "#FFAA0E"
          ctx.fillText(`${val ||0}%`, x, y)
        }
      }],



    });
  }

  getDays(timestamp:any){
    console.log(timestamp,"check timestamp")
    let currentDate = Date.now()
    let difference = Number(timestamp) - currentDate
    let days = (difference/(86400 * 1000)).toFixed(0)
    console.log(days,"check days")

    return `${Number(days)<=0?"-":`${days} days`}`
  }

  getDate(timestamp:any){
      let date = new Date(Number(timestamp));
      console.log(date.toDateString(),"check date")
      return date.toDateString()
  }

  // Function to get the difference in hours between a timestamp and the current date
 getHoursDiff(timestamp:any) {
  let currentDate = Date.now();
  let difference = Number(timestamp) - currentDate;
  let hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return hours;
}

// Function to get the difference in minutes between a timestamp and the current date
 getMinutesDiff(timestamp:any) {
  let currentDate = Date.now();
  let difference = Number(timestamp) - currentDate;
  let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  return minutes;
}

// Function to get the difference in seconds between a timestamp and the current date
 getSecondsDiff(timestamp:any) {
  let currentDate = Date.now();
  let difference = Number(timestamp) - currentDate;
  let seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return seconds;
}

}
