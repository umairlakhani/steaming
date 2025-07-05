import {HttpClient} from '@angular/common/http';
import {Component} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {UserData} from 'src/app/guard.guard';
import {ChannelService} from 'src/app/services/channel.service';
import {UserService} from 'src/app/services/user.service';
import {AppComponentBase} from "../../../shared/base/app-component-base";

@Component({
    selector: 'app-profile--settings',
    templateUrl: './profile-settings.component.html',
    styleUrls: ['./profile-settings.component.scss']
})
export class SettingsComponent extends AppComponentBase {

    // Validation messages..
    validationMessages = {
        name: {
            required: 'Channel Name is required.',
            minlength: 'Min 1 character',
            maxlength: 'Max 30 characters'
        },
        description: {
            required: 'Channel Description is required.',
            minlength: 'Min 1 character',
            maxlength: 'Max 500 characters'
        },
    };

    // error keys..
    formErrors = {
        name: '',
        description: '',
    };


    userData: any = UserData;
    channelData: any | undefined;
    newEmail: string | undefined;
    imageUrl: any | undefined;
    userProfile:any='';
    channelFormData = new FormData();
    userFormData = new FormData();

    // channelForm = new FormGroup({
    //     name: new FormControl('',
    //         [Validators.required, Validators.minLength(1), Validators.maxLength(30)]),
    //     description: new FormControl('',
    //         [Validators.required, Validators.minLength(1), Validators.maxLength(500)])
    // });

    constructor(
        private http: HttpClient,
        private userService: UserService,
        private channelService: ChannelService,
        private router: Router
    ) {
        super();
    }

    ngOnInit(): void {
        console.log(this.userProfile,"userProfile")
        // this.userProfile = '../../assets/icons/user-profile.svg'
        this.channelService.getChannel().subscribe((result: any) => {
            console.log({result})
            if (result.data.results.length !== 0) {
                this.channelData = result.data.results;
                // this.channelForm.controls.name.setValue(result.data.results[0].name);
                // this.channelForm.controls.description.setValue(result.data.results[0].description);
            }
        });
    }

    emailUpdate() {
        if (!this.newEmail)
            return;

        this.userService.updateEmail({email: this.newEmail}).subscribe({
            next: res => {

            },
            error: err => {
                console.log(err);
            }
        });
    }

    // createChannel() {
    //     debugger;
    //     if (!this.channelForm.valid)
    //         return;

    //     if (this.imageUrl && this.channelData.length > 0) {
    //         this.channelService.imagesUpdateChannel(this.channelFormData, this.channelData[0].id).subscribe(res => {
    //             this.channelData = this.channelForm.value;
    //         });
    //     }

    //     if (!Array.isArray(this.channelData) || this.channelData.length === 0) {
    //         this.channelService.createChannel(this.channelForm.value).subscribe(res => {
    //             this.channelData = this.channelForm.value;
    //         });
    //     } else {
    //         let payload: any = this.channelForm.value;
    //         payload.id = this.channelData[0].id;
    //         this.channelService.updateChannel(payload).subscribe(res => {
    //             this.channelData = this.channelForm.value;
    //         });
    //     }
    // }

    signOut() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('userId');
        this.router.navigateByUrl('/signin');
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];

        if (file) {
            this.channelFormData = new FormData();
            this.channelFormData.append('image', file, file.name);
            // this.imageUrl = URL.createObjectURL(file);
            const reader = new FileReader();
            reader.onload = () => {
                this.imageUrl = reader.result;
            };
            reader.readAsDataURL(file);
        }
    }

    onProfileImageSelected(event: any): void {
        const file: File = event.target.files[0];

        if (file) {
            console.log(file,"check file")
            this.userFormData = new FormData();
            this.userFormData.append('image', file, file.name);
            // this.imageUrl = URL.createObjectURL(file);
            const reader = new FileReader();
            reader.onload = () => {
                this.userProfile = reader.result;
            };
            reader.readAsDataURL(file);
        }
    }

    profileImageUpload(): void {
        this.userService.imagesUpdate(this.userFormData).subscribe({
            next: res => {
                console.log('testestet');

                window.location.reload();
            },
            error: err => {
                console.log(err);
            }
        });
    }
}
