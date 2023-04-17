import { IWorkBook, utils, readFile } from 'ts-xlsx';

const file:IWorkBook = readFile('data/source.xlsx');

const data:ExcelRow[] = utils.sheet_to_json(file.Sheets['ExcelExportFile']);

interface ExcelRow {
    Opis: string,
    Kwota: string
};

const ALLEGRO = ['Allegro']
const MARKETS = ['DINO', 'NETTO', 'BIEDRONKA','CARREFOUR'];
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
const CLOTHS = ['smyk','SECRET', 'SINSAY', 'kappahl', 'MEDICINE', 'HOUSE'];
const CAR_SHOWER = ['WIKON','Myjnia'];
const FARM = ['ZIELONY ZAKATEK', 'OGRODNICZO'];
const SHOES = ['CCC'];
const COSMETICS = ['ROSSMANN'];
const EMPIK = ['EMPIK'];
const RESTAURANT = ['SLOW FOOD', 'Verde', 'EWA DA', 'STARA PIEKARNIA', 'MCDONALDS', 'TCHIBO', 'PIJALNIA KAWY I CZEKO', 'KUCHNIE SWIATA', 'HEBAN', 'Ohy'];
const MIEDZYZDROJE = ['MIEDZYZDROJE'];
const CINEMA = ['DOM KULTURY'];
const SPORT = ['MARTES'];
const HAIR_CUT = ['FRYZJERSKI','FRYZJERSKA'];
const PETS = ['PATIVET'];

const ALL = [ALLEGRO, MARKETS, PEPCO, PETROL, MEDICINE, DOCTORS, DENTISTRY, DIABETIC, TOOLS_SHOPS, 
    SMALL_SHOPS, GAMES, MEDIA, ORANGE, CLOTHS, CAR_SHOWER, FARM, SHOES, COSMETICS, EMPIK, RESTAURANT,
MIEDZYZDROJE, CINEMA, SPORT, HAIR_CUT, PETS].flat();

const countCost = (data:ExcelRow[], key:string):number => {
    return data.filter(item => {
        return item.Opis.includes(key);
    }).reduce((total:number, {Kwota}) => {
        const cost = Math.abs(Number(Kwota.replace(/\s/g,'')));
        return total + cost;
    }, 0);
}

const countAgregatedCost = (data:ExcelRow[], keys:string[]):number => {
    let agregatedCost:number = 0;
    keys.forEach(element => {
        agregatedCost += countCost(data, element);
    });
    return agregatedCost;
}

const printCost = (key:string, total:number) => {
    console.log(key + ' -> ' + total);
}

const findNotCategorizedCosts = () => {
    data.forEach(cost => {
        const isUnknownCategory = !ALL.some(substring=>cost.Opis.includes(substring));
        if(isUnknownCategory) {
            console.log(cost);
        }
    });
}

findNotCategorizedCosts();

const allegroCost = countAgregatedCost(data, ALLEGRO);
const marketCost = countAgregatedCost(data, MARKETS)
const pepcoCost = countAgregatedCost(data, PEPCO);
const petrolCost = countAgregatedCost(data, PETROL);
const medicineCost = countAgregatedCost(data, MEDICINE);
const doctorCost = countAgregatedCost(data, DOCTORS);
const stomatologiaCost = countAgregatedCost(data, DENTISTRY);
const diabeticCost = countAgregatedCost(data, DIABETIC);
const mrowkaBricoCost = countAgregatedCost(data, TOOLS_SHOPS);   
const smallShopsCost = countAgregatedCost(data, SMALL_SHOPS);
const gamesCost = countAgregatedCost(data, GAMES);
const mediaCost = countAgregatedCost(data, MEDIA);
const orangeFlex = countAgregatedCost(data, ORANGE);
const clothsCost = countAgregatedCost(data, CLOTHS);
const myjniaCost = countAgregatedCost(data, CAR_SHOWER);
const farmaCost = countAgregatedCost(data, FARM);
const butyCost = countAgregatedCost(data, SHOES);
const kosmetyki = countAgregatedCost(data, COSMETICS);
const empik = countAgregatedCost(data, EMPIK);
const restaurant = countAgregatedCost(data, RESTAURANT);
const miedzyzdroje = countAgregatedCost(data, MIEDZYZDROJE);
const kino = countAgregatedCost(data, CINEMA);
const sport = countAgregatedCost(data, SPORT);
const fryzjer = countAgregatedCost(data, HAIR_CUT);
const pets = countAgregatedCost(data, PETS);

printCost('Allegro', allegroCost);
printCost('Markets', marketCost);
printCost('Pepco', pepcoCost);
printCost('Petrol', petrolCost);
printCost('Medicines', medicineCost);
printCost('Lekarze', doctorCost);
printCost('Stomatologia', stomatologiaCost);
printCost('cukrzyca', diabeticCost);
printCost('Mrowka/Brico', mrowkaBricoCost);
printCost('SmallShopsCost', smallShopsCost);
printCost('Games', gamesCost);
printCost('Orange', orangeFlex);
printCost('Cloths', clothsCost);
printCost('Kosmetyki', kosmetyki);
printCost('Myjnia', myjniaCost);
printCost('Farma', farmaCost);
printCost('Buty', butyCost);
printCost('Media', mediaCost);
printCost('Empik', empik);
printCost('Restauracja', restaurant);
printCost('Miedzyzdroje', miedzyzdroje);
printCost('Kino', kino);
printCost('Sport', sport);
printCost('Fryzjer', fryzjer);
printCost('Pets', pets);