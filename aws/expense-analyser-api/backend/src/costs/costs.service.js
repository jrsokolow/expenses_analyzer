"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.getCosts = void 0;
var node_1 = require("read-excel-file/node");
var ALLEGRO = ['Allegro'];
var MARKETS = ['DINO', 'NETTO', 'BIEDRONKA', 'CARREFOUR'];
var PEPCO = ['PEPCO'];
var PETROL = ['STACJA PALIW', 'LOTOS', 'ORLEN', 'CIRCLE', 'NOWA SOL MOL'];
var MEDICINE = ['APTEKA'];
var DOCTORS = ['MEDICUS', 'ALDEMED'];
var DENTISTRY = ['STOMATOLOGIA'];
var DIABETIC = ['diabetyk24', 'FRANCISCO', 'Aero-Medika'];
var TOOLS_SHOPS = ['MROWKA', 'GRANAT'];
var SMALL_SHOPS = ['ZABKA', 'ZYGULA', 'Piekarnia', 'WIELOBRANZOWY', 'DELIKATESY MIESNE', 'ROGAL', 'FIVE', 'LEKS', 'ODiDO', 'PROACTIVE ZAJAC', 'MOTYKA', 'EMI S.C'];
var GAMES = ['LONDON', 'GOGcomECOM', 'Google Play', 'Steam', 'STEAM', 'PlayStation'];
var MEDIA = ['Disney', 'YouTubePremium', 'SKYSHOWTIME'];
var ORANGE = ['FLEX'];
var CLOTHS = ['smyk', 'SECRET', 'SINSAY', 'kappahl', 'MEDICINE', 'HOUSE', 'RESERVED', 'HM POL', 'GALANTERIA ODZIEZOWA'];
var CAR_SHOWER = ['WIKON', 'Myjnia'];
var FARM = ['ZIELONY ZAKATEK', 'OGRODNICZO', 'CENTRUM OGRODNICZE'];
var SHOES = ['CCC', 'e-cizemka', 'ccc.eu'];
var COSMETICS = ['ROSSMANN'];
var EMPIK = ['EMPIK'];
var RESTAURANT = ['KARMEL', 'SLOW FOOD', 'Verde', 'EWA DA', 'STARA PIEKARNIA', 'MCDONALDS', 'TCHIBO', 'PIJALNIA KAWY I CZEKO', 'KUCHNIE SWIATA', 'HEBAN', 'Ohy', 'KRATKA', 'Wafelek i Kulka', 'CIACHOO'];
var MIEDZYZDROJE = ['MIEDZYZDROJE'];
var CINEMA = ['DOM KULTURY'];
var SPORT = ['MARTES'];
var HAIR_CUT = ['FRYZJERSKI', 'FRYZJERSKA'];
var PETS = ['PATIVET', 'KAKADU'];
var ENGLISH = ['edoo'];
var CASH_MACHINE = ['PLANET CASH', 'KOZUCHOW FILIA'];
var CARD_SERVICE = ['OBSLUGE KARTY'];
var CAR_MECHANIC = ['EXPORT IMPORT LESZEK'];
// Definicja obiektu z mapowaniem stałych
var constantMap = {
    ALLEGRO: ALLEGRO,
    MARKETS: MARKETS,
    PEPCO: PEPCO,
    PETROL: PETROL,
    MEDICINE: MEDICINE,
    DOCTORS: DOCTORS,
    DENTISTRY: DENTISTRY,
    DIABETIC: DIABETIC,
    TOOLS_SHOPS: TOOLS_SHOPS,
    SMALL_SHOPS: SMALL_SHOPS,
    GAMES: GAMES,
    MEDIA: MEDIA,
    ORANGE: ORANGE,
    CLOTHS: CLOTHS,
    CAR_SHOWER: CAR_SHOWER,
    FARM: FARM,
    SHOES: SHOES,
    COSMETICS: COSMETICS,
    EMPIK: EMPIK,
    RESTAURANT: RESTAURANT,
    MIEDZYZDROJE: MIEDZYZDROJE,
    CINEMA: CINEMA,
    SPORT: SPORT,
    HAIR_CUT: HAIR_CUT,
    PETS: PETS,
    ENGLISH: ENGLISH,
    CASH_MACHINE: CASH_MACHINE,
    CARD_SERVICE: CARD_SERVICE,
    CAR_MECHANIC: CAR_MECHANIC
};
function isCostMatch(value, array) {
    return array.some(function (str) { return value.toLowerCase().includes(str.toLowerCase()); });
}
// Ścieżka do pliku XLSX (uwzględniająca lokalizację pliku)
var excelFilePath = 'dist/source.xlsx';
var getCosts = function () { return __awaiter(void 0, void 0, void 0, function () {
    var rows, jsonData_1, costs_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, node_1["default"])(excelFilePath)];
            case 1:
                rows = _a.sent();
                jsonData_1 = rows
                    .slice(1)
                    .map(function (row) {
                    var _a, _b;
                    return ({
                        Opis: ((_a = row[6]) === null || _a === void 0 ? void 0 : _a.toString()) || '',
                        Kwota: ((_b = row[3]) === null || _b === void 0 ? void 0 : _b.toString()) || ''
                    });
                });
                costs_1 = {};
                Object.keys(constantMap).forEach(function (constant) {
                    var constantArray = constantMap[constant];
                    var totalAmount = jsonData_1.reduce(function (sum, row) {
                        if (isCostMatch(row.Opis, constantArray)) {
                            return sum + parseFloat(row.Kwota.replace(',', '').replace('-', ''));
                        }
                        return sum;
                    }, 0);
                    costs_1[constant] = Math.floor(totalAmount);
                });
                return [2 /*return*/, costs_1];
            case 2:
                error_1 = _a.sent();
                console.error('Error:', error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getCosts = getCosts;
// app.get('/api/non-matching', async (req: Request, res: Response) => {
//   try {
//     const rows: Row[] = await readExcelFile(excelFilePath);
//     const jsonData: ExcelRow[] = rows
//       .slice(1)
//       .map((row: Row) => ({
//         Opis: row[6]?.toString() || '',
//         Kwota: row[3]?.toString() || '',
//       }));
//     const nonMatchingRows = jsonData.filter((row: ExcelRow) => {
//       const values = Object.values(constantMap).flat();
//       return !values.some((value) => row.Opis.toLowerCase().includes(value.toLowerCase()));
//     });
//     res.json(nonMatchingRows);
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });
// // Start serwera
// const port = 3000;
// app.listen(port, () => {
//   console.log(`Serwer nasłuchuje na porcie ${port}`);
// });
