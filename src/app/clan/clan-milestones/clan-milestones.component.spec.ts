import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanMilestonesComponent } from './clan-milestones.component';

describe('ClanMilestonesComponent', () => {
  let component: ClanMilestonesComponent;
  let fixture: ComponentFixture<ClanMilestonesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanMilestonesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanMilestonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
