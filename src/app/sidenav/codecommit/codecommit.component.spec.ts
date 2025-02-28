import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodecommitComponent } from './codecommit.component';

describe('CodecommitComponent', () => {
  let component: CodecommitComponent;
  let fixture: ComponentFixture<CodecommitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodecommitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodecommitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
