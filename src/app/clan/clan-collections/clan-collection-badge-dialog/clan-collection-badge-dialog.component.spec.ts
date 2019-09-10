import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanCollectionBadgeDialogComponent } from './clan-collection-badge-dialog.component';

describe('ClanCollectionBadgeDialogComponent', () => {
  let component: ClanCollectionBadgeDialogComponent;
  let fixture: ComponentFixture<ClanCollectionBadgeDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanCollectionBadgeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanCollectionBadgeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
