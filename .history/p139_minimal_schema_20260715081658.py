#!/usr/bin/env python3
"""
Test minimal field combinations systematically.
"""
import json
import pathlib
import requests
import uuid
import tempfile
from openpyxl import Workbook

def create_and_upload(headers, data_row, token, api_base, test_desc):
    """Create workbook and upload."""
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    ws.append(data_row)
    
    tmp = tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False)
    wb.save(tmp.name)
    
    print(f'\n{test_desc}')
    print(f'  Headers: {headers}')
    print(f'  Row:     {data_row}')
    
    with open(tmp.name, 'rb') as f:
        files = {'file': (pathlib.Path(tmp.name).name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        r = requests.post(
            f'{api_base}/assets/import',
            files=files,
            headers={'Authorization': f'Bearer {token}'},
            timeout=120
        )
    
    result = r.json()
    data = result.get('data', result)
    inserted = data.get('insertedCount', 0)
    failed = data.get('failedCount', 0)
    
    print(f'  Result: inserted={inserted}, failed={failed}')
    if failed > 0 and data.get('failures'):
        msg = data['failures'][0].get('message', 'unknown')
        print(f'  Error: {msg[:300]}')
    
    return inserted > 0

# Setup
api = 'http://localhost:4000/api'

# Register
reg = {
    'firstName': 'Import',
    'lastName': 'Test',
    'email': f'import-{uuid.uuid4().hex[:8]}@test.io',
    'password': 'ImportPass123!',
    'organizationName': f'ImportOrg {uuid.uuid4().hex[:4]}',
    'accountType': 'organization',
}
r = requests.post(f'{api}/auth/register', json=reg, timeout=20)
body = r.json()
data = body.get('data', body)
token = data.get('accessToken') or body.get('accessToken')

# Create branch
branch_data = {'name': f'Test Branch', 'code': 'TB'}
r = requests.post(f'{api}/branches', json=branch_data, headers={'Authorization': f'Bearer {token}'}, timeout=10)
branch_body = r.json()
branch_data_resp = branch_body.get('data', branch_body)
branch_id = branch_data_resp.get('id')

print(f'Setup complete: token={bool(token)}, branch_id={branch_id[:8]}...\n')
print('=== SYSTEMATIC FIELD TESTING ===')

# Test different field combinations
success = False

# Try just required-looking fields with all data types
tests = [
    (['name', 'assetTag'], ['Laptop', 'AST-001']),
    (['name', 'assetTag', 'status'], ['Laptop', 'AST-001', 'active']),
    (['name', 'assetTag', 'status', 'condition'], ['Laptop', 'AST-001', 'active', 'good']),
    (['name', 'assetTag', 'status', 'condition', 'purchaseCost'], ['Laptop', 'AST-001', 'active', 'good', 500000]),
    (['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'expectedUsefulLifeMonths'], ['Laptop', 'AST-001', 'active', 'good', 500000, 48]),
    (['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'expectedUsefulLifeMonths', 'branchId'], ['Laptop', 'AST-001', 'active', 'good', 500000, 48, branch_id]),
    (['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'purchaseDate', 'expectedUsefulLifeMonths', 'branchId'], ['Laptop', 'AST-001', 'active', 'good', 500000, '2024-01-15', 48, branch_id]),
]

for i, (headers, row) in enumerate(tests, 1):
    success = create_and_upload(headers, row, token, api, f'TEST {i}:')
    if success:
        print(f'  ✓✓✓ SUCCESS! Minimal schema found!')
        break

print('\n=== TEST COMPLETE ===')
