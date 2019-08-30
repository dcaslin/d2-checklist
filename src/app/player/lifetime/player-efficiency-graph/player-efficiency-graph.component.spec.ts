import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerEfficiencyGraphComponent } from './player-efficiency-graph.component';

describe('PlayerEfficiencyGraphComponent', () => {
  let component: PlayerEfficiencyGraphComponent;
  let fixture: ComponentFixture<PlayerEfficiencyGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayerEfficiencyGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerEfficiencyGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
