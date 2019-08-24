import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanTriumphTrackedComponent } from './clan-triumph-tracked.component';

describe('ClanTriumphTrackedComponent', () => {
  let component: ClanTriumphTrackedComponent;
  let fixture: ComponentFixture<ClanTriumphTrackedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanTriumphTrackedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanTriumphTrackedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
