import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanLifetimeDialogComponent } from './clan-lifetime-dialog.component';

describe('ClanLifetimeDialogComponent', () => {
  let component: ClanLifetimeDialogComponent;
  let fixture: ComponentFixture<ClanLifetimeDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanLifetimeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanLifetimeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
