import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalContractFormComponent } from './digital-contract-form.component';

describe('DigitalContractFormComponent', () => {
  let component: DigitalContractFormComponent;
  let fixture: ComponentFixture<DigitalContractFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DigitalContractFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DigitalContractFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
