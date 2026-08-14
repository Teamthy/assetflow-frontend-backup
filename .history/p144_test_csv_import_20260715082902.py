#!/usr/bin/env python3
"""Test import with CSV to verify schema works."""
import csv
import requests
import uuid
import tempfile

api = 'http://localhost:4000/api'

# Register
print('📝 Registering test user...')
reg = {
    'firstName': 'CSV',
    'lastName': 'Tester',
    'email': f'csv-{uuid.uuid4().hex[:8]}@assetflow.test',
    'password': 'TestPass123!',
    'organizationName': f'CSV Org {uuid.uuid4().hex[:4]}',
    'accountType': 'organization',
}
r = requests.post(f'{api}/auth/register', json=reg, timeout=20)
body = r.json()
data = body.get('data', body)
token = data.get('accessToken')
print(f'✓ User registered: {reg["email"]}')

# Create CSV with empty string cells (not None)
print('\n📝 Creating CSV file...')
csv_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='')
writer = csv.writer(csv_file)
writer.writerow([
    'name', 'assetTag', 'serialNumber', 'purchaseCost', 'purchaseDate',
    'status', 'condition', 'expectedUsefulLifeMonths', 'residualValue',
    'branchId', 'assignedTo', 'hasFutureEconomicBenefit', 'costCanBeReliablyMeasured',
])

# Write 5 test rows with empty branchId/assignedTo
for i in range(1, 6):
    writer.writerow([
        f'Asset {i}',
        f'AST-{i:04d}',
        f'SN{i:06d}',
        50000 + (i * 5000),
        '2026-03-15',
        'active',
        'good',
        24,
        10000,
        '',  # Empty branchId
        '',  # Empty assignedTo
        'true',
        'true',
    ])

csv_file.close()
print(f'✓ CSV created: {csv_file.name}')

# Upload
print(f'\n📤 Uploading CSV...')
with open(csv_file.name, 'rb') as f:
    files = {'file': (f.name, f, 'text/csv')}
    rr = requests.post(
        f'{api}/assets/import',
        files=files,
        headers={'Authorization': f'Bearer {token}'},
        timeout=120
    )

result = rr.json().get('data', {})
inserted = result.get('insertedCount', 0)
failed = result.get('failedCount', 0)

print(f'Status: {rr.status_code}')
print(f'\n📊 Results:')
print(f'  ✓ Inserted: {inserted}')
print(f'  ❌ Failed: {failed}')

if failed > 0 and result.get('failures'):
    print(f'\n  First error:')
    err = result['failures'][0]
    print(f'    Row {err.get("row")}: {err.get("message")}')

print(f'\n{"=" * 50}')
if inserted == 5:
    print('✅ SUCCESS: CSV import works!')
else:
    print(f'⚠️  CSV import partially working: {inserted}/5')
