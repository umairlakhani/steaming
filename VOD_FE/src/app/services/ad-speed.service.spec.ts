import { TestBed } from '@angular/core/testing';

import { AdSpeedService } from './ad-speed.service';

describe('AdSpeedService', () => {
  let service: AdSpeedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdSpeedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
