import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListenerDetailComponent } from './listener-detail.component';

describe('ListenerDetailComponent', () => {
  let component: ListenerDetailComponent;
  let fixture: ComponentFixture<ListenerDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListenerDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListenerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
