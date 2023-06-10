import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostListComponent } from './cost-list.component';

describe('CostListComponent', () => {
  let component: CostListComponent;
  let fixture: ComponentFixture<CostListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CostListComponent]
    });
    fixture = TestBed.createComponent(CostListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
