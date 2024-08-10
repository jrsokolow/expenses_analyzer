import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Cost {
  name: string;
  value: number;
}

interface UnmatchedCost {
  description: string;
  amount: number;
}


@Component({
  selector: 'app-cost-list',
  templateUrl: './cost-list.component.html',
  styleUrls: ['./cost-list.component.css']
})
export class CostListComponent implements OnInit {
  costs: Cost[] = [];
  unmatchedCosts: UnmatchedCost[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchCosts();
    this.fetchUnmatchedCosts();
  }

  fetchCosts() {
    this.http.get<any>('http://localhost:3000/api/costs').subscribe(
      (data) => {
        // Assuming the response JSON object has key-value pairs representing costs
        this.costs = Object.entries(data).map(([name, value]) => ({ name, value } as Cost));
      },
      (error) => {
        console.log('Error fetching costs:', error);
      }
    );
  }
  

  fetchUnmatchedCosts() {
    this.http.get<any[]>('http://localhost:3000/api/non-matching').subscribe(
      (data) => {
        // Assuming the response is an array of objects with fields Opis and Kwota
        this.unmatchedCosts = data.map((item) => ({
          description: item.Opis,
          amount: parseFloat(item.Kwota.replace(',', '')),
        } as UnmatchedCost));
      },
      (error) => {
        console.log('Error fetching unmatched costs:', error);
      }
    );
  }
}
