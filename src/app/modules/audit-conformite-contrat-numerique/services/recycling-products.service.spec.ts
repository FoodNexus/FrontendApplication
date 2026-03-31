import { TestBed } from '@angular/core/testing';

import { RecyclingProductsService } from './recycling-products.service';

describe('RecyclingProductsService', () => {
  let service: RecyclingProductsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecyclingProductsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
