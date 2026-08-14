#!/usr/bin/env python3
"""Verify the asset import works with corrected schema."""
import json
import pathlib
import requests
import uuid

api = 'http://localhost:4000/api'
workbook = pathlib.Path('test-assets-30.xlsx')

# Register
print('📝 Registering test user...')
reg = {
    'firstName': 'Import',
    'lastName': 'Tester',
    'email': f'import-{uuid.uuid4().hex[:8]}@assetflow.test',
    'password': 'ImportPass123!',
    'organizationName': f'Import Org {uuid.uuid4().hex[:4]}',
    'accountType': 'organization',
}
r = requests.post(f'{api}/auth/register', json=reg, timeout=20)
if r.status_code not in (200, 201):
    print(f'❌ Registration failed: {r.status_code}')
    print(r.text[:500])
    exit(1)

body = r.json()
data = body.get('data', body)
token = data.get('accessToken') or body.get('accessToken')
print(f'✓ User registered: {reg["email"]}')

# Upload file
print(f'\n📤 Uploading {workbook.name}...')
with open(workbook, 'rb') as f:
    files = {'file': (workbook.name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    rr = requests.post(
        f'{api}/assets/import',
        files=files,
        headers={'Authorization': f'Bearer {token}'},
        timeout=120
    )

print(f'Status: {rr.status_code}')
result = rr.json().get('data', {})

inserted = result.get('insertedCount', 0)
failed = result.get('failedCount', 0)
total = inserted + failed

print(f'\n📊 Import Results:')
print(f'  ✓ Inserted: {inserted}/{total}')
print(f'  ❌ Failed: {failed}/{total}')

if failed > 0 and result.get('failures'):
    first_err = result['failures'][0]
    print(f'\n  First error (row {first_err.get("row")}):')
    print(f'    {first_err.get("message")}')

# Summary
print(f'\n{"=" * 50}')
if inserted == total:
    print(f'✅ SUCCESS: All {total} assets imported!')
elif inserted > 0:
    print(f'⚠️  PARTIAL: {inserted}/{total} assets imported')
else:
    print(f'❌ FAILED: No assets imported')
print(f'{"=" * 50}')
