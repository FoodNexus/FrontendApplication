import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectionCaseFormComponent } from './inspection-case-form.component';

describe('InspectionCaseFormComponent', () => {
  let component: InspectionCaseFormComponent;
  let fixture: ComponentFixture<InspectionCaseFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectionCaseFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspectionCaseFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
