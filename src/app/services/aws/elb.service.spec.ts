import { TestBed } from '@angular/core/testing';

import { ElbService } from './elb.service';

describe('ElbService', () => {
  let service: ElbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ElbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
