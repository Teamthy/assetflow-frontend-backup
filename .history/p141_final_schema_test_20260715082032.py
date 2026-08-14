#!/usr/bin/env python3
"""
Final schema discovery with correct API response handling.
"""
import json
import pathlib
import requests
import uuid
import tempfile
from openpyxl import Workbook

api = 'http://localhost:4000/api'

print('=== ASSET IMPORT SCHEMA DISCOVERY (FINAL) ===\n')

# Register
reg = {
    'firstName': 'Import',
    'lastName': 'Test',
    'email': f'import-{uuid.uuid4().hex[:8]}@test.io',
    'password': 'Test1234!',
    'organizationName': f'ImportOrg{uuid.uuid4().hex[:4]}',
    'accountType': 'organization',
}
print(f'Registering: {reg["email"]}')
r = requests.post(f'{api}/auth/register', json=reg, timeout=10)
body = r.json()
token = body.get('accessToken')  # Top level
print(f'✓ Registered, token: {token[:20]}...\n')

# Create branch
branch_req = {'name': 'Test Branch', 'code': f'TB{uuid.uuid4().hex[:4].upper()}'}
r = requests.post(f'{api}/branches', json=branch_req, headers={'Authorization': f'Bearer {token}'}, timeout=10)
branch_data = r.json().get('data', r.json())
branch_id = branch_data.get('id')
print(f'✓ Created branch: {branch_id[:8]}...\n')

# Test function
def test(desc, headers, row_data):
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    ws.append(row_data)
    tmp = tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False)
    wb.save(tmp.name)
    
    with open(tmp.name, 'rb') as f:
        files = {'file': (pathlib.Path(tmp.name).name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        r = requests.post(f'{api}/assets/import', files=files, headers={'Authorization': f'Bearer {token}'}, timeout=120)
    
    result = r.json()
    data = result.get('data', result)
    ins = data.get('insertedCount', 0)
    fail = data.get('failedCount', 0)
    
    status_str = f'✓ inserted={ins}' if ins > 0 else f'✗ failed={fail}'
    print(f'{desc:50s} {status_str}', end='')
    
    if fail > 0 and data.get('failures'):
        msg = data['failures'][0].get('message', '')[:100]
        print(f' | {msg}')
    else:
        print()
    
    return ins > 0

# Run tests
print('Testing field combinations:\n')

tests = [
    ('name + assetTag only', 
     ['name', 'assetTag'], ['Laptop', 'AST-001']),
    
    ('+ status', 
     ['name', 'assetTag', 'status'], ['Laptop', 'AST-001', 'active']),
    
    ('+ condition', 
     ['name', 'assetTag', 'status', 'condition'], ['Laptop', 'AST-001', 'active', 'good']),
    
    ('+ purchaseCost (50000)',
     ['name', 'assetTag', 'status', 'condition', 'purchaseCost'], ['Laptop', 'AST-001', 'active', 'good', 50000]),
    
    ('+ residualValue', 
     ['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'residualValue'], ['Laptop', 'AST-001', 'active', 'good', 50000, 5000]),
    
    ('+ purchaseDate', 
     ['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'residualValue', 'purchaseDate'], 
     ['Laptop', 'AST-001', 'active', 'good', 50000, 5000, '2024-01-15']),
    
    ('+ expectedUsefulLifeMonths', 
     ['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'residualValue', 'purchaseDate', 'expectedUsefulLifeMonths'],
     ['Laptop', 'AST-001', 'active', 'good', 50000, 5000, '2024-01-15', 48]),
    
    ('+ branchId',
     ['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'residualValue', 'purchaseDate', 'expectedUsefulLifeMonths', 'branchId'],
     ['Laptop', 'AST-001', 'active', 'good', 50000, 5000, '2024-01-15', 48, branch_id]),
    
    ('+ hasFutureEconomicBenefit',
     ['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'residualValue', 'purchaseDate', 'expectedUsefulLifeMonths', 'branchId', 'hasFutureEconomicBenefit'],
     ['Laptop', 'AST-001', 'active', 'good', 50000, 5000, '2024-01-15', 48, branch_id, True]),
    
    ('+ costCanBeReliablyMeasured',
     ['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'residualValue', 'purchaseDate', 'expectedUsefulLifeMonths', 'branchId', 'hasFutureEconomicBenefit', 'costCanBeReliablyMeasured'],
     ['Laptop', 'AST-001', 'active', 'good', 50000, 5000, '2024-01-15', 48, branch_id, True, True]),
]

success = False
for i, (desc, headers, row) in enumerate(tests, 1):
    if test(f'TEST {i}: {desc}', headers, row):
        print(f'\n✓✓✓ SUCCESS! Working schema found at test {i}')
        print(f'Required fields: {", ".join(headers)}')
        success = True
        break

if not success:
    print('\n✗ No working schema found yet')

print('\n=== COMPLETE ===')
