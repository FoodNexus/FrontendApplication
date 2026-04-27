import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotFormComponent } from './lot-form.component';

describe('LotFormComponent', () => {
  let component: LotFormComponent;
  let fixture: ComponentFixture<LotFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
