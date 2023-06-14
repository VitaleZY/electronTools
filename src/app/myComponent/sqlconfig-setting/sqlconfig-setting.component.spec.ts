import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SQLConfigSettingComponent } from './sqlconfig-setting.component';

describe('SQLConfigSettingComponent', () => {
  let component: SQLConfigSettingComponent;
  let fixture: ComponentFixture<SQLConfigSettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SQLConfigSettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SQLConfigSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
