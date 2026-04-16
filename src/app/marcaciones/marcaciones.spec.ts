import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Marcaciones } from './marcaciones';

describe('Marcaciones', () => {
  let component: Marcaciones;
  let fixture: ComponentFixture<Marcaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Marcaciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Marcaciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
