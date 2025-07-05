import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleVideoListComponent } from './schedule-video-list.component';

describe('ScheduleVideoListComponent', () => {
  let component: ScheduleVideoListComponent;
  let fixture: ComponentFixture<ScheduleVideoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScheduleVideoListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleVideoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
