import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleForm } from './vehicle-form';

describe('VehicleForm', () => {
  let component: VehicleForm;
  let fixture: ComponentFixture<VehicleForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
