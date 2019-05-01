import { TestBed } from '@angular/core/testing';

import { TargetPerkService } from './target-perk.service';

describe('TargetPerkService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TargetPerkService = TestBed.get(TargetPerkService);
    expect(service).toBeTruthy();
  });
});
