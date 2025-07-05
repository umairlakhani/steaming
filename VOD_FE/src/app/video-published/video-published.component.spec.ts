import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoPublishedComponent } from './video-published.component';

describe('VideoPublishedComponent', () => {
  let component: VideoPublishedComponent;
  let fixture: ComponentFixture<VideoPublishedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoPublishedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoPublishedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
