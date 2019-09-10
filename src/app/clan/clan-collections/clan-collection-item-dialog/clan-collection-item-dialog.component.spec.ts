import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanCollectionItemDialogComponent } from './clan-collection-item-dialog.component';

describe('ClanCollectionItemDialogComponent', () => {
  let component: ClanCollectionItemDialogComponent;
  let fixture: ComponentFixture<ClanCollectionItemDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanCollectionItemDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanCollectionItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
