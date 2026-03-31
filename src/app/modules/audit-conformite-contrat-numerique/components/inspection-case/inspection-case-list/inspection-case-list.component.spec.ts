import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectionCaseListComponent } from './inspection-case-list.component';

describe('InspectionCaseListComponent', () => {
  let component: InspectionCaseListComponent;
  let fixture: ComponentFixture<InspectionCaseListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectionCaseListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspectionCaseListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
