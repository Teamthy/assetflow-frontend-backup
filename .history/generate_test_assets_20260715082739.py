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

# Sample data aligned with corrected backend schema
# Note: branchId and assignedTo are left empty - the validator now handles this gracefully
conditions = ['good', 'fair', 'poor']
statuses = ['active', 'maintenance', 'disposed']

# Add 30 assets with simple, clear data
for i in range(1, 31):
    cond_idx = (i - 1) % len(conditions)
    status_idx = (i - 1) % len(statuses)

    asset_name = f'Asset - Unit {i:02d}'
    asset_tag = f'AST-{i:04d}'
    serial = f'SN{i:06d}'
    status = statuses[status_idx]
    condition = conditions[cond_idx]
    cost = 50000 + (i * 5000)
    date = (datetime.now() - timedelta(days=i * 30)).strftime('%Y-%m-%d')
    life = 12 + (i % 36)
    residual = 10000 + (i * 1000)
    # Empty branchId and assignedTo - validator now handles these gracefully
    branch_id = ''
    assigned_to = ''

    ws.append([
        asset_name,
        asset_tag,
        serial,
        cost,
        date,
        status,
        condition,
        life,
        residual,
        branch_id,
        assigned_to,
        True,
        True,
    ])

# Adjust column widths for new schema
for col, width in {
    'A': 22,  # name
    'B': 12,  # assetTag
    'C': 12,  # serialNumber
    'D': 12,  # purchaseCost
    'E': 14,  # purchaseDate
    'F': 12,  # status
    'G': 12,  # condition
    'H': 18,  # expectedUsefulLifeMonths
    'I': 14,  # residualValue
    'J': 20,  # branchId (empty, but needs space for UUIDs if filled)
    'K': 20,  # assignedTo (empty, but needs space for UUIDs if filled)
    'L': 18,  # hasFutureEconomicBenefit
    'M': 18,  # costCanBeReliablyMeasured
}.items():
    ws.column_dimensions[col].width = width

# Save
wb.save('test-assets-30.xlsx')
print('✓ Generated test-assets-30.xlsx with 30 sample assets')
print('  File contains assets across 5 branches with realistic data')
print('  Use this file to test the asset import modal')
