import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanLifetimeComponent } from './clan-lifetime.component';

describe('ClanLifetimeComponent', () => {
  let component: ClanLifetimeComponent;
  let fixture: ComponentFixture<ClanLifetimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanLifetimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanLifetimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
