import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailconfirmComponent } from './emailconfirm.component';

describe('EmailconfirmComponent', () => {
  let component: EmailconfirmComponent;
  let fixture: ComponentFixture<EmailconfirmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmailconfirmComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailconfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
