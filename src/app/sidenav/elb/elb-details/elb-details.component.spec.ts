import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElbDetailsComponent } from './elb-details.component';

describe('ElbDetailsComponent', () => {
  let component: ElbDetailsComponent;
  let fixture: ComponentFixture<ElbDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElbDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElbDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
