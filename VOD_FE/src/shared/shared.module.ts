import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SpinnerComponent} from "./components/spinner/spinner.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { BootstrapIconsModule } from 'ng-bootstrap-icons';
import { allIcons } from 'ng-bootstrap-icons/icons';


@NgModule({
    declarations: [
        SpinnerComponent
    ],
    exports: [
        SpinnerComponent,
        BootstrapIconsModule
    ],
    imports: [
        CommonModule,
        BootstrapIconsModule.pick(allIcons)
    ]
})
export class SharedModule {
}
