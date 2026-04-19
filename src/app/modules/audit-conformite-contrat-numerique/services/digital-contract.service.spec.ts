import { TestBed } from '@angular/core/testing';

import { DigitalContractService } from './digital-contract.service';

describe('DigitalContractService', () => {
  let service: DigitalContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DigitalContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
