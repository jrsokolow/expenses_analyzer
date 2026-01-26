import express, { Request, Response } from 'express';
import { Row } from 'read-excel-file';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';

import readExcelFile from 'read-excel-file/node';

interface CategoryMap {
  [category: string]: string[];
}

const categoriesPath = path.resolve(process.cwd(), 'src', 'categories.json');
const ignorePhrasesPath = path.resolve(process.cwd(), 'src', 'ignore-phrases.json');
let categories: CategoryMap = {};
let ignorePhrases: string[] = [];
let categoriesLoaded = false;

function isCostMatch(value: string, array: string[]): boolean {
  const normalizedValue = removeIgnoredPhrases(value);
  return array.some((str) => normalizedValue.includes(str));
}

const app = express();

app.use(cors());
app.use(express.json());

// Ścieżka do pliku XLSX (uwzględniająca lokalizację pliku)
const excelFilePath = 'dist/source.xlsx';

// Interfejs opisujący strukturę wiersza w pliku XLSX
interface ExcelRow {
  Opis: string;
  Kwota: string;
}

interface CostItem {
  description: string;
  amount: number;
}

function parseAmount(value: string): number | null {
  const normalizedAmount = value
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');
  const amount = Number.parseFloat(normalizedAmount);
  return Number.isFinite(amount) ? Math.abs(amount) : null;
}

async function loadCategoryFile(filePath: string): Promise<CategoryMap> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as CategoryMap;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [],
      ])
    );
  } catch (error) {
    return {};
  }
}

async function loadIgnorePhrases(filePath: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch (error) {
    return [];
  }
}

async function ensureCategoriesLoaded(): Promise<void> {
  if (categoriesLoaded) {
    return;
  }

  categories = await loadCategoryFile(categoriesPath);
  ignorePhrases = await loadIgnorePhrases(ignorePhrasesPath);
  categoriesLoaded = true;
}

function getCategoryMap(): CategoryMap {
  return categories;
}

async function saveCategories(): Promise<void> {
  await fs.mkdir(path.dirname(categoriesPath), { recursive: true });
  await fs.writeFile(categoriesPath, JSON.stringify(categories, null, 2), 'utf-8');
}

function removeIgnoredPhrases(value: string): string {
  if (!ignorePhrases.length) {
    return value;
  }
  return ignorePhrases.reduce((result, phrase) => {
    if (!phrase) {
      return result;
    }
    return result.split(phrase).join('');
  }, value);
}

app.get('/api/costs', async (req: Request, res: Response) => {
  try {
    await ensureCategoriesLoaded();
    const rows: Row[] = await readExcelFile(excelFilePath);

    const jsonData: ExcelRow[] = rows
      .slice(1)
      .map((row: Row) => ({
        // "Opis" is column index 7 in the XLSX file.
        Opis: row[7]?.toString() || '',
        Kwota: row[3]?.toString() || '',
      }));

    const costs: Record<string, { total: number; items: CostItem[] }> = {};
    const categoryMap = getCategoryMap();

    Object.keys(categoryMap).forEach((constant) => {
      console.log(constant);
      const constantArray = categoryMap[constant];
      const items: CostItem[] = jsonData
        .filter((row: ExcelRow) => isCostMatch(row.Opis, constantArray))
        .map((row: ExcelRow) => {
          const amount = parseAmount(row.Kwota);
          if (amount === null) {
            return null;
          }
          return {
            description: row.Opis,
            amount,
          };
        })
        .filter((item): item is CostItem => item !== null);

      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      costs[constant] = {
        total: Math.floor(totalAmount),
        items,
      };
      console.log('>>>>>>>>>>>>>>>>>>');
    });

    res.json(costs);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/non-matching', async (req: Request, res: Response) => {
  try {
    await ensureCategoriesLoaded();
    const rows: Row[] = await readExcelFile(excelFilePath);

    const jsonData: ExcelRow[] = rows
      .slice(1)
      .map((row: Row) => ({
        // "Opis" is column index 7 in the XLSX file.
        Opis: row[7]?.toString() || '',
        Kwota: row[3]?.toString() || '',
      }));

    const categoryMap = getCategoryMap();
    const nonMatchingRows = jsonData.filter((row: ExcelRow) => {
      const values = Object.values(categoryMap).flat();
      return !values.some((value) => row.Opis.toLowerCase().includes(value.toLowerCase()));
    });
    res.json(nonMatchingRows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    await ensureCategoriesLoaded();
    const categories = Object.keys(getCategoryMap());
    res.json(categories);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/categories', async (req: Request, res: Response) => {
  try {
    await ensureCategoriesLoaded();
    const { category } = req.body as { category?: string };
    if (!category) {
      res.status(400).json({ error: 'Category is required.' });
      return;
    }

    const normalizedCategory = category.trim();
    if (!normalizedCategory) {
      res.status(400).json({ error: 'Category must not be empty.' });
      return;
    }

    if (categories[normalizedCategory]) {
      res.status(400).json({ error: 'Category already exists.' });
      return;
    }

    categories[normalizedCategory] = [];
    await saveCategories();
    res.json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/categories/:category', async (req: Request, res: Response) => {
  try {
    await ensureCategoriesLoaded();
    const category = req.params.category;
    if (!category) {
      res.status(400).json({ error: 'Category is required.' });
      return;
    }

    if (!categories[category]) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    res.json({ keywords: categories[category] ?? [] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/categories/:category/keyword', async (req: Request, res: Response) => {
  try {
    await ensureCategoriesLoaded();
    const category = req.params.category;
    const { keyword } = req.body as { keyword?: string };
    if (!category || !keyword) {
      res.status(400).json({ error: 'Category and keyword are required.' });
      return;
    }

    if (!categories[category]) {
      res.status(404).json({ error: 'Keyword not found.' });
      return;
    }

    const index = categories[category].findIndex((value) => value === keyword);
    if (index === -1) {
      res.status(404).json({ error: 'Keyword not found.' });
      return;
    }

    categories[category].splice(index, 1);
    await saveCategories();
    res.json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/categorize', async (req: Request, res: Response) => {
  try {
    await ensureCategoriesLoaded();
    const { category, keyword } = req.body as { category?: string; keyword?: string };
    if (!category || !keyword) {
      res.status(400).json({ error: 'Category and keyword are required.' });
      return;
    }
    if (!categories[category]) {
      res.status(400).json({ error: 'Unknown category.' });
      return;
    }

    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      res.status(400).json({ error: 'Keyword must not be empty.' });
      return;
    }

    const exists = categories[category].some(
      (value) => value.toLowerCase() === normalizedKeyword.toLowerCase()
    );
    if (!exists) {
      categories[category].push(normalizedKeyword);
      await saveCategories();
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start serwera
const port = 3000;
app.listen(port, () => {
  console.log(`Serwer nasłuchuje na porcie ${port}`);
});
