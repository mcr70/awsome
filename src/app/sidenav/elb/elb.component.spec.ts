import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElbComponent } from './elb.component';

describe('ElbComponent', () => {
  let component: ElbComponent;
  let fixture: ComponentFixture<ElbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElbComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
