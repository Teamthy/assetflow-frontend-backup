import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment
from datetime import datetime, timedelta

# Create workbook
wb = openpyxl.Workbook()
ws = wb.active
ws.title = 'Assets'

# Headers aligned with the corrected import schema (backend now handles empty UUIDs gracefully)
headers = [
    'name',
    'assetTag',
    'serialNumber',
    'purchaseCost',
    'purchaseDate',
    'status',
    'condition',
    'expectedUsefulLifeMonths',
    'residualValue',
    'branchId',
    'assignedTo',
    'hasFutureEconomicBenefit',
    'costCanBeReliablyMeasured',
]
ws.append(headers)

# Style header row
header_fill = PatternFill(start_color='4472C4', end_color='4472C4', fill_type='solid')
header_font = Font(bold=True, color='FFFFFF')
for cell in ws[1]:
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal='center', vertical='center')

# Sample data aligned with the backend validator
categories = ['Laptop', 'Desktop', 'Vehicle', 'Furniture', 'Equipment']
manufacturers = ['Dell', 'HP', 'Toyota', 'IKEA', 'Cisco']
models = ['Latitude 5440', 'ProDesk 600', 'Hilux', 'Ergo Chair', 'Catalyst 9300']
conditions = ['good', 'fair', 'poor']
statuses = ['active', 'maintenance', 'disposed']
branches = ['Lagos Head Office', 'Abuja Office', 'Kano Branch', 'Port Harcourt Branch']

# Add 30 assets
for i in range(1, 31):
    cat_idx = (i - 1) % len(categories)
    man_idx = (i - 1) % len(manufacturers)
    model_idx = (i - 1) % len(models)
    cond_idx = (i - 1) % len(conditions)
    status_idx = (i - 1) % len(statuses)
    branch_idx = (i - 1) % len(branches)

    asset_name = f'{categories[cat_idx]} - Unit {i:02d}'
    asset_tag = f'AST-{i:04d}'
    serial = f'SN{i:06d}'
    category = categories[cat_idx]
    manufacturer = manufacturers[man_idx]
    model = models[model_idx]
    status = statuses[status_idx]
    condition = conditions[cond_idx]
    cost = 50000 + (i * 5000)
    date = (datetime.now() - timedelta(days=i * 30)).strftime('%Y-%m-%d')
    life = 12 + (i % 36)
    residual = 10000 + (i * 1000)
    branch = branches[branch_idx]
    assignee = f'staff{i % 5 + 1}@company.com'

    ws.append([
        asset_name,
        asset_tag,
        serial,
        category,
        manufacturer,
        model,
        status,
        condition,
        cost,
        date,
        life,
        residual,
        branch,
        assignee,
        True,
        True,
    ])

# Adjust column widths
for col, width in {
    'A': 25,
    'B': 12,
    'C': 12,
    'D': 12,
    'E': 15,
    'F': 15,
    'G': 12,
    'H': 12,
    'I': 15,
    'J': 15,
    'K': 18,
    'L': 15,
    'M': 18,
    'N': 20,
    'O': 18,
    'P': 18,
}.items():
    ws.column_dimensions[col].width = width

# Save
wb.save('test-assets-30.xlsx')
print('✓ Generated test-assets-30.xlsx with 30 sample assets')
print('  File contains assets across 5 branches with realistic data')
print('  Use this file to test the asset import modal')
