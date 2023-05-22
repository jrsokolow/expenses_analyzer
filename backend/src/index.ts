import express, { Request, Response } from 'express';
import { Row } from 'read-excel-file';

import path from 'path';
import readExcelFile from 'read-excel-file/node';

const app = express();

// Ścieżka do pliku XLSX (uwzględniająca lokalizację pliku)
const excelFilePath = 'dist/source.xlsx';

// Interfejs opisujący strukturę wiersza w pliku XLSX
interface ExcelRow {
  Opis: string;
  Kwota: string;
}

// Endpoint zwracający dane z pliku XLSX w formie JSON
app.get('/api/data/:param', async (req: Request, res: Response) => {
  try {
    const param = req.params.param; // Pobranie przekazanego parametru

    const rows: Row[] = await readExcelFile(excelFilePath);

    const jsonData: ExcelRow[] = rows
      .slice(1)
      .map((row: Row) => ({
        Opis: row[6]?.toString() || '', // Pobranie wartości z pierwszej kolumny
        Kwota: row[3]?.toString() || '', // Pobranie wartości z drugiej kolumny
      }));

    // Filtruj dane na podstawie przekazanego parametru
    const filteredData = jsonData.filter(
      (row: ExcelRow) => row.Opis.includes(param)
    );

    // Sumowanie wartości pola "Kwota"
    const totalAmount = filteredData.reduce(
      (sum: number, row: ExcelRow) => sum + parseFloat(row.Kwota.replace(',', '').replace('-', '')),
      0
    );

    res.json({ param, totalAmount });
  } catch (error) {
    console.error('Wystąpił błąd:', error);
    res.status(500).json({ error: 'Wystąpił błąd serwera.' });
  }
});

// Start serwera
const port = 3000;
app.listen(port, () => {
  console.log(`Serwer nasłuchuje na porcie ${port}`);
});
