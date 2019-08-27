import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanUserListDialogComponent } from './clan-user-list-dialog.component';

describe('ClanUserListDialogComponent', () => {
  let component: ClanUserListDialogComponent;
  let fixture: ComponentFixture<ClanUserListDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanUserListDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanUserListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
