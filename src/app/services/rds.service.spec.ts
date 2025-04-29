import { TestBed } from '@angular/core/testing';

import { RdsService } from './rds.service';

describe('RdsService', () => {
  let service: RdsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RdsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
