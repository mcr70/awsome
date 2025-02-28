import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudWatchComponent } from './cloudwatch.component';

describe('CloudWatchComponent', () => {
  let component: CloudWatchComponent;
  let fixture: ComponentFixture<CloudWatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloudWatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloudWatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
