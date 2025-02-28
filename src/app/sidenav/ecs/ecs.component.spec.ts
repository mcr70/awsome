import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcsComponent } from './ecs.component';

describe('EcsComponent', () => {
  let component: EcsComponent;
  let fixture: ComponentFixture<EcsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EcsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
