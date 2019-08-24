import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanTriumphItemDialogComponent } from './clan-triumph-item-dialog.component';

describe('ClanTriumphItemDialogComponent', () => {
  let component: ClanTriumphItemDialogComponent;
  let fixture: ComponentFixture<ClanTriumphItemDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanTriumphItemDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanTriumphItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
