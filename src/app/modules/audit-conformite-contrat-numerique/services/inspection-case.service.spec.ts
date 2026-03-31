import { TestBed } from '@angular/core/testing';

import { InspectionCaseService } from './inspection-case.service';

describe('InspectionCaseService', () => {
  let service: InspectionCaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InspectionCaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
