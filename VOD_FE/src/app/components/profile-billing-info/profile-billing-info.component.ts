import {Component} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {AppComponentBase} from "../../../shared/base/app-component-base";

@Component({
    selector: 'app-profile-billing-info',
    templateUrl: './profile-billing-info.component.html',
    styleUrls: ['./profile-billing-info.component.scss']
})
export class BillingInfoComponent extends AppComponentBase  {
    // Validation messages..
    validationMessages = {
        vatNum: {
            required: 'VAT number is required.',
        },
        nationalId: {
            required: 'National Id is required.',
        },
        invoicingAddress: {
            required: 'Address is required.',
        },
        city: {
            required: 'City is required.',
        },
        postalCode: {
            required: 'Postal Code is required.',
        },
        province: {
            required: 'Province is required.',
        },
        country: {
            required: 'Country is required.',
        },
        companyName: {
            required: 'Company Name is required.',
        },
    };

    // error keys..
    formErrors = {
        vatNum: '',
        nationalId: '',
        invoicingAddress: '',
        city: '',
        postalCode: '',
        province: '',
        country: '',
        companyName: '',
    };


    submittedBillForm = false;

    billingInfoForm = new FormGroup({
        vatNum: new FormControl('', [Validators.required]),
        nationalId: new FormControl('', [Validators.required]),
        invoicingAddress: new FormControl('', [Validators.required]),
        city: new FormControl('', [Validators.required]),
        postalCode: new FormControl('', [Validators.required]),
        province: new FormControl('', [Validators.required]),
        country: new FormControl('', [Validators.required]),
        companyName: new FormControl(''),
        isOpCompanyName: new FormControl('')
    });

    get fBillInfo(): { [key: string]: AbstractControl } {
        console.log('form ', this.billingInfoForm.controls)
        return this.billingInfoForm.controls;
    }

    onSubmitBillInfoForm() {
        this.submittedBillForm = true;

        console.log(this.billingInfoForm);
        if (this.billingInfoForm.valid) {
            console.log(JSON.stringify(this.billingInfoForm.value, null, 2));
        }

    }
   
}
