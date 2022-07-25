import xlsx from 'xlsx';

const file = xlsx.readFile('../data/source.xlsx');

const data = xlsx.utils.sheet_to_json(file.Sheets['ExcelExportFile']);

const countCost = (data, key) => {
    return data.filter(item => item.Opis.includes(key)).reduce((total, item) => total + item.Kwota, 0);
}

const printCost = (key, total) => {
    console.log(key + ' -> ' + total);
}

const allegroCost = countCost(data, 'Allegro');
const dinoCost = countCost(data, 'DINO');
const nettoCost = countCost(data, 'NETTO');
const biedronkaCost = countCost(data, 'BIEDRONKA');
const pepcoCost = countCost(data, 'PEPCO');
const petrolCost = countCost(data, 'STACJA PALIW');
const medicineCost = countCost(data, 'APTEKA');
const diabeticCost = countCost(data, 'diabetyk24');
   
printCost('Allegro', allegroCost);
printCost('Dino', dinoCost);
printCost('Netto', nettoCost);
printCost('Pepco', pepcoCost);
printCost('Biedronka', biedronkaCost);
printCost('Petrol', petrolCost);
printCost('Medicines', medicineCost);
printCost('diabetyk24', diabeticCost);



