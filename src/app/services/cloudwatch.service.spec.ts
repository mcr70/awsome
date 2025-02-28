import { TestBed } from '@angular/core/testing';

import { CloudWatchService } from './cloudwatch.service';

describe('CloudWatchService', () => {
  let service: CloudWatchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CloudWatchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
