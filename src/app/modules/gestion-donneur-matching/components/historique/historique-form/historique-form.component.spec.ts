import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriqueFormComponent } from './historique-form.component';

describe('HistoriqueFormComponent', () => {
  let component: HistoriqueFormComponent;
  let fixture: ComponentFixture<HistoriqueFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriqueFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriqueFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
