import { TestBed } from '@angular/core/testing';

import { CodecommitService } from './codecommit.service';

describe('CodecommitService', () => {
  let service: CodecommitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodecommitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
