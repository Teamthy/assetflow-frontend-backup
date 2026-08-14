const XLSX = require('xlsx');
const fs = require('fs');

// Create workbook and worksheet
const ws_data = [
  ['Asset Name', 'Asset Tag', 'Serial Number', 'Category', 'Purchase Cost', 'Purchase Date', 'Branch', 'Assigned To', 'Condition', 'Useful Life (months)'],
  ['Machinery - Unit 01', 'AST-0001', 'SN000001', 'Machinery', 55000, '15/06/2024', 'HQ', 'staff1@company.com', 'New', 12],
  ['Vehicles - Unit 02', 'AST-0002', 'SN000002', 'Vehicles', 60000, '15/05/2024', 'Lagos', 'staff2@company.com', 'Good', 13],
  ['Furniture - Unit 03', 'AST-0003', 'SN000003', 'Furniture', 65000, '15/04/2024', 'Abuja', 'staff3@company.com', 'Fair', 14],
  ['Equipment - Unit 04', 'AST-0004', 'SN000004', 'Equipment', 70000, '15/03/2024', 'Kano', 'staff4@company.com', 'Poor', 15],
  ['Technology - Unit 05', 'AST-0005', 'SN000005', 'Technology', 75000, '15/02/2024', 'Port Harcourt', 'staff5@company.com', 'New', 16],
  ['Tools - Unit 06', 'AST-0006', 'SN000006', 'Tools', 80000, '16/01/2024', 'HQ', 'staff1@company.com', 'Good', 17],
  ['Building - Unit 07', 'AST-0007', 'SN000007', 'Building', 85000, '17/12/2023', 'Lagos', 'staff2@company.com', 'Fair', 18],
  ['Fixtures - Unit 08', 'AST-0008', 'SN000008', 'Fixtures', 90000, '18/11/2023', 'Abuja', 'staff3@company.com', 'Poor', 19],
  ['Machinery - Unit 09', 'AST-0009', 'SN000009', 'Machinery', 95000, '19/10/2023', 'Kano', 'staff4@company.com', 'New', 20],
  ['Vehicles - Unit 10', 'AST-0010', 'SN000010', 'Vehicles', 100000, '20/09/2023', 'Port Harcourt', 'staff5@company.com', 'Good', 21],
  ['Furniture - Unit 11', 'AST-0011', 'SN000011', 'Furniture', 105000, '21/08/2023', 'HQ', 'staff1@company.com', 'Fair', 22],
  ['Equipment - Unit 12', 'AST-0012', 'SN000012', 'Equipment', 110000, '22/07/2023', 'Lagos', 'staff2@company.com', 'Poor', 23],
  ['Technology - Unit 13', 'AST-0013', 'SN000013', 'Technology', 115000, '23/06/2023', 'Abuja', 'staff3@company.com', 'New', 24],
  ['Tools - Unit 14', 'AST-0014', 'SN000014', 'Tools', 120000, '24/05/2023', 'Kano', 'staff4@company.com', 'Good', 25],
  ['Building - Unit 15', 'AST-0015', 'SN000015', 'Building', 125000, '25/04/2023', 'Port Harcourt', 'staff5@company.com', 'Fair', 26],
  ['Fixtures - Unit 16', 'AST-0016', 'SN000016', 'Fixtures', 130000, '26/03/2023', 'HQ', 'staff1@company.com', 'Poor', 27],
  ['Machinery - Unit 17', 'AST-0017', 'SN000017', 'Machinery', 135000, '27/02/2023', 'Lagos', 'staff2@company.com', 'New', 28],
  ['Vehicles - Unit 18', 'AST-0018', 'SN000018', 'Vehicles', 140000, '28/01/2023', 'Abuja', 'staff3@company.com', 'Good', 29],
  ['Furniture - Unit 19', 'AST-0019', 'SN000019', 'Furniture', 145000, '01/01/2023', 'Kano', 'staff4@company.com', 'Fair', 30],
  ['Equipment - Unit 20', 'AST-0020', 'SN000020', 'Equipment', 150000, '02/12/2022', 'Port Harcourt', 'staff5@company.com', 'Poor', 31],
  ['Technology - Unit 21', 'AST-0021', 'SN000021', 'Technology', 155000, '03/11/2022', 'HQ', 'staff1@company.com', 'New', 32],
  ['Tools - Unit 22', 'AST-0022', 'SN000022', 'Tools', 160000, '04/10/2022', 'Lagos', 'staff2@company.com', 'Good', 33],
  ['Building - Unit 23', 'AST-0023', 'SN000023', 'Building', 165000, '05/09/2022', 'Abuja', 'staff3@company.com', 'Fair', 34],
  ['Fixtures - Unit 24', 'AST-0024', 'SN000024', 'Fixtures', 170000, '06/08/2022', 'Kano', 'staff4@company.com', 'Poor', 35],
  ['Machinery - Unit 25', 'AST-0025', 'SN000025', 'Machinery', 175000, '07/07/2022', 'Port Harcourt', 'staff5@company.com', 'New', 36],
  ['Vehicles - Unit 26', 'AST-0026', 'SN000026', 'Vehicles', 180000, '08/06/2022', 'HQ', 'staff1@company.com', 'Good', 37],
  ['Furniture - Unit 27', 'AST-0027', 'SN000027', 'Furniture', 185000, '09/05/2022', 'Lagos', 'staff2@company.com', 'Fair', 38],
  ['Equipment - Unit 28', 'AST-0028', 'SN000028', 'Equipment', 190000, '10/04/2022', 'Abuja', 'staff3@company.com', 'Poor', 39],
  ['Technology - Unit 29', 'AST-0029', 'SN000029', 'Technology', 195000, '11/03/2022', 'Kano', 'staff4@company.com', 'New', 40],
  ['Tools - Unit 30', 'AST-0030', 'SN000030', 'Tools', 200000, '12/02/2022', 'Port Harcourt', 'staff5@company.com', 'Good', 48],
];

const ws = XLSX.utils.aoa_to_sheet(ws_data);

// Set column widths
ws['!cols'] = [
  { wch: 25 },
  { wch: 12 },
  { wch: 12 },
  { wch: 12 },
  { wch: 15 },
  { wch: 15 },
  { wch: 15 },
  { wch: 20 },
  { wch: 12 },
  { wch: 18 },
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Assets');

XLSX.writeFile(wb, 'test-assets-30.xlsx');
console.log('✓ Generated test-assets-30.xlsx with 30 sample assets');
console.log('  File contains assets across 5 branches with realistic data');
console.log('  Use this file to test the asset import modal');
