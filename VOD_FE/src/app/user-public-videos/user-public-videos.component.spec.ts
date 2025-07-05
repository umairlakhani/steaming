import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateVideosComponent } from './user-public-videos.component';

describe('PrivateVideosComponent', () => {
  let component: PrivateVideosComponent;
  let fixture: ComponentFixture<PrivateVideosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrivateVideosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivateVideosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
