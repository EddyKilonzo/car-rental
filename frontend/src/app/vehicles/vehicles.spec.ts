import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vehicles } from './vehicles';

describe('Vehicles', () => {
  let component: Vehicles;
  let fixture: ComponentFixture<Vehicles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vehicles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Vehicles);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
