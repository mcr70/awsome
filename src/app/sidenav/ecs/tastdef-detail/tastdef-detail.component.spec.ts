import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TastdefDetailComponent } from './tastdef-detail.component';

describe('TastdefDetailComponent', () => {
  let component: TastdefDetailComponent;
  let fixture: ComponentFixture<TastdefDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TastdefDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TastdefDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
