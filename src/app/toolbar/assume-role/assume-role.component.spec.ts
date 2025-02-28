import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssumeRoleComponent } from './assume-role.component';

describe('AssumeRoleComponent', () => {
  let component: AssumeRoleComponent;
  let fixture: ComponentFixture<AssumeRoleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssumeRoleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssumeRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
