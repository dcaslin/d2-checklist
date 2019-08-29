import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanLifetimeGraphComponent } from './clan-lifetime-graph.component';

describe('ClanLifetimeGraphComponent', () => {
  let component: ClanLifetimeGraphComponent;
  let fixture: ComponentFixture<ClanLifetimeGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanLifetimeGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanLifetimeGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
