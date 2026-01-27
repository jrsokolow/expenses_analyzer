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
  newCategoryName = '';
  categoryError = '';
  isCreatingCategory = false;
  editorCategory = '';
  editorKeywords: string[] = [];
  editorKeyword = '';
  editorError = '';
  isLoadingEditor = false;
  isSavingEditor = false;
  isDeletingEditor = false;
  isExporting = false;
  exportMessage = '';
  googleAuthUrl = '';
  exportAvailableLabels: string[] = [];
  sheetTabs: string[] = [];
  selectedSheetTab = '';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.fetchCategories();
    this.fetchCosts();
    this.fetchUnmatchedCosts();
    this.fetchSheetTabs();
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

  get unmatchedTotal(): number {
    return this.filteredUnmatchedCosts.reduce((sum, cost) => sum + (Number.isFinite(cost.amount) ? cost.amount : 0), 0);
  }

  copyTotal(total: number) {
    if (!Number.isFinite(total)) {
      return;
    }
    const value = total.toString();
    navigator.clipboard.writeText(value).catch((error) => {
      console.log('Failed to copy total:', error);
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
        const list = Array.isArray(data) ? data : [];
        this.categories = list.slice().sort((a, b) => a.localeCompare(b));
        if (!this.editorCategory && this.categories.length) {
          this.editorCategory = this.categories[0];
          this.fetchCategoryKeywords();
        }
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
    this.categories = this.costs
      .map((cost) => cost.name)
      .slice()
      .sort((a, b) => a.localeCompare(b));
    if (!this.editorCategory && this.categories.length) {
      this.editorCategory = this.categories[0];
      this.fetchCategoryKeywords();
    }
    this.applyCategoryDefaults();
  }

  createCategory() {
    this.categoryError = '';
    const category = this.newCategoryName.trim();
    if (!category) {
      this.categoryError = 'Category name is required.';
      return;
    }

    this.isCreatingCategory = true;
    this.http
      .post('http://localhost:3000/api/categories', { category })
      .subscribe(
        () => {
          this.isCreatingCategory = false;
          this.newCategoryName = '';
          this.fetchCategories();
        },
        (error) => {
          this.isCreatingCategory = false;
          this.categoryError = error?.error?.error || 'Failed to create category.';
          console.log('Error creating category:', error);
        }
      );
  }

  fetchCategoryKeywords() {
    if (!this.editorCategory) {
      return;
    }
    this.editorError = '';
    this.isLoadingEditor = true;
    this.http
      .get<{ keywords: string[] }>(`http://localhost:3000/api/categories/${this.editorCategory}`)
      .subscribe(
        (data) => {
          this.isLoadingEditor = false;
          this.editorKeywords = Array.isArray(data?.keywords) ? data.keywords : [];
        },
        (error) => {
          this.isLoadingEditor = false;
          this.editorError = error?.error?.error || 'Failed to load category keywords.';
          console.log('Error loading category keywords:', error);
        }
      );
  }

  addEditorKeyword() {
    this.editorError = '';
    const keyword = this.editorKeyword.trim();
    if (!this.editorCategory) {
      this.editorError = 'Select a category.';
      return;
    }
    if (!keyword) {
      this.editorError = 'Keyword is required.';
      return;
    }
    this.isSavingEditor = true;
    this.http
      .post('http://localhost:3000/api/categorize', {
        category: this.editorCategory,
        keyword,
      })
      .subscribe(
        () => {
          this.isSavingEditor = false;
          this.editorKeyword = '';
          this.fetchCategoryKeywords();
          this.fetchCosts();
          this.fetchUnmatchedCosts();
        },
        (error) => {
          this.isSavingEditor = false;
          this.editorError = error?.error?.error || 'Failed to add keyword.';
          console.log('Error adding keyword:', error);
        }
      );
  }

  removeKeyword(keyword: string) {
    if (!this.editorCategory) {
      return;
    }
    this.isDeletingEditor = true;
    this.http
      .delete(`http://localhost:3000/api/categories/${this.editorCategory}/keyword`, {
        body: { keyword },
      })
      .subscribe(
        () => {
          this.isDeletingEditor = false;
          this.fetchCategoryKeywords();
          this.fetchCosts();
          this.fetchUnmatchedCosts();
        },
        (error) => {
          this.isDeletingEditor = false;
          this.editorError = error?.error?.error || 'Failed to remove keyword.';
          console.log('Error removing keyword:', error);
        }
      );
  }

  exportToSheet() {
    this.exportMessage = '';
    this.exportAvailableLabels = [];
    this.isExporting = true;
    this.http.post('http://localhost:3000/api/export-to-sheet', {
      tabName: this.selectedSheetTab || undefined,
    }).subscribe(
      (data: any) => {
        this.isExporting = false;
        const updated = data?.updated ?? 0;
        const missingLabels = Array.isArray(data?.missingLabels) ? data.missingLabels : [];
        const missingCategories = Array.isArray(data?.missingCategories) ? data.missingCategories : [];
        if (missingLabels.length) {
          this.exportAvailableLabels = Array.isArray(data?.availableLabels) ? data.availableLabels : [];
        }
        const parts = [`Updated ${updated} rows.`];
        if (missingLabels.length) {
          parts.push(`Missing labels: ${missingLabels.join(', ')}`);
        }
        if (missingCategories.length) {
          parts.push(`Missing categories: ${missingCategories.join(', ')}`);
        }
        this.exportMessage = parts.join(' ');
      },
      (error) => {
        this.isExporting = false;
        this.googleAuthUrl = error?.error?.authUrl || '';
        this.exportMessage = error?.error?.error || 'Export failed.';
        this.exportAvailableLabels = Array.isArray(error?.error?.availableLabels) ? error.error.availableLabels : [];
        console.log('Error exporting to sheet:', error);
      }
    );
  }

  connectGoogle() {
    this.exportMessage = '';
    this.http.get<{ url: string }>('http://localhost:3000/api/google-auth-url').subscribe(
      (data) => {
        const url = data?.url;
        if (url) {
          this.googleAuthUrl = url;
          window.open(url, '_blank');
        }
      },
      (error) => {
        this.exportMessage = error?.error?.error || 'Failed to start OAuth.';
        console.log('Error starting OAuth:', error);
      }
    );
  }

  fetchSheetTabs() {
    this.http.get<{ tabs: string[] }>('http://localhost:3000/api/google-sheets-tabs').subscribe(
      (data) => {
        const tabs = Array.isArray(data?.tabs) ? data.tabs : [];
        this.sheetTabs = tabs;
        if (!this.selectedSheetTab && tabs.length) {
          this.selectedSheetTab = tabs[0];
        }
      },
      (error) => {
        this.googleAuthUrl = error?.error?.authUrl || '';
        console.log('Error fetching sheet tabs:', error);
      }
    );
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
