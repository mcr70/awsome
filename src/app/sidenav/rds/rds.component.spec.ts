import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RdsComponent } from './rds.component';

describe('RdsComponent', () => {
  let component: RdsComponent;
  let fixture: ComponentFixture<RdsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RdsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RdsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
