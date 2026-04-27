import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriqueListComponent } from './historique-list.component';

describe('HistoriqueListComponent', () => {
  let component: HistoriqueListComponent;
  let fixture: ComponentFixture<HistoriqueListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriqueListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriqueListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
