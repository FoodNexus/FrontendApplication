import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchingLancerComponent } from './matching-lancer.component';

describe('MatchingLancerComponent', () => {
  let component: MatchingLancerComponent;
  let fixture: ComponentFixture<MatchingLancerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchingLancerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchingLancerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
