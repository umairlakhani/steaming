import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadAdsComponent } from './upload-ads.component';

describe('UploadAdsComponent', () => {
  let component: UploadAdsComponent;
  let fixture: ComponentFixture<UploadAdsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UploadAdsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadAdsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
