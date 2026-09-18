import { TestBed } from '@angular/core/testing';

import { ECSService } from './ecs.service';

describe('ECSService', () => {
  let service: ECSService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ECSService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
