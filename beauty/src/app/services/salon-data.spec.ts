import { TestBed } from '@angular/core/testing';

import { SalonData } from './salon-data';

describe('SalonData', () => {
  let service: SalonData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalonData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
