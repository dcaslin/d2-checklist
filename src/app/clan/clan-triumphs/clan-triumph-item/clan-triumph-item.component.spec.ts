import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanTriumphItemComponent } from './clan-triumph-item.component';

describe('ClanTriumphItemComponent', () => {
  let component: ClanTriumphItemComponent;
  let fixture: ComponentFixture<ClanTriumphItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanTriumphItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanTriumphItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
