import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotHomeComponent } from './robot-home.component';

describe('RobotHomeComponent', () => {
  let component: RobotHomeComponent;
  let fixture: ComponentFixture<RobotHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RobotHomeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RobotHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
