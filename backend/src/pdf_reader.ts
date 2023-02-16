import { IWorkBook, utils, readFile } from 'ts-xlsx';

const file:IWorkBook = readFile('data/source.xlsx');

const data:ExcelRow[] = utils.sheet_to_json(file.Sheets['ExcelExportFile']);

interface ExcelRow {
    Opis: string,
    Kwota: number
};

const countCost = (data:ExcelRow[], key:string):number => {
    return data.filter(item => {
        return item.Opis.includes(key);
    }).reduce((total:number, item:ExcelRow) => total + item.Kwota, 0);
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
const stomatologiaCost = countCost(data, 'STOMATOLOGIA');
const diabeticCost = countAgregatedCost(data, ['diabetyk24', 'FRANCISCO']);
const mrowkaBricoCost = countAgregatedCost(data, ['MROWKA', 'GRANAT']);   
const smallShopsCost = countAgregatedCost(data, ['ZABKA', 'Zygula', 'Piekarnia', 'WIELOBRANZOWY', 'DELIKATESY MIESNE', 'ROGAL', 'FIVE O CLOCK']);
const gamesCost = countAgregatedCost(data, ['LONDON', 'GOGcomECOM', 'Google Play', 'Steam', 'STEAM', 'PlayStation']);
const mediaCost = countAgregatedCost(data, ['Disney', 'YouTubePremium']);
const orangeFlex = countCost(data, 'FLEX');
const clothsCost = countAgregatedCost(data, ['smyk','SECRET', 'SINSAY', 'kappahl']);
const myjniaCost = countCost(data, 'MYJNIA');
const farmaCost = countAgregatedCost(data, ['ZIELONY ZAKATEK', 'OGRODNICZO']);
const butyCost = countCost(data, 'CCC');
const kosmetyki = countCost(data, 'ROSSMANN');
const empik = countCost(data, 'EMPIK');
const restaurant = countAgregatedCost(data, ['SLOW FOOD', 'VERDE']);

printCost('Allegro', allegroCost);
printCost('Markets', marketCost);
printCost('Pepco', pepcoCost);
printCost('Petrol', petrolCost);
printCost('Medicines', medicineCost);
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