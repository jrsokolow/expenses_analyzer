import { IWorkBook, utils, readFile } from 'ts-xlsx';

const file:IWorkBook = readFile('data/source.xlsx');

const data:ExcelRow[] = utils.sheet_to_json(file.Sheets['ExcelExportFile']);

interface ExcelRow {
    Opis: string,
    Kwota: string
};

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

const allegroCost = countCost(data, 'Allegro');
const marketCost = countAgregatedCost(data, ['DINO', 'NETTO', 'BIEDRONKA','CARREFOUR'])
const pepcoCost = countCost(data, 'PEPCO');
const petrolCost = countAgregatedCost(data, ['STACJA PALIW', 'LOTOS', 'ORLEN', 'CIRCLE']);
const medicineCost = countCost(data, 'APTEKA');
const doctorCost = countAgregatedCost(data, ['MEDICUS']);
const stomatologiaCost = countCost(data, 'STOMATOLOGIA');
const diabeticCost = countAgregatedCost(data, ['diabetyk24', 'FRANCISCO', 'Aero-Medika']);
const mrowkaBricoCost = countAgregatedCost(data, ['MROWKA', 'GRANAT']);   
const smallShopsCost = countAgregatedCost(data, ['ZABKA', 'Zygula', 'Piekarnia', 'WIELOBRANZOWY', 'DELIKATESY MIESNE', 'ROGAL', 'FIVE O CLOCK', 'LEKS']);
const gamesCost = countAgregatedCost(data, ['LONDON', 'GOGcomECOM', 'Google Play', 'Steam', 'STEAM', 'PlayStation']);
const mediaCost = countAgregatedCost(data, ['Disney', 'YouTubePremium']);
const orangeFlex = countCost(data, 'FLEX');
const clothsCost = countAgregatedCost(data, ['smyk','SECRET', 'SINSAY', 'kappahl', 'MEDICINE', 'HOUSE']);
const myjniaCost = countAgregatedCost(data, ['MYJNIA','WIKON']);
const farmaCost = countAgregatedCost(data, ['ZIELONY ZAKATEK', 'OGRODNICZO']);
const butyCost = countCost(data, 'CCC');
const kosmetyki = countCost(data, 'ROSSMANN');
const empik = countCost(data, 'EMPIK');
const restaurant = countAgregatedCost(data, ['SLOW FOOD', 'VERDE', 'EWA DA', 'STARA PIEKARNIA', 'Donald', 'TCHIBO', 'PIJALNIA KAWY I CZEKO', 'KUCHNIE SWIATA', 'HEBAN', 'Ohy']);
const miedzyzdroje = countCost(data, 'MIEDZYZDROJE');
const kino = countCost(data, 'DOM KULTURY');
const sport = countCost(data, 'MARTES');
const fryzjer = countAgregatedCost(data, ['FRYZJERSKI','FRYZJERSKA']);
const pets = countCost(data, 'PATIVET');

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
printCost('miedzyzdroje', miedzyzdroje);
printCost('kino', kino);
printCost('sport', sport);
printCost('fryzjer', fryzjer);
printCost('pets', pets);