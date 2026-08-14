#!/usr/bin/env python3
"""
Test if the backend is using positional column mapping or name-based mapping.
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
    
    print(f'{test_desc}')
    print(f'  Headers: {", ".join(headers[:5])}...' if len(headers) > 5 else f'  Headers: {", ".join(headers)}')
    
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
    
    print(f'  → inserted={inserted}, failed={failed}', end='')
    if inserted > 0:
        print(' ✓')
        return True
    elif failed > 0 and data.get('failures'):
        msg = data['failures'][0].get('message', 'unknown')[:150]
        print(f'\n    {msg}')
    else:
        print()
    return False

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

# Create branch and user
branch_data = {'name': f'Test Branch', 'code': 'TB'}
r = requests.post(f'{api}/branches', json=branch_data, headers={'Authorization': f'Bearer {token}'}, timeout=10)
branch_body = r.json()
branch_data_resp = branch_body.get('data', branch_body)
branch_id = branch_data_resp.get('id')

# Get user info to use their ID (optional, skip if not available)
user_id = None
try:
    r = requests.get(f'{api}/auth/me', headers={'Authorization': f'Bearer {token}'}, timeout=10)
    if r.status_code == 200:
        me_body = r.json()
        me_data = me_body.get('data', me_body)
        user_id = me_data.get('id')
except:
    pass

print(f'Setup: token={bool(token)}, branch_id={branch_id[:8] if branch_id else "?"}..., user_id={user_id[:8] if user_id else "?"}...\n')
print('=== TESTING FIELD ORDER & SPECIAL IDs ===\n')

# Maybe the backend expects id/uuid field first?
tests = [
    # Try with a UUID as first column (id?)
    (['id', 'name', 'assetTag', 'status', 'condition', 'purchaseCost', 'expectedUsefulLifeMonths'],
     [str(uuid.uuid4()), 'Laptop1', 'AST-001', 'active', 'good', 500000, 48],
     'With id (UUID) first'),
    
    # Try without purchaseCost
    (['name', 'assetTag', 'status', 'condition', 'expectedUsefulLifeMonths'],
     ['Laptop2', 'AST-002', 'active', 'good', 48],
     'Without purchaseCost'),
    
    # Try with purchaseDate but not purchaseCost
    (['name', 'assetTag', 'status', 'condition', 'purchaseDate', 'expectedUsefulLifeMonths'],
     ['Laptop3', 'AST-003', 'active', 'good', '2024-01-15', 48],
     'With purchaseDate instead of purchaseCost'),
    
    # Try with numeric purchaseDate (timestamp?)
    (['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'purchaseDate', 'expectedUsefulLifeMonths'],
     ['Laptop4', 'AST-004', 'active', 'good', 500000, 1705276800, 48],  # Unix timestamp for 2024-01-15
     'With purchaseDate as Unix timestamp'),
    
    # Maybe the NaN is coming from residualValue?
    (['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'residualValue', 'expectedUsefulLifeMonths'],
     ['Laptop5', 'AST-005', 'active', 'good', 500000, 100000, 48],
     'With residualValue instead of purchaseDate'),
    
    # Or maybe they all need to be there?
    (['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'residualValue', 'purchaseDate', 'expectedUsefulLifeMonths'],
     ['Laptop6', 'AST-006', 'active', 'good', 500000, 100000, '2024-01-15', 48],
     'All numeric/date fields'),
    
    # With branchId as actual UUID
    (['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'residualValue', 'purchaseDate', 'expectedUsefulLifeMonths', 'branchId'],
     ['Laptop7', 'AST-007', 'active', 'good', 500000, 100000, '2024-01-15', 48, branch_id],
     'All fields + branchId'),
]

for headers, row, desc in tests:
    if create_and_upload(headers, row, token, api, desc):
        print('\n✓ FOUND WORKING SCHEMA!')
        break

print('\n=== TEST COMPLETE ===')
