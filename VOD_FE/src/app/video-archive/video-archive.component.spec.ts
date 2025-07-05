import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoArchiveComponent } from './video-archive.component';

describe('VideoArchiveComponent', () => {
  let component: VideoArchiveComponent;
  let fixture: ComponentFixture<VideoArchiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoArchiveComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoArchiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
