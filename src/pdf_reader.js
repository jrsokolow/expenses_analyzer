import xlsx from 'xlsx';

const file = xlsx.readFile('data/source.xlsx');

const data = xlsx.utils.sheet_to_json(file.Sheets['ExcelExportFile']);

const countCost = (data, key) => {
    return data.filter(item => item.Opis.includes(key)).reduce((total, item) => total + item.Kwota, 0);
}

const countAgregatedCost = (data, keys) => {
    let agregatedCost = 0;
    keys.forEach(element => {
        agregatedCost += countCost(data, element);
    });
    return agregatedCost;
}

const printCost = (key, total) => {
    console.log(key + ' -> ' + total);
}

const allegroCost = countCost(data, 'Allegro');
const marketCost = countAgregatedCost(data, ['DINO', 'NETTO', 'BIEDRONKA'])
const pepcoCost = countCost(data, 'PEPCO');
const petrolCost = countAgregatedCost(data, ['STACJA PALIW', 'LOTOS', 'ORLEN']);
const medicineCost = countCost(data, 'APTEKA');
const diabeticCost = countCost(data, 'diabetyk24');
const mrowkaBricoCost = countAgregatedCost(data, ['MROWKA', 'GRANAT']);   
const smallShopsCost = countAgregatedCost(data, ['ZABKA', 'Zygula', 'Piekarnia']);
const gamesCost = countAgregatedCost(data, ['LONDON', 'GOGcomECOM', 'Google Play', 'Steam']);
const mediaCost = countAgregatedCost(data, ['Disney', 'YouTubePremium']);
const orangeFlex = countCost(data, 'FLEX');
const clothsCost = countCost(data, 'smyk');
const myjniaCost = countCost(data, 'MYJNIA');
const farmaCost = countAgregatedCost(data, ['ZIELONY ZAKATEK', 'OGRODNICZO']);
const butyCost = countCost(data, 'CCC');

printCost('Allegro', allegroCost);
printCost('Markets', marketCost);
printCost('Pepco', pepcoCost);
printCost('Petrol', petrolCost);
printCost('Medicines', medicineCost);
printCost('diabetyk24', diabeticCost);
printCost('Mrowka/Brico', mrowkaBricoCost);
printCost('SmallShopsCost', smallShopsCost);
printCost('Games', gamesCost);
printCost('Orange', orangeFlex);
printCost('Cloths', clothsCost);
printCost('Myjnia', myjniaCost);
printCost('Farma', farmaCost);
printCost('Buty', butyCost);
printCost('Media', mediaCost);