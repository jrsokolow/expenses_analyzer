import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface CostItem {
  description: string;
  amount: number;
}

interface Cost {
  name: string;
  total: number;
  items: CostItem[];
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
        const entries = Object.entries(data ?? {}) as [string, { total?: number; items?: CostItem[] }][];
        this.costs = entries.map(([name, value]) => ({
          name,
          total: value?.total ?? 0,
          items: Array.isArray(value?.items) ? value.items : [],
        }));
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
