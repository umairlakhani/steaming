import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AppComponentBase } from 'src/shared/base/app-component-base';
import { UserService } from 'src/app/services/user.service';
import { ChannelService } from 'src/app/services/channel.service';
import { SpinnerService } from 'src/shared/services/spinner.service';
@Component({
  selector: 'app-create-channel',
  templateUrl: './create-channel.component.html',
  styleUrls: ['./create-channel.component.scss']
})
export class CreateChannelComponent extends AppComponentBase implements OnInit {
  @Input() channelData: any | undefined = undefined; // Input property to receive channel data

  @Output() channelCreated = new EventEmitter<void>();
  channelForm: FormGroup;

  imageUrl: any | undefined;
  channelFormData = new FormData();

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

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private channelService: ChannelService,
    private userService: UserService,
    private spinnerService: SpinnerService
  ) {
    super();
    this.channelForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(30)]],
      description: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    if (this.channelData) {
      this.channelForm.patchValue(this.channelData); // Populate the form with channel data
      this.imageUrl = this.channelData.profile_image;
    }
  }

  async createChannel(): Promise<void> {
    if (!this.channelForm.valid) {
      return; // Exit if the form is invalid or if already loading
    }
    this.spinnerService.setLoading(true);

    if (this.imageUrl) {
      try {
        const res = await this.channelService.imagesUpdateChannel(this.channelFormData, 0).toPromise();
        console.log(res);
        this.channelData = this.channelForm.value;
        this.channelData.profile_image = res.body.data.replace('./channelImage/', '/channelImage/');
      } catch (error) {
        this.toastr.error('Failed to update channel image');
        this.spinnerService.setLoading(false);
        return;
      }
    }

    try {
      const res = await this.channelService.createChannel(this.channelForm.value).toPromise();
      console.log(res);
      this.toastr.success(res.message);
      this.channelCreated.emit();
    } catch (error) {
      this.toastr.error('Failed to create channel');
    } finally {
      this.channelForm.reset();
      this.channelData = undefined;
      this.imageUrl = undefined;
      this.spinnerService.setLoading(false);
    }
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

  editChannel(channel: any): void {
    this.channelForm.patchValue({
      name: channel.name,
      description: channel.description,
    }); // Populate the form with channel data
    this.imageUrl = channel.imageUrl;
    this.channelData = channel;
  }

  async updateChannel(): Promise<void> {
    debugger;
    if (!this.channelForm.valid) {
      return; // Exit if the form is invalid or if already loading
    }
    this.spinnerService.setLoading(true);

    if (this.imageUrl && (this.channelData.profile_image === null || this.channelData.profile_image !== this.imageUrl)) {
      try {
        const res = await this.channelService.imagesUpdateChannel(this.channelFormData, this.channelData.id).toPromise();
        this.channelData.profile_image = res.body.data.replace('./channelImage/', '/channelImage/');
        console.log(res);
      } catch (error) {
        this.toastr.error('Failed to update channel image');
        this.spinnerService.setLoading(false);
        return;
      }
    }

    try {
      const formBody = {
        ...this.channelForm.value, 
        id: this.channelData.id,
      }
      if (this.channelData.profile_image) {
        formBody.profile_image = this.channelData.profile_image;
      }
      const res = await this.channelService.updateChannel(formBody).toPromise();
      console.log(res);
      this.toastr.success(res.message);
      this.channelCreated.emit();

    } catch (error) {
      console.error({ error });
      this.toastr.error('Failed to update channel');

    } finally {
      this.channelForm.reset();
      this.channelData = undefined;
      this.imageUrl = undefined;
      this.spinnerService.setLoading(false);
    }
  }
}
