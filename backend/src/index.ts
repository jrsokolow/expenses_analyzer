import express, { Request, Response } from 'express';
import { Row } from 'read-excel-file';
import cors from 'cors';

import readExcelFile from 'read-excel-file/node';

const ALLEGRO = ['Allegro']
const MARKETS = ['DINO', 'NETTO', 'BIEDRONKA', 'CARREFOUR'];
const PEPCO = ['PEPCO'];
const PETROL = ['STACJA PALIW', 'LOTOS', 'ORLEN', 'CIRCLE'];
const MEDICINE = ['APTEKA'];
const DOCTORS = ['MEDICUS'];
const DENTISTRY = ['STOMATOLOGIA'];
const DIABETIC = ['diabetyk24', 'FRANCISCO', 'Aero-Medika'];
const TOOLS_SHOPS = ['MROWKA', 'GRANAT'];
const SMALL_SHOPS = ['ZABKA', 'ZYGULA', 'Piekarnia', 'WIELOBRANZOWY', 'DELIKATESY MIESNE', 'ROGAL', 'FIVE O CLOCK', 'LEKS'];
const GAMES = ['LONDON', 'GOGcomECOM', 'Google Play', 'Steam', 'STEAM', 'PlayStation'];
const MEDIA = ['Disney', 'YouTubePremium', 'SKYSHOWTIME'];
const ORANGE = ['FLEX'];
const CLOTHS = ['smyk', 'SECRET', 'SINSAY', 'kappahl', 'MEDICINE', 'HOUSE', 'RESERVED'];
const CAR_SHOWER = ['WIKON', 'Myjnia'];
const FARM = ['ZIELONY ZAKATEK', 'OGRODNICZO'];
const SHOES = ['CCC'];
const COSMETICS = ['ROSSMANN'];
const EMPIK = ['EMPIK'];
const RESTAURANT = ['SLOW FOOD', 'Verde', 'EWA DA', 'STARA PIEKARNIA', 'MCDONALDS', 'TCHIBO', 'PIJALNIA KAWY I CZEKO', 'KUCHNIE SWIATA', 'HEBAN', 'Ohy'];
const MIEDZYZDROJE = ['MIEDZYZDROJE'];
const CINEMA = ['DOM KULTURY'];
const SPORT = ['MARTES'];
const HAIR_CUT = ['FRYZJERSKI', 'FRYZJERSKA'];
const PETS = ['PATIVET', 'KAKADU'];
const ENGLISH = ['edoo'];

// Definicja obiektu z mapowaniem stałych
const constantMap: Record<string, string[]> = {
  ALLEGRO,
  MARKETS,
  PEPCO,
  PETROL,
  MEDICINE,
  DOCTORS,
  DENTISTRY,
  DIABETIC,
  TOOLS_SHOPS,
  SMALL_SHOPS,
  GAMES,
  MEDIA,
  ORANGE,
  CLOTHS,
  CAR_SHOWER,
  FARM,
  SHOES,
  COSMETICS,
  EMPIK,
  RESTAURANT,
  MIEDZYZDROJE,
  CINEMA,
  SPORT,
  HAIR_CUT,
  PETS,
  ENGLISH,
};

function isCostMatch(value: string, array: string[]): boolean {
  return array.some((str) => value.includes(str));
}

const app = express();

app.use(cors());

// Ścieżka do pliku XLSX (uwzględniająca lokalizację pliku)
const excelFilePath = 'dist/source.xlsx';

// Interfejs opisujący strukturę wiersza w pliku XLSX
interface ExcelRow {
  Opis: string;
  Kwota: string;
}

// Endpoint zwracający dane z pliku XLSX w formie JSON
app.get('/api/data/:constant', async (req: Request, res: Response) => {
  try {
    const constant = req.params.constant;

    // Sprawdź, czy przekazana stała istnieje w mapie
    if (!constantMap.hasOwnProperty(constant)) {
      res.status(400).json({ error: 'Invalid constant' });
      return;
    }

    const constantArray: string[] = constantMap[constant];

    const rows: Row[] = await readExcelFile(excelFilePath);

    const jsonData: ExcelRow[] = rows
      .slice(1)
      .filter((row: Row) => {
        return isCostMatch(row[6]?.toString() || '', constantArray)
      })
      .map((row: Row) => ({
        Opis: row[6]?.toString() || '',
        Kwota: row[3]?.toString() || '',
      }));

    // Filtruj dane na podstawie przekazanego parametru
    const filteredData: ExcelRow[] = jsonData.filter((row: ExcelRow) =>
      constantArray.some((constantValue: string) =>
        row.Opis.includes(constantValue)
      )
    );

    // Sumowanie wartości pola "Kwota"
    const totalAmount = filteredData.reduce(
      (sum: number, row: ExcelRow) => sum + parseFloat(row.Kwota.replace(',', '').replace('-', '')),
      0
    );

    res.json({ constantArray, totalAmount });
  } catch (error) {
    console.error('Wystąpił błąd:', error);
    res.status(500).json({ error: 'Wystąpił błąd serwera.' });
  }
});

app.get('/api/costs', async (req: Request, res: Response) => {
  try {
    const rows: Row[] = await readExcelFile(excelFilePath);

    const jsonData: ExcelRow[] = rows
      .slice(1)
      .map((row: Row) => ({
        Opis: row[6]?.toString() || '',
        Kwota: row[3]?.toString() || '',
      }));

    const costs: Record<string, number> = {};

    Object.keys(constantMap).forEach(constant => {
      const constantArray = constantMap[constant];
      const totalAmount = jsonData.reduce(
        (sum: number, row: ExcelRow) => {
          if (isCostMatch(row.Opis, constantArray)) {
            return sum + parseFloat(row.Kwota.replace(',', '').replace('-', ''));
          }
          return sum;
        },
        0
      );
      costs[constant] = Math.floor(totalAmount);
    });

    res.json(costs);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/constants', (req: Request, res: Response) => {
  try {
    res.json(constantMap);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/non-matching', async (req: Request, res: Response) => {
  try {
    const rows: Row[] = await readExcelFile(excelFilePath);

    const jsonData: ExcelRow[] = rows
      .slice(1)
      .map((row: Row) => ({
        Opis: row[6]?.toString() || '',
        Kwota: row[3]?.toString() || '',
      }));

    const nonMatchingRows = jsonData.filter((row: ExcelRow) => {
      const values = Object.values(constantMap).flat();
      return !values.some((value) => row.Opis.includes(value));
    });
    res.json(nonMatchingRows);
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
