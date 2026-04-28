import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IaRecommendationComponent } from './ia-recommendation.component';

describe('IaRecommendationComponent', () => {
  let component: IaRecommendationComponent;
  let fixture: ComponentFixture<IaRecommendationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IaRecommendationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IaRecommendationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
