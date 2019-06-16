import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RewardDescComponent } from './reward-desc.component';

describe('RewardDescComponent', () => {
  let component: RewardDescComponent;
  let fixture: ComponentFixture<RewardDescComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RewardDescComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RewardDescComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
