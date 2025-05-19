import express, { Request, Response } from 'express';
import { Row } from 'read-excel-file';
import cors from 'cors';

import readExcelFile from 'read-excel-file/node';

const SMALL_SHOPS = ['DEALZ', 'bakaliowesmaki', 'SPAR', 'SKLEP RYBNY', 'Konotop PUH JOZEFOW RYSZARD', 'ZABKA', 'ZYGULA', 'Piekarnia', 'WIELOBRANZOWY', 'DELIKATESY MIESNE', 'ROGAL', 'FIVE', 'LEKS', 'ODiDO', 'PROACTIVE ZAJAC', 'MOTYKA', 'EMI S.C', 'CUKIERNIA SNICKERS', 'DANIEL FIJO', 'WEDLINDROBEX'];
const MARKETS = ['DINO', 'NETTO', 'BIEDRONKA', 'CARREFOUR', 'LIDL'];
const ALLEGRO = ['Allegro'];
const OLX = ['olx.pl'];
const PEPCO = ['PEPCO'];
const PETROL = ['STACJA PALIW', 'LOTOS', 'ORLEN', 'CIRCLE', 'NOWA SOL MOL'];
const MEDICINE = ['APTEKA'];
const DOCTORS = ['MEDICUS', 'ALDEMED', 'PERINATEA'];
const DENTISTRY = ['STOMATOLOGIA'];
const DIABETIC = ['diabetyk24', 'HEROKU', 'Aero-Medika', 'sugarcubes', 'equil'];
const TOOLS_SHOPS = ['MROWKA', 'GRANAT'];
const GAMES = ['GOGcomECOM', 'Steam', 'STEAM', 'PlayStation'];
const MEDIA = ['YouTubePremium', 'rp.pl', 'Netflix', 'NETFLIX', 'Google Play', 'help.max.com', 'YouTube', 'NBA League Pass', 'SKYSHOWTIME'];
const ORANGE = ['FLEX'];
const CLOTHS = ['HM', 'BERSHKA', 'STRADIVARIUS', 'zalando', 'miluba.pl', 'smyk', 'SECRET', 'SINSAY', 'kappahl', 'MEDICINE', 'HOUSE', 'RESERVED', 'HM POL', 'GALANTERIA ODZIEZOWA', 'HEBE', 'CROPP', 'vinted'];
const CAR_SHOWER = ['WIKON', 'Myjnia'];
const SHOES = ['Deichmann', 'nbsklep', 'CCC', 'e-cizemka', 'ccc.eu', 'eobuwie', 'zapato'];
const COSMETICS = ['ROSSMANN', 'SZALATA CHLEBOWSKA'];
const EMPIK = ['EMPIK'];
const RESTAURANT = ['DA GRASSO', 'BON BON', 'DOLCE VITA', 'PIZZERIA LUCA', 'STACJA CAFE', 'CAFE SAN-REMO', 'GRYCAN LODY OD POKOLEN', 'TOMASZ KUROS', 'ZIELONA GORA BW SPOLKA Z O.O.', 'MOCCA', 'KARMEL', 'SLOW FOOD', 'Verde', 'EWA DA', 'STARA PIEKARNIA', 'MCDONALDS', 'TCHIBO', 'PIJALNIA KAWY I CZEKO', 'KUCHNIE SWIATA', 'HEBAN', 'Ohy', 'KRATKA', 'Wafelek i Kulka', 'CIACHOO', 'PIERINO', 'CAFFETTERIA GELATERIA'];
const MIEDZYZDROJE = ['MIEDZYZDROJE'];
const CINEMA = ['DOM KULTURY', 'cinema-city'];
const SPORT = ['www.decathlon.pl', 'MARTES'];
const HAIR_CUT = ['FRYZJERSKI', 'FRYZJERSKA'];
const PETS = ['PATIVET', 'KAKADU'];
const ENGLISH = ['edoo'];
const CASH_MACHINE = ['PLANET CASH', 'KOZUCHOW FILIA', 'NOWA SOL BS NOWA SOL'];
const CARD_SERVICE = ['OBSLUGE KARTY'];
const CAR_MECHANIC = ['EXPORT IMPORT LESZEK'];
const SALETNIK = ['Opłata za terapię', 'Opłata za psychoterapię'];
const PSYCHOTERAPIA = ['koleo', 'Wroclaw', 'WROCLAW', 'UBER', 'SWIETEJ DOM PIELGRZYMA'];
const METLIFE = ['21754947'];
const FARM = ['ZIELONY ZAKATEK', 'OGRODNICZO', 'CENTRUM OGRODNICZE', 'ATO'];
const WAKACJE_JANOWICE = ['KOWARY', 'Kowary', 'Janowice', 'Mala Upa', 'Jelenia Gora', 'SZRENICA', 'szrenica', 'SZKLARSKA', 'KARPNIKI', ' STARA STAJNIA']

// Definicja obiektu z mapowaniem stałych
const constantMap: Record<string, string[]> = {
  SMALL_SHOPS,
  MARKETS,
  PEPCO,
  ALLEGRO,
  OLX,
  TOOLS_SHOPS,
  PETS,
  PETROL,
  CAR_SHOWER,
  ORANGE,
  MEDIA,
  DOCTORS,
  MEDICINE,
  DIABETIC,
  DENTISTRY,
  SALETNIK,
  CLOTHS,
  SPORT,
  SHOES,
  COSMETICS,
  HAIR_CUT,
  ENGLISH,
  CINEMA,
  EMPIK,
  GAMES,
  RESTAURANT,
  PSYCHOTERAPIA,
  CASH_MACHINE,
  CARD_SERVICE,
  CAR_MECHANIC,
  METLIFE,
  FARM,
  MIEDZYZDROJE,
  WAKACJE_JANOWICE
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
      console.log(constant);
      const constantArray = constantMap[constant];
      const totalAmount = jsonData.reduce(
        (sum: number, row: ExcelRow) => {
          if (isCostMatch(row.Opis, constantArray)) {
            console.log(row.Opis + ' ' + row.Kwota);
            return sum + parseFloat(row.Kwota.replace(',', '').replace('-', ''));
          }
          return sum;
        },
        0
      );
      costs[constant] = Math.floor(totalAmount);
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
