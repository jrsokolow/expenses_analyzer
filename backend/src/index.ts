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
const customCategoriesPath = path.resolve(process.cwd(), 'src', 'custom-categories.json');
let baseCategories: CategoryMap = {};
let customCategories: CategoryMap = {};
let categoriesLoaded = false;

function isCostMatch(value: string, array: string[]): boolean {
  return array.some((str) => value.includes(str));
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

async function ensureCategoriesLoaded(): Promise<void> {
  if (categoriesLoaded) {
    return;
  }

  baseCategories = await loadCategoryFile(categoriesPath);
  customCategories = await loadCategoryFile(customCategoriesPath);
  categoriesLoaded = true;
}

function getCategoryMap(): CategoryMap {
  const merged: CategoryMap = {};
  Object.entries(baseCategories).forEach(([category, values]) => {
    merged[category] = [...values];
  });
  Object.entries(customCategories).forEach(([category, values]) => {
    if (!merged[category]) {
      merged[category] = [];
    }
    values.forEach((value) => {
      if (!merged[category].some((existing) => existing === value)) {
        merged[category].push(value);
      }
    });
  });
  return merged;
}

async function saveCustomCategories(): Promise<void> {
  await fs.mkdir(path.dirname(customCategoriesPath), { recursive: true });
  await fs.writeFile(customCategoriesPath, JSON.stringify(customCategories, null, 2), 'utf-8');
}

async function saveBaseCategories(): Promise<void> {
  await fs.mkdir(path.dirname(categoriesPath), { recursive: true });
  await fs.writeFile(categoriesPath, JSON.stringify(baseCategories, null, 2), 'utf-8');
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

    if (baseCategories[normalizedCategory]) {
      res.status(400).json({ error: 'Category already exists.' });
      return;
    }

    if (customCategories[normalizedCategory]) {
      baseCategories[normalizedCategory] = [];
      await saveBaseCategories();
      res.json({ ok: true, promoted: true });
      return;
    }

    baseCategories[normalizedCategory] = [];
    await saveBaseCategories();
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
    if (!baseCategories[category] && !customCategories[category]) {
      res.status(400).json({ error: 'Unknown category.' });
      return;
    }

    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      res.status(400).json({ error: 'Keyword must not be empty.' });
      return;
    }

    if (!customCategories[category]) {
      customCategories[category] = [];
    }

    const targetCategories = baseCategories[category] ? baseCategories : customCategories;
    if (!targetCategories[category]) {
      targetCategories[category] = [];
    }

    const exists = targetCategories[category].some(
      (value) => value.toLowerCase() === normalizedKeyword.toLowerCase()
    );
    if (!exists) {
      targetCategories[category].push(normalizedKeyword);
      if (targetCategories === baseCategories) {
        await saveBaseCategories();
      } else {
        await saveCustomCategories();
      }
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
