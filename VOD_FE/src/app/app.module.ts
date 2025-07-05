import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule, routes } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { SidenavComponent } from "./sidenav/sidenav.component";
import { NavbarComponent } from "./navbar/navbar.component";
import { SigninComponent } from "./signin/signin.component";
import { SignupComponent } from "./signup/signup.component";
import { EmailconfirmComponent } from "./emailconfirm/emailconfirm.component";
import { ProfileComponent } from "./profile/profile.component";
import {
    DeleteConfirmationComponent,
    VideoArchiveComponent,
    VideoUploadComponent,
    VideoinfoComponent,
} from "./video-archive/video-archive.component";
import {
    ScheduleVideoComponent,
    VideoJSONComponent,
    VideoPublishedComponent
} from './video-published/video-published.component';
import { AutomaticFillComponent, SchedulesComponent, SelectVideosComponent } from './components/schedules/schedules.component';
import { FullCalendarModule } from '@fullcalendar/angular';

import {
    BrowserAnimationsModule,
    NoopAnimationsModule,
} from "@angular/platform-browser/animations";

import { MatSidenavModule } from "@angular/material/sidenav";
import { MatIconModule } from "@angular/material/icon";
import { MatDialogModule } from "@angular/material/dialog";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatSelectModule } from "@angular/material/select";

import { AuthInterceptor } from "./interceptors/apiInterceptor.interceptor";
import {
    NgbModule,
    NgbNavModule,
    NgbPaginationModule,
} from "@ng-bootstrap/ng-bootstrap";
import { MatButtonModule } from "@angular/material/button";

// import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ProfilePackageComponent, VideoDeleteComponent } from "./components/profile-package/profile-package.component";
import { BillingInfoComponent } from "./components/profile-billing-info/profile-billing-info.component";
import { BootstrapIconsModule } from "ng-bootstrap-icons";
import { allIcons } from "ng-bootstrap-icons/icons";
import { SettingsComponent } from "./components/profile-settings/profile-settings.component";
import { InfiniteScrollModule } from "ngx-infinite-scroll";
// import { SwiperModule } from 'ngx-swiper-wrapper';
import { SwiperModule } from 'swiper/angular';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ScheduleCalendarComponent } from './components/schedule-calendar/schedule-calendar.component';
import { NewScheduleComponent, ScheduleDialog, ScheduleModal } from './components/new-schedule/new-schedule.component';
import { Archive2Component } from './components/archive2/archive2.component';
import { NgxPaginationModule } from "ngx-pagination";
import { StatisticsComponent } from './components/statistics/statistics.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from "../shared/shared.module";
import { ToastrModule } from "ngx-toastr";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { RouterModule, Routes } from '@angular/router';
import { UploadAdsComponent } from './upload-ads/upload-ads.component';
import { AdListComponent, AdVideoModalComponent, EditModal } from './ad-list/ad-list.component';
import { LiveStreamingComponent, StreamingVideoModalComponent, liveStreamKeyModalComponent } from './live-streaming/live-streaming.component';
import { VideoComponent } from './video/video.component';
import { UserPublicVideosComponent } from './user-public-videos/user-public-videos.component';
import { LiveChatComponent } from './live-chat/live-chat.component';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { RoomComponent } from './room/room.component';
import { LiveViewComponent } from './live-view/live-view.component'
import { environment } from 'src/environments/environment';
import { HomeComponent } from './landing-pages/home/home.component';
import { NgChartsModule } from "ng2-charts"
import { LayoutComponent } from './layout/layout.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { BroadcasterComponent, UserLiveVideoInfoComponent } from './broadcaster/broadcaster.component';
import { ViewerComponent } from './viewer/viewer.component';
import { SubscriptionPlansComponent } from './subscription-plans/subscription-plans.component';
import { DragNDropComponent } from './components/drag-n-drop/drag-n-drop.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FullCalendarComponent } from './components/full-calendar/full-calendar.component';
import { ScheduleDateComponent } from './schedule-date/schedule-date.component';
import { StreamingComponent } from './streaming/streaming.component';
import { StripeFormComponent } from './stripe-form/stripe-form.component';
import { NgxStripeModule } from 'ngx-stripe';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from "@angular/material/form-field";
import { SubscriptionsComponent } from './components/subscriptions/subscriptions.component';
import { ZoneComponent } from './zone/zone.component';
import { CreateChannelComponent } from './channel/create-channel/create-channel.component';
import { ChannelListComponent } from "./channel/channel-list/channel-list.component";
import { ConfirmDialogComponent } from "./channel/confirm-dialog/confirm-dialog.component";
import { MatTableModule } from "@angular/material/table";
// import { MatFormFieldControl, MatFormFieldModule } from "@angular/material/form-field";
// const config: SocketIoConfig = { url: 'https://dev.mediapilot.io/api', options: {
// const config: SocketIoConfig = {
//   url:
//     // 'http://18.218.47.23:3000/api'
//     // 'https://dev.mediapilot.io/api'
//     // 'http://localhost:3000/'
//     "https://192.168.18.12:3000/",

//   options: {},
// };
@NgModule({
    declarations: [
        AppComponent,
        SidenavComponent,
        NavbarComponent,
        SigninComponent,
        SignupComponent,
        liveStreamKeyModalComponent,
        EmailconfirmComponent,
        ProfileComponent,
        VideoArchiveComponent,
        VideoPublishedComponent,
        VideoUploadComponent,
        VideoDeleteComponent,
        ScheduleDialog,
        VideoinfoComponent,
        SchedulesComponent,
        ProfilePackageComponent,
        BillingInfoComponent,
        SettingsComponent,
        ScheduleCalendarComponent,
        NewScheduleComponent,
        Archive2Component,
        StatisticsComponent,
        DeleteConfirmationComponent,
        VideoJSONComponent,
        ScheduleVideoComponent,
        DashboardComponent,
        UploadAdsComponent,
        AdListComponent,
        EditModal,
        AdVideoModalComponent,
        LiveStreamingComponent,
        VideoComponent,
        UserPublicVideosComponent,
        StreamingVideoModalComponent,
        LiveChatComponent,
        RoomComponent,
        LiveViewComponent,
        HomeComponent,
        LayoutComponent,
        ForgotPasswordComponent,
        ResetPasswordComponent,
        BroadcasterComponent,
        ViewerComponent,
        SubscriptionPlansComponent,
        ScheduleModal,
        DragNDropComponent,
        FullCalendarComponent,
        ScheduleDateComponent,
        AutomaticFillComponent,
        SelectVideosComponent,
        StreamingComponent,
        UserLiveVideoInfoComponent,
        StripeFormComponent,
        SubscriptionsComponent,
        ZoneComponent,
        CreateChannelComponent,
        ChannelListComponent,
        ConfirmDialogComponent,
    ],
    imports: [
        BrowserModule,
        // BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        ReactiveFormsModule,
        AppRoutingModule,
        HttpClientModule,
        NoopAnimationsModule,
        ToastrModule.forRoot({
            autoDismiss: true,
            positionClass: 'toast-bottom-right',
            // disableTimeOut: true
        }),
        MatSidenavModule,
        MatIconModule,
        MatDialogModule,
        MatDatepickerModule, 
        MatMomentDateModule, 
        MatNativeDateModule, 
        MatSelectModule,
        NgbModule, 
        NgbNavModule, 
        NgbPaginationModule,
        // BootstrapIconsModule.pick(allIcons),
        InfiniteScrollModule,
        SwiperModule,
        NgxPaginationModule,
        NgbModule,
        NgSelectModule,
        MatButtonModule,
        MatTooltipModule,
        SharedModule,
        NgChartsModule,
        // SocketIoModule.forRoot(config),
        // NgbCalendar,
        DragDropModule,
        FullCalendarModule,
        // NgxStripeModule.forRoot("pk_test_51MwLiGB0E4tp8G4DraXo5iCuLRdE02cVhHBSXYektpFxbZOy9E6QUIQ1tsscMs4BRe6QjRe4nAtycewNTnpBu2lE00gajVztC5"),
        NgxStripeModule.forRoot(environment.stripePublishableKey),
        MatFormFieldModule,
        MatInputModule,
        MatTableModule

    ],
    exports: [
        // BootstrapIconsModule
    ],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true,
        }
    ],
})
export class AppModule { }
