import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanTriumphGraphComponent } from './clan-triumph-graph.component';

describe('ClanTriumphGraphComponent', () => {
  let component: ClanTriumphGraphComponent;
  let fixture: ComponentFixture<ClanTriumphGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanTriumphGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanTriumphGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
