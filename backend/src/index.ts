import express, { Request, Response } from 'express';
import { Row } from 'read-excel-file';
import cors from 'cors';

import readExcelFile from 'read-excel-file/node';

const ALLEGRO = ['Allegro']
const MARKETS = ['DINO', 'NETTO', 'BIEDRONKA', 'CARREFOUR'];
const PEPCO = ['PEPCO'];
const PETROL = ['STACJA PALIW', 'LOTOS', 'ORLEN', 'CIRCLE', 'NOWA SOL MOL'];
const MEDICINE = ['APTEKA'];
const DOCTORS = ['MEDICUS', 'ALDEMED','PERINATEA'];
const DENTISTRY = ['STOMATOLOGIA'];
const DIABETIC = ['diabetyk24', 'FRANCISCO', 'Aero-Medika'];
const TOOLS_SHOPS = ['MROWKA', 'GRANAT'];
const SMALL_SHOPS = ['ZABKA', 'ZYGULA', 'Piekarnia', 'WIELOBRANZOWY', 'DELIKATESY MIESNE', 'ROGAL', 'FIVE', 'LEKS', 'ODiDO', 'PROACTIVE ZAJAC', 'MOTYKA', 'EMI S.C', 'CUKIERNIA SNICKERS', 'DANIEL FIJO'];
const GAMES = ['LONDON', 'GOGcomECOM', 'Google Play', 'Steam', 'STEAM', 'PlayStation'];
const MEDIA = ['Disney', 'YouTubePremium', 'SKYSHOWTIME', 'rp.pl'];
const ORANGE = ['FLEX'];
const CLOTHS = ['smyk', 'SECRET', 'SINSAY', 'kappahl', 'MEDICINE', 'HOUSE', 'RESERVED', 'HM POL', 'GALANTERIA ODZIEZOWA', 'HEBE', 'CROPP'];
const CAR_SHOWER = ['WIKON', 'Myjnia'];
const FARM = ['ZIELONY ZAKATEK', 'OGRODNICZO', 'CENTRUM OGRODNICZE'];
const SHOES = ['CCC', 'e-cizemka', 'ccc.eu', 'eobuwie'];
const COSMETICS = ['ROSSMANN', 'SZALATA CHLEBOWSKA'];
const EMPIK = ['EMPIK'];
const RESTAURANT = ['KARMEL', 'SLOW FOOD', 'Verde', 'EWA DA', 'STARA PIEKARNIA', 'MCDONALDS', 'TCHIBO', 'PIJALNIA KAWY I CZEKO', 'KUCHNIE SWIATA', 'HEBAN', 'Ohy', 'KRATKA', 'Wafelek i Kulka', 'CIACHOO'];
const MIEDZYZDROJE = ['MIEDZYZDROJE'];
const CINEMA = ['DOM KULTURY'];
const SPORT = ['MARTES'];
const HAIR_CUT = ['FRYZJERSKI', 'FRYZJERSKA'];
const PETS = ['PATIVET', 'KAKADU'];
const ENGLISH = ['edoo'];
const CASH_MACHINE = ['PLANET CASH', 'KOZUCHOW FILIA'];
const CARD_SERVICE = ['OBSLUGE KARTY'];
const CAR_MECHANIC = ['EXPORT IMPORT LESZEK'];
const SALETNIK = ['Opłata za terapię', 'Opłata za psychoterapię'];
const PSYCHOTERAPIA = ['koleo', 'Wroclaw', 'WROCLAW', 'UBER'];

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
  CASH_MACHINE,
  CARD_SERVICE,
  CAR_MECHANIC,
  SALETNIK,
  PSYCHOTERAPIA
};

function isCostMatch(value: string, array: string[]): boolean {
  return array.some((str) => value.toLowerCase().includes(str.toLowerCase()));
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
      return !values.some((value) => row.Opis.toLowerCase().includes(value.toLowerCase()));
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
