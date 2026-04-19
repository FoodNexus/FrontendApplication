import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardDonneurComponent } from './dashboard-donneur.component';

describe('DashboardDonneurComponent', () => {
  let component: DashboardDonneurComponent;
  let fixture: ComponentFixture<DashboardDonneurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardDonneurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardDonneurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
