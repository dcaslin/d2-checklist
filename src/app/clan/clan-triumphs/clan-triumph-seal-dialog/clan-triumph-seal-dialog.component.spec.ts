import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanTriumphSealDialogComponent } from './clan-triumph-seal-dialog.component';

describe('ClanTriumphSealDialogComponent', () => {
  let component: ClanTriumphSealDialogComponent;
  let fixture: ComponentFixture<ClanTriumphSealDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanTriumphSealDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanTriumphSealDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
