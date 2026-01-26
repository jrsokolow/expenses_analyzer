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
  selectedCategory: string;
  keyword: string;
  categorized?: boolean;
  isSaving?: boolean;
  error?: string;
}


@Component({
  selector: 'app-cost-list',
  templateUrl: './cost-list.component.html',
  styleUrls: ['./cost-list.component.css']
})
export class CostListComponent implements OnInit {
  costs: Cost[] = [];
  unmatchedCosts: UnmatchedCost[] = [];
  categories: string[] = [];
  filterText = '';
  hideCategorized = true;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.fetchCategories();
    this.fetchCosts();
    this.fetchUnmatchedCosts();
  }

  get filteredUnmatchedCosts(): UnmatchedCost[] {
    const filter = this.filterText.trim().toLowerCase();
    return this.unmatchedCosts.filter((cost) => {
      if (this.hideCategorized && cost.categorized) {
        return false;
      }
      if (!filter) {
        return true;
      }
      return cost.description.toLowerCase().includes(filter);
    });
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
        this.ensureCategoriesFromCosts();
      },
      (error) => {
        console.log('Error fetching costs:', error);
      }
    );
  }

  fetchCategories() {
    this.http.get<string[]>('http://localhost:3000/api/categories').subscribe(
      (data) => {
        this.categories = Array.isArray(data) ? data : [];
        this.ensureCategoriesFromCosts();
        this.applyCategoryDefaults();
      },
      (error) => {
        console.log('Error fetching categories:', error);
        this.ensureCategoriesFromCosts();
      }
    );
  }


  fetchUnmatchedCosts() {
    this.http.get<any[]>('http://localhost:3000/api/non-matching').subscribe(
      (data) => {
        this.unmatchedCosts = data.map((item) => ({
          description: item.Opis,
          amount: parseFloat(item.Kwota.replace(',', '')),
          selectedCategory: '',
          keyword: (item.Opis ?? '').toString(),
        } as UnmatchedCost));
        this.applyCategoryDefaults();
      },
      (error) => {
        console.log('Error fetching unmatched costs:', error);
      }
    );
  }

  applyCategoryDefaults() {
    if (!this.categories.length || !this.unmatchedCosts.length) {
      return;
    }
    const defaultCategory = this.categories[0];
    this.unmatchedCosts = this.unmatchedCosts.map((cost) => ({
      ...cost,
      selectedCategory: cost.selectedCategory || defaultCategory,
    }));
  }

  ensureCategoriesFromCosts() {
    if (this.categories.length || !this.costs.length) {
      return;
    }
    this.categories = this.costs.map((cost) => cost.name);
    this.applyCategoryDefaults();
  }

  categorizeCost(cost: UnmatchedCost) {
    cost.error = undefined;
    const keyword = cost.keyword?.trim();
    if (!cost.selectedCategory) {
      cost.error = 'Select a category.';
      return;
    }
    if (!keyword) {
      cost.error = 'Keyword is required.';
      return;
    }

    cost.isSaving = true;
    this.http
      .post('http://localhost:3000/api/categorize', {
        category: cost.selectedCategory,
        keyword,
      })
      .subscribe(
        () => {
          cost.isSaving = false;
          cost.categorized = true;
          this.fetchCosts();
          this.fetchUnmatchedCosts();
        },
        (error) => {
          cost.isSaving = false;
          cost.error = error?.error?.error || 'Failed to categorize.';
          console.log('Error categorizing cost:', error);
        }
      );
  }
}
