import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDeliveryRequestComponent } from './create-delivery-request.component';

describe('CreateDeliveryRequestComponent', () => {
  let component: CreateDeliveryRequestComponent;
  let fixture: ComponentFixture<CreateDeliveryRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDeliveryRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateDeliveryRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
