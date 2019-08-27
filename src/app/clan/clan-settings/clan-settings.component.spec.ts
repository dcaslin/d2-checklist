import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanSettingsComponent } from './clan-settings.component';

describe('ClanSettingsComponent', () => {
  let component: ClanSettingsComponent;
  let fixture: ComponentFixture<ClanSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClanSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClanSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
