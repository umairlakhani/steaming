import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilePackageComponent } from './profile-package.component';

describe('ProfilePackageComponent', () => {
  let component: ProfilePackageComponent;
  let fixture: ComponentFixture<ProfilePackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfilePackageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilePackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
