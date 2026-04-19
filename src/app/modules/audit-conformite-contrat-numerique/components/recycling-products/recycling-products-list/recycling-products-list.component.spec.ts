import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecyclingProductsListComponent } from './recycling-products-list.component';

describe('RecyclingProductsListComponent', () => {
  let component: RecyclingProductsListComponent;
  let fixture: ComponentFixture<RecyclingProductsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecyclingProductsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecyclingProductsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
