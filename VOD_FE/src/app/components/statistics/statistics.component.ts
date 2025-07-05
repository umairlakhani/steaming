import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
  OnChanges,
} from "@angular/core";
import { Chart, Plugin } from "chart.js/auto";
import { DashboardService } from "src/app/services/dashboard.service";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "app-statistics",
  templateUrl: "./statistics.component.html",
  styleUrls: ["./statistics.component.scss"],
})
export class StatisticsComponent implements AfterViewInit, OnInit, OnChanges {
  // dropdownOptions = [
  //   'Total',
  //   'Option 2',
  //   'Option 3'
  // ];
  // selectedOption = ['Total']; // In case if decide to use ng-select can use these arrays
  usedStorage = 2.52; // change this value to the actual used storage
  totalStorage = 5.04; // change this value to the total available storage

  bandwidth = 29.04;
  totalBandwidth = 93.55;
  dailyViews = {};
  dailyBandwidth = {};
  countryRatioData = {};
  dailyPlayTime = {};
  dailyAvgPlayTime = {};
  combinedData = [];

  @ViewChild("views") viewsChartRef!: ElementRef;
  viewChart!: Chart;

  @ViewChild("totalTime") totalTimeChartRef!: ElementRef;
  totalTime!: Chart;

  @ViewChild("averageTime") averageTimeChartRef!: ElementRef;
  averageTime!: Chart;

  @ViewChild("bandConsumed") bandConsumedChartRef!: ElementRef;
  bandConsumed!: Chart;

  @ViewChild("doughnutChart") doughnutChartRef!: ElementRef;
  doughnutChart!: any;

  @ViewChild("totalTimeCircleChart") doughnutTolTimeChartRef!: ElementRef;
  doughnutTimeChart!: any;

  @ViewChild("averageTimeDoughnut") doughnutAverageTimeChartRef!: ElementRef;
  doughnutAvgTimeChart!: any;

  @ViewChild("bandConsumedDoughnut") doughnutBandConsumedChartRef!: ElementRef;
  bandConsumedDoughnut!: any;
  fromDate!: string;
  selectedFilter: string = "dateRange";
  toDate!: string;
  appliedFilter!: string;
  userData: any = this.userService.getTokenData();
  analyticsData: any;
  constructor(
    private dashboardService: DashboardService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    console.log("oninit start");
    // Set toDate to the current date
    const currentDate = new Date();
    this.toDate = this.formatDate(currentDate);

    // Set fromDate to the last month's date
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    this.fromDate = this.formatDate(lastMonthDate);
    this.applyFilter();
    this.dashboardService.getData(this.userData.bucketId).subscribe((res) => {
      console.log((res as any).data, "(res as any).data");
      this.totalStorage = Number((res as any).data.total) / 1024;
      this.usedStorage = Number((res as any).data.used) / 1024;
      this.bandwidth = Number((res as any).data.bandwidth.used) / 1024 || 0;
      this.totalBandwidth =
        Number((res as any).data.bandwidth.total) / 1024 || 0;
      this.analyticsData = (res as any).data;
    });
  }
  ngOnChanges(): void {
    // this.dashboardService.getData(this.userData.bucketId).subscribe((res)=>{
    //   console.log((res as any).data,"(res as any).data")
    //   this.totalStorage = Number((res as any).data.total)/1024
    //   this.usedStorage = (res as any).data.used
    //   this.analyticsData = (res as any).data
    // })
  }

  ngAfterViewInit() {}

  storagePercentage() {
    return Math.round((this.usedStorage / this.totalStorage) * 100);
  }
  applyFilter(): void {
    const today = new Date();
    switch (this.selectedFilter) {
      case "today":
        // Set fromDate and toDate to today
        this.fromDate = this.toDate = this.formatDate(new Date());
        break;
      case "yesterday":
        // Set fromDate and toDate to yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        this.fromDate = this.toDate = this.formatDate(yesterday);
        break;
      case "week":
        // Set fromDate to the start of the week and toDate to today
        const startOfWeek = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - today.getDay()
        );
        this.fromDate = this.formatDate(startOfWeek);
        this.toDate = this.formatDate(today);
        break;
      case "month":
        // Set fromDate to the start of the month and toDate to today
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        this.fromDate = this.formatDate(startOfMonth);
        this.toDate = this.formatDate(today);
        break;
      default:
        // Default to date range
        break;
    }
    if (!this.fromDate || !this.toDate) {
      console.log("Please select both From and To dates.");
      return;
    }
    const fromISODate = this.formatFromISODate(this.fromDate);
    const toISODate = this.formatToISODate(this.toDate);
    const timeCheck = `${this.formatDateTime(
      fromISODate
    )} - ${this.formatDateTime(toISODate)}`;

    this.appliedFilter = timeCheck;

    this.dashboardService
      .getAnalyticData(fromISODate, toISODate)
      .subscribe((res: any) => {
        console.log(res, "data");

        const {
          dailyViews,
          dailyBandwidth,
          percentages,
          dailyPlayTime,
          dailyAvgPlayTime,
          combinedData,
        } = res.videoAnalytics;
        this.dailyViews = dailyViews;
        this.dailyBandwidth = dailyBandwidth;
        this.countryRatioData = percentages;
        this.dailyPlayTime = dailyPlayTime;
        this.dailyAvgPlayTime = dailyAvgPlayTime;
        this.combinedData = combinedData;
        // Initialize charts
        this.initCharts();
      });
  }

  initCharts() {
    this.initViewsChart();
    this.initBandConsumedChart();
    this.initTotalTimeChart();
    this.initAverageTimeChart();
    this.initDoughnutChart();
    this.initDoughnutBandConsume();
    this.initDoughnutAverageTime();
    this.initDoughnutTolTimeChart();
  }

  getDate(timestamp: any) {
    let date = new Date(Number(timestamp));
    console.log(date.toDateString(), "check date");
    return date.toDateString();
  }

  storagePercentage2() {
    return Math.round((this.bandwidth / this.totalBandwidth) * 100);
  }

  // Helper function to format date as yyyy-MM-dd
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  // Helper function to format date in international ISO format
  formatFromISODate(date: any) {
    const localFirstTime = new Date(date).setHours(0, 0, 0, 0);
    const standardISO = new Date(localFirstTime).toISOString();
    return standardISO;
  }
  formatToISODate(date: any) {
    const localFirstTime = new Date(date).setHours(23, 59, 59, 999);
    const standardISO = new Date(localFirstTime).toISOString();
    return standardISO;
  }

  formatDateTime = (isoDate: any) => {
    const date = new Date(isoDate);
    const dateString = date.toDateString();
    const timeString = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateString} ${timeString}`;
  };

  private initViewsChart() {
    if (this.viewChart) {
      this.viewChart.clear();
      this.viewChart.destroy();
    }
    const ctx = this.viewsChartRef.nativeElement.getContext("2d");
    this.viewChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(this.dailyViews),
        datasets: [
          {
            label: "",
            data: Object.values(this.dailyViews),
            borderColor: "#811630",
            backgroundColor: "#E9EEFF",
            borderWidth: 2,
            fill: true,
            cubicInterpolationMode: "monotone",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Views",
            font: {
              size: 18,
              family: "Arial",
              weight: "700",
            },
            color: "black",
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            title: {
              display: false,
              text: "Horizontal Axis",
            },
          },
          y: {
            grid: {
              display: false,
            },
            title: {
              display: false,
              text: "Views",
            },
            ticks: {
              stepSize: 40,
            },
          },
        },
      },
    });
  }

  private initTotalTimeChart() {
    const ctx = this.totalTimeChartRef.nativeElement.getContext("2d");
    if (this.totalTime) {
      this.totalTime.clear();
      this.totalTime.destroy();
    }
    this.totalTime = new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(this.dailyPlayTime),
        datasets: [
          {
            label: "",
            data: Object.values(this.dailyPlayTime),
            borderColor: "#77BF70",
            backgroundColor: "#DFF0DD",
            borderWidth: 2,
            fill: true,
            cubicInterpolationMode: "monotone",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Total Time",
            font: {
              size: 18,
              family: "Arial",
              weight: "700",
            },
            color: "black",
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            title: {
              display: false,
              text: "Horizontal Axis",
            },
          },
          y: {
            grid: {
              display: false,
            },
            title: {
              display: false,
              text: "Total Time",
            },
          },
        },
      },
    });
  }

  private initAverageTimeChart() {
    if (this.averageTime) {
      this.averageTime.clear();
      this.averageTime.destroy();
    }
    const ctx = this.averageTimeChartRef.nativeElement.getContext("2d");

    this.averageTime = new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(this.dailyAvgPlayTime),
        datasets: [
          {
            label: "",
            data: Object.values(this.dailyAvgPlayTime),
            borderColor: "#FFAA0E",
            backgroundColor: "#FFEECF",
            borderWidth: 2,
            fill: true,
            cubicInterpolationMode: "monotone",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Average Time",
            font: {
              size: 18,
              family: "Arial",
              weight: "700",
            },
            color: "black",
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            title: {
              display: false,
              text: "Horizontal Axis",
            },
          },
          y: {
            grid: {
              display: false,
            },
            title: {
              display: false,
              text: "Average Time",
            },
            ticks: {
              stepSize: 200,
            },
          },
        },
      },
    });
  }

  private initBandConsumedChart() {
    if (this.bandConsumed) {
      this.bandConsumed.clear();
      this.bandConsumed.destroy();
    }
    const ctx = this.bandConsumedChartRef.nativeElement.getContext("2d");
    this.bandConsumed = new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(this.dailyBandwidth),
        datasets: [
          {
            label: "",
            data: Object.values(this.dailyBandwidth),
            borderColor: "#66E1B5",
            backgroundColor: "#DEF7EE",
            borderWidth: 2,
            fill: true,
            cubicInterpolationMode: "monotone",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Band Consumed",
            font: {
              size: 18,
              family: "Arial",
              weight: "700",
            },
            color: "black",
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            title: {
              display: false,
              text: "Horizontal Axis",
            },
          },
          y: {
            grid: {
              display: false,
            },
            title: {
              display: false,
              text: "Band Consumed",
            },
            ticks: {
              stepSize: 3,
            },
          },
        },
      },
    });
  }
  private initDoughnutChart() {
    if (this.doughnutChart) {
      this.doughnutChart.clear();
      this.doughnutChart.destroy();
    }
    const labels = Object.keys(this.countryRatioData);
    const data = Object.values(this.countryRatioData);
    const ctx = this.doughnutChartRef.nativeElement.getContext("2d");
    this.doughnutChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: data,
            backgroundColor: ["#E3E3FC", "blue"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: "80%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Views",
            font: {
              size: 20,
              family: "Arial",
              weight: "bold",
            },
            color: "black",
          },
        },
      },
      plugins: [
        {
          id: "centerText",
          afterDatasetsDraw(chart, args, pluginOptions) {
            const { ctx } = chart;
            ctx.save();
            // console.log(chart.getDatasetMeta(0).data[0].x,"asdf")
            const x = chart.getDatasetMeta(0)?.data[0]?.x;
            const y = chart.getDatasetMeta(0)?.data[0]?.y;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 22px sans-serif";
            ctx.fillStyle = "#4380FA";
          },
        },
      ],
    });
  }

  private initDoughnutTolTimeChart() {
    if (this.doughnutTimeChart) {
      this.doughnutTimeChart.clear();
      this.doughnutTimeChart.destroy();
    }
    const labels = Object.keys(this.countryRatioData);
    const data = Object.values(this.countryRatioData);
    const ctx = this.doughnutTolTimeChartRef.nativeElement.getContext("2d");
    this.doughnutTimeChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: data,
            backgroundColor: ["#EFF6EE", "#77BF70"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: "80%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Total Time",
            font: {
              size: 20,
              family: "Arial",
              weight: "bold",
            },
            color: "black",
          },
        },
      },
      plugins: [
        {
          id: "centerText",
          afterDatasetsDraw(chart, args, pluginOptions) {
            const { ctx } = chart;
            ctx.save();
            // console.log(chart.getDatasetMeta(0).data[0].x,"asdf")
            const x = chart.getDatasetMeta(0)?.data[0]?.x;
            const y = chart.getDatasetMeta(0)?.data[0]?.y;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 22px sans-serif";
            ctx.fillStyle = "#77BF70";
          },
        },
      ],
    });
  }
  private initDoughnutAverageTime() {
    if (this.doughnutAvgTimeChart) {
      this.doughnutAvgTimeChart.clear();
      this.doughnutAvgTimeChart.destroy();
    }
    const labels = Object.keys(this.countryRatioData);
    const data = Object.values(this.countryRatioData);
    const ctx = this.doughnutAverageTimeChartRef.nativeElement.getContext("2d");
    this.doughnutAvgTimeChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: data,
            backgroundColor: ["#FCF4E4", "#FFAA0E"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: "80%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Average Time",
            font: {
              size: 20,
              family: "Arial",
              weight: "bold",
            },
            color: "black",
          },
        },
      },
      plugins: [
        {
          id: "centerText",
          afterDatasetsDraw(chart, args, pluginOptions) {
            const { ctx } = chart;
            ctx.save();
            // console.log(chart.getDatasetMeta(0).data[0].x,"asdf")
            const x = chart.getDatasetMeta(0)?.data[0]?.x;
            const y = chart.getDatasetMeta(0)?.data[0]?.y;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 22px sans-serif";
            ctx.fillStyle = "#FFAA0E";
          },
        },
      ],
    });
  }
  private initDoughnutBandConsume() {
    if (this.bandConsumedDoughnut) {
      this.bandConsumedDoughnut.clear();
      this.bandConsumedDoughnut.destroy();
    }
    const ctx =
      this.doughnutBandConsumedChartRef.nativeElement.getContext("2d");
    this.bandConsumedDoughnut = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(this.countryRatioData),
        datasets: [
          {
            data: Object.values(this.countryRatioData),
            backgroundColor: ["#EDF9F5", "#66E1B5"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: "80%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Band Consume",
            font: {
              size: 20,
              family: "Arial",
              weight: "bold",
            },
            color: "black",
          },
        },
      },
      plugins: [
        {
          id: "centerText",
          afterDatasetsDraw(chart, args, pluginOptions) {
            const { ctx } = chart;
            ctx.save();
            // console.log(chart.getDatasetMeta(0).data[0].x,"asdf")
            const x = chart.getDatasetMeta(0)?.data[0]?.x;
            const y = chart.getDatasetMeta(0)?.data[0]?.y;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 22px sans-serif";
            ctx.fillStyle = "#66E1B5";
          },
        },
      ],
    });
  }
}
