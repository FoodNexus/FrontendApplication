import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchingResultatComponent } from './matching-resultat.component';

describe('MatchingResultatComponent', () => {
  let component: MatchingResultatComponent;
  let fixture: ComponentFixture<MatchingResultatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchingResultatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchingResultatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
