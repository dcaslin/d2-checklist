import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanSealsComponent } from './clan-seals.component';

describe('ClanSealsComponent', () => {
  let component: ClanSealsComponent;
  let fixture: ComponentFixture<ClanSealsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanSealsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanSealsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
