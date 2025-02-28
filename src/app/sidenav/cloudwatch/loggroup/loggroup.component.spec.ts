import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogGroupComponent } from './loggroup.component';

describe('LoggroupComponent', () => {
  let component: LogGroupComponent;
  let fixture: ComponentFixture<LogGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
