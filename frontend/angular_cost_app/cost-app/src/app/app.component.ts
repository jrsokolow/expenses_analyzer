import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

interface ConstantMap {
  [key: string]: string[];
}

interface CostResponse {
  constantArray: string[];
  totalAmount: number;
}

interface UnmatchingCost {
  Opis: string;
  Kwota: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {}
