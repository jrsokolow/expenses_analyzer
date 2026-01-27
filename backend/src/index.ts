import express, { Request, Response } from 'express';
import { Row } from 'read-excel-file';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';

import readExcelFile from 'read-excel-file/node';

interface CategoryMap {
  [category: string]: string[];
}

const categoriesPath = path.resolve(process.cwd(), 'src', 'categories.json');
const ignorePhrasesPath = path.resolve(process.cwd(), 'src', 'ignore-phrases.json');
const mappingPath = path.resolve(process.cwd(), 'src', 'mapping.json');
const oauthTokenPath = path.resolve(process.cwd(), 'src', 'google-token.json');
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

function buildCosts(
  jsonData: ExcelRow[],
  categoryMap: CategoryMap
): Record<string, { total: number; items: CostItem[] }> {
  const costs: Record<string, { total: number; items: CostItem[] }> = {};

  Object.keys(categoryMap).forEach((constant) => {
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
  });

  return costs;
}

async function loadExcelData(): Promise<ExcelRow[]> {
  const rows: Row[] = await readExcelFile(excelFilePath);
  return rows
    .slice(1)
    .map((row: Row) => ({
      // "Opis" is column index 7 in the XLSX file.
      Opis: row[7]?.toString() || '',
      Kwota: row[3]?.toString() || '',
    }));
}

async function loadMapping(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(mappingPath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([key, value]) => typeof key === 'string' && typeof value === 'string'
      )
    );
  } catch (error) {
    return {};
  }
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

function normalizeSheetLabel(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/google-auth-callback';

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

async function loadOAuthToken(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(oauthTokenPath, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    return null;
  }
}

async function saveOAuthToken(token: Record<string, unknown>): Promise<void> {
  await fs.mkdir(path.dirname(oauthTokenPath), { recursive: true });
  await fs.writeFile(oauthTokenPath, JSON.stringify(token, null, 2), 'utf-8');
}

app.get('/api/costs', async (req: Request, res: Response) => {
  try {
    await ensureCategoriesLoaded();
    const jsonData = await loadExcelData();
    const categoryMap = getCategoryMap();
    const costs = buildCosts(jsonData, categoryMap);
    res.json(costs);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/non-matching', async (req: Request, res: Response) => {
  try {
    await ensureCategoriesLoaded();
    const jsonData = await loadExcelData();

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

app.get('/api/google-auth-status', async (req: Request, res: Response) => {
  try {
    const token = await loadOAuthToken();
    res.json({ authenticated: !!token });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/google-auth-url', async (req: Request, res: Response) => {
  try {
    const oauthClient = getOAuthClient();
    if (!oauthClient) {
      res.status(400).json({ error: 'Missing GOOGLE_OAUTH_CLIENT_ID/SECRET.' });
      return;
    }

    const authUrl = oauthClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/google-auth-callback', async (req: Request, res: Response) => {
  try {
    const oauthClient = getOAuthClient();
    if (!oauthClient) {
      res.status(400).send('Missing GOOGLE_OAUTH_CLIENT_ID/SECRET.');
      return;
    }
    const code = req.query.code as string | undefined;
    if (!code) {
      res.status(400).send('Missing code parameter.');
      return;
    }

    const { tokens } = await oauthClient.getToken(code);
    await saveOAuthToken(tokens as Record<string, unknown>);

    res.send('OAuth connected. You can close this window and return to the app.');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('OAuth error.');
  }
});

app.get('/api/google-sheets-tabs', async (req: Request, res: Response) => {
  try {
    const spreadsheetId =
      process.env.GOOGLE_SHEETS_ID || '10pT7HRs1_UIe7vl8IXl70IQO0TEFvfCPUnTCb3VcDEE';

    const oauthClient = getOAuthClient();
    if (!oauthClient) {
      res.status(400).json({ error: 'Missing GOOGLE_OAUTH_CLIENT_ID/SECRET.' });
      return;
    }

    const token = await loadOAuthToken();
    if (!token) {
      const authUrl = oauthClient.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      res.status(401).json({ error: 'OAuth required.', authUrl });
      return;
    }

    oauthClient.setCredentials(token);
    const sheets = google.sheets({ version: 'v4', auth: oauthClient });
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title',
    });
    const tabs = (sheetInfo.data.sheets || [])
      .map((sheet) => sheet.properties?.title)
      .filter((title): title is string => typeof title === 'string');

    res.json({ tabs });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/export-to-sheet', async (req: Request, res: Response) => {
  try {
    await ensureCategoriesLoaded();

    const spreadsheetId =
      process.env.GOOGLE_SHEETS_ID || '10pT7HRs1_UIe7vl8IXl70IQO0TEFvfCPUnTCb3VcDEE';
    const bodyTabName = (req.body as { tabName?: string } | undefined)?.tabName;
    const tabName = bodyTabName || process.env.GOOGLE_SHEETS_TAB || 'testing';
    const oauthClient = getOAuthClient();
    if (!oauthClient) {
      res.status(400).json({ error: 'Missing GOOGLE_OAUTH_CLIENT_ID/SECRET.' });
      return;
    }

    const token = await loadOAuthToken();
    if (!token) {
      const authUrl = oauthClient.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      res.status(401).json({ error: 'OAuth required.', authUrl });
      return;
    }

    oauthClient.setCredentials(token);
    oauthClient.on('tokens', (tokens) => {
      const merged = { ...token, ...tokens };
      saveOAuthToken(merged as Record<string, unknown>).catch(() => undefined);
    });
    const sheets = google.sheets({ version: 'v4', auth: oauthClient });

    const mapping = await loadMapping();
    const jsonData = await loadExcelData();
    const categoryMap = getCategoryMap();
    const costs = buildCosts(jsonData, categoryMap);

    const sheetValues = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!B:B`,
    });
    const rows = sheetValues.data.values || [];
    const rowIndexByLabel: Record<string, number> = {};
    rows.forEach((row, index) => {
      const label = row?.[0];
      if (typeof label === 'string' && label.trim()) {
        rowIndexByLabel[normalizeSheetLabel(label)] = index + 1;
      }
    });

    const updates: { range: string; values: (string | number)[][] }[] = [];
    const missingLabels: string[] = [];
    const missingCategories: string[] = [];
    const availableLabels = Object.keys(rowIndexByLabel).slice(0, 100);

    Object.entries(mapping).forEach(([categoryKey, sheetLabel]) => {
      const rowIndex = rowIndexByLabel[normalizeSheetLabel(sheetLabel)];
      if (!rowIndex) {
        missingLabels.push(sheetLabel);
        return;
      }
      const cost = costs[categoryKey];
      if (!cost) {
        missingCategories.push(categoryKey);
        return;
      }
      updates.push({
        range: `${tabName}!I${rowIndex}`,
        values: [[cost.total]],
      });
    });

    if (!updates.length) {
      res.json({ ok: true, updated: 0, missingLabels, missingCategories, availableLabels });
      return;
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates,
      },
    });

    res.json({ ok: true, updated: updates.length, missingLabels, missingCategories, availableLabels });
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
