import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalContractListComponent } from './digital-contract-list.component';

describe('DigitalContractListComponent', () => {
  let component: DigitalContractListComponent;
  let fixture: ComponentFixture<DigitalContractListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DigitalContractListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DigitalContractListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
