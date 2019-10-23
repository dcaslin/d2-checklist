import { TestBed } from '@angular/core/testing';

import { PreferredStatService } from './preferred-stat.service';

describe('PreferredStatService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PreferredStatService = TestBed.get(PreferredStatService);
    expect(service).toBeTruthy();
  });
});
