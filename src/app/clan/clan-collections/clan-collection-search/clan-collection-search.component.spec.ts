import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanCollectionSearchComponent } from './clan-collection-search.component';

describe('ClanCollectionSearchComponent', () => {
  let component: ClanCollectionSearchComponent;
  let fixture: ComponentFixture<ClanCollectionSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanCollectionSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanCollectionSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
