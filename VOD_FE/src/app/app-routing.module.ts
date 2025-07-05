import { SchedulesComponent } from './components/schedules/schedules.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmailconfirmComponent } from './emailconfirm/emailconfirm.component';
import { GuardGuard } from './guard.guard';
import { ProfileComponent } from './profile/profile.component';
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';
import { VideoArchiveComponent } from './video-archive/video-archive.component';
import { VideoPublishedComponent } from './video-published/video-published.component';
import { NewScheduleComponent } from './components/new-schedule/new-schedule.component';
import { StatisticsComponent } from "./components/statistics/statistics.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { UploadAdsComponent } from './upload-ads/upload-ads.component';
import { AdListComponent } from './ad-list/ad-list.component';
import { LiveStreamingComponent } from './live-streaming/live-streaming.component';
import { VideoComponent } from './video/video.component';
import { UserPublicVideosComponent } from './user-public-videos/user-public-videos.component';
import { LiveChatComponent } from './live-chat/live-chat.component'
import { RoomComponent } from './room/room.component'
import { LiveViewComponent } from './live-view/live-view.component';
import { HomeComponent } from './landing-pages/home/home.component';
import { LayoutComponent } from './layout/layout.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { BroadcasterComponent } from './broadcaster/broadcaster.component';
import { ViewerComponent } from './viewer/viewer.component';
import { SubscriptionPlansComponent } from './subscription-plans/subscription-plans.component';
import { ScheduleDateComponent } from './schedule-date/schedule-date.component';
import { StreamingComponent } from './streaming/streaming.component';
import { StripeFormComponent } from './stripe-form/stripe-form.component';
import { ZoneComponent } from './zone/zone.component';
export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: HomeComponent,
        // data: {title: 'Sign-In', hideNav: true}
    },
    {
        path: 'signin',
        component: SigninComponent,
        data: { title: 'Sign-In' }
    },
    {
        path: 'signup',
        component: SignupComponent,
        data: { title: 'Sign-Up', hideNav: true }
    },
    {
        path: 'email',
        component: EmailconfirmComponent,
        data: { title: 'EmailConfirmation', hideNav: true }
    },
    {
        path: 'forgot-pass',
        component: ForgotPasswordComponent,
        data: { title: 'Forgot Password', hideNav: true }
    },
    {
        path: 'reset-pass',
        component: ResetPasswordComponent,
        data: { title: 'Reset Password', hideNav: true }
    },
    {
        path: 'subscription-plans',
        component: SubscriptionPlansComponent,
        data: { title: 'Subscription Plans', hideNav: true }
    },
    {
        path: 'edit-subscription-plans/:id',
        component: SubscriptionPlansComponent,
        data: { title: 'Subscription Plans', hideNav: true }
    },
    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: 'dashboard',
                component: DashboardComponent,
                data: { title: 'Dashboard' },
                canActivate: [GuardGuard]
            },
            {
                path: 'profile',
                component: ProfileComponent,
                data: { title: 'Profile' },
                canActivate: [GuardGuard]


            },



            {
                path: 'videos',
                component: VideoComponent,
                data: { title: 'Public Videos' },
                canActivate: [GuardGuard]
            },
            {
                path: 'videos/:id',
                component: VideoComponent,
                data: { title: 'OnAir Videos' },
                canActivate: [GuardGuard]
            },
            {
                path: 'videos/live/:id',
                component: VideoComponent,
                data: { title: 'OnAir Videos' },
                canActivate: [GuardGuard]
            },
            {
                path: 'videos/public/:id',
                component: VideoComponent,
                data: { title: 'OnAir Videos' },
                canActivate: [GuardGuard]
            },
            {
                path: 'live-chat',
                component: LiveChatComponent,
                data: { title: 'Go Live' },
                canActivate: [GuardGuard]
            },
            {
                path: 'live-view',
                component: LiveViewComponent,
                data: { title: 'View Streaming' },
                canActivate: [GuardGuard]
            },
            {
                path: 'live-view/:id',
                component: LiveViewComponent
            },
            {
                path: 'broadcast',
                component: BroadcasterComponent,
                data: { title: 'Go Live' },
                canActivate: [GuardGuard]
            },
            {
                path: 'viewer/:id',
                component: ViewerComponent,
                data: { title: 'View Streaming' },
                canActivate: [GuardGuard]
            },
            {
                path: 'room/:id',
                component: RoomComponent,
                data: { title: 'OnAir Videos' },
                canActivate: [GuardGuard]
            },
            {
                path: 'archive',
                component: VideoArchiveComponent,
                data: { title: 'Archive' },
                canActivate: [GuardGuard]


            },
            {
                path: 'schedules',
                component: NewScheduleComponent,
                data: { title: 'Schedules' },
                canActivate: [GuardGuard]


            },
            {
                path: 'schedule-date',
                component: ScheduleDateComponent,
                data: { title: 'Schedule Date' },
                canActivate: [GuardGuard]
            },
            {
                path: 'new-schedule/:id',
                component: SchedulesComponent,
                data: { title: 'Update Schedule' },
                canActivate: [GuardGuard]
            },

            {
                path: 'new-schedule',
                component: SchedulesComponent,
                data: { title: 'New Schedule' },
                canActivate: [GuardGuard]


            },

            {
                path: 'statistics',
                component: StatisticsComponent,
                data: { title: 'Statistics' },
                canActivate: [GuardGuard]


            },
            {
                path: 'published',
                component: VideoPublishedComponent,
                data: { title: 'Published' },
                canActivate: [GuardGuard]
            },
            {
                path: 'public/:id',
                component: UserPublicVideosComponent,
                data: { title: 'User Public Videos' },
                // canActivate: [GuardGuard]
            },
            {
                path: 'live-streaming',
                component: LiveStreamingComponent,
                data: { title: 'Live Streaming' },
                canActivate: [GuardGuard]
            },
            {
                path: 'streaming',
                component: StreamingComponent,
                data: { title: 'Streaming' },
                canActivate: [GuardGuard]
            },
            {
                path: 'upload-ads',
                component: UploadAdsComponent,
                data: { title: 'Upload Ads' },
                canActivate: [GuardGuard]
            },
            {
                path: 'ads-list',
                component: AdListComponent,
                data: { title: 'Your Ads' },
                canActivate: [GuardGuard]
            },
            {
                path: 'stripe-checkout',
                component: StripeFormComponent,
                data: { title: 'Payment' },
                canActivate: [GuardGuard]
            },
            {
                path: 'stripe-checkout/:id',
                component: StripeFormComponent,
                data: { title: 'Payment' },
                canActivate: [GuardGuard]
            },
            {
                path: 'zone',
                component: ZoneComponent,
                data: { title: 'Zones' },
                canActivate: [GuardGuard]
            },
            {
                path: '**',
                redirectTo: 'profile'
            }
        ]
        // data: {title: 'Dashboard'},
    },


];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
