import { TestBed } from '@angular/core/testing';

import { MatchFractionneService } from './match-fractionne.service';

describe('MatchFractionneService', () => {
  let service: MatchFractionneService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatchFractionneService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
