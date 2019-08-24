import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanTriumphSearchComponent } from './clan-triumph-search.component';

describe('ClanTriumphSearchComponent', () => {
  let component: ClanTriumphSearchComponent;
  let fixture: ComponentFixture<ClanTriumphSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanTriumphSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanTriumphSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
