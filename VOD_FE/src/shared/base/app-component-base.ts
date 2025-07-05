import {FormGroup} from "@angular/forms";

export abstract class AppComponentBase {
    // For checking validation message
    logValidationErrors(formGroup: FormGroup, formErrors: any, validationMessages?: any): void {
        Object.keys(formGroup.controls).forEach((Key: string) => {
            const abstractControl = formGroup.get(Key);
            formErrors[Key] = '';
            if (abstractControl && !abstractControl.valid &&
                (abstractControl.touched || abstractControl.dirty || abstractControl.value !== '' || abstractControl.untouched)) {
                const messages = validationMessages[Key];
                for (const errorKey in abstractControl.errors) {
                    if (errorKey) {
                        formErrors[Key] += messages[errorKey] + ' ';
                    }
                }
            }
            if (abstractControl instanceof FormGroup) {
                this.logValidationErrors(abstractControl, formErrors);
            }
        });
    }
}
