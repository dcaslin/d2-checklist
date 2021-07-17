import { TestBed } from '@angular/core/testing';

import { PgcrService } from './pgcr.service';

describe('PgcrService', () => {
  let service: PgcrService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PgcrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
