import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecyclingProductsFormComponent } from './recycling-products-form.component';

describe('RecyclingProductsFormComponent', () => {
  let component: RecyclingProductsFormComponent;
  let fixture: ComponentFixture<RecyclingProductsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecyclingProductsFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecyclingProductsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
