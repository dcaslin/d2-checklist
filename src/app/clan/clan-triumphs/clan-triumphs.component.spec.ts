import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanTriumphsComponent } from './clan-triumphs.component';

describe('ClanTriumphsComponent', () => {
  let component: ClanTriumphsComponent;
  let fixture: ComponentFixture<ClanTriumphsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanTriumphsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanTriumphsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
