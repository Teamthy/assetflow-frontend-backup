#!/usr/bin/env python3
"""
Reverse-engineer the import schema by testing different row formats.
The validator errors suggest:
- Some fields expect numbers but got NaN
- Some fields expect UUIDs
- Status enum is fixed: active|maintenance|disposed
"""

import json
import pathlib
import requests
import uuid
from datetime import datetime, timedelta
import tempfile
from openpyxl import Workbook


def create_test_workbook(headers, rows):
    """Create a test Excel workbook with the given headers and rows."""
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(row)
    
    # Save to temp file
    tmp = tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False)
    wb.save(tmp.name)
    return tmp.name


def test_import(file_path, token, api_base, desc):
    """Upload a file and return the result."""
    with open(file_path, 'rb') as f:
        files = {'file': (pathlib.Path(file_path).name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        r = requests.post(
            f'{api_base}/assets/import',
            files=files,
            headers={'Authorization': f'Bearer {token}'},
            timeout=120
        )
    
    status = r.status_code
    result = r.json()
    data = result.get('data', result)
    inserted = data.get('insertedCount', 0)
    failed = data.get('failedCount', 0)
    
    print(f'{desc}')
    print(f'  Status: {status}, Inserted: {inserted}, Failed: {failed}')
    if failed > 0 and data.get('failures'):
        msg = data['failures'][0].get('message', 'unknown error')
        print(f'  Error: {msg[:250]}')
    print()


# Setup
api = 'http://localhost:4000/api'
print('=== ASSET IMPORT SCHEMA REVERSE-ENGINEERING ===\n')

# Register a test org
reg = {
    'firstName': 'Import',
    'lastName': 'Test',
    'email': f'import-{uuid.uuid4().hex[:8]}@test.io',
    'password': 'ImportPass123!',
    'organizationName': f'ImportOrg {uuid.uuid4().hex[:4]}',
    'accountType': 'organization',
}
print(f'Registering: {reg["email"]}')
r = requests.post(f'{api}/auth/register', json=reg, timeout=20)
if r.status_code not in (200, 201):
    print(f'✗ Registration failed: {r.status_code}')
    print(r.text[:500])
    exit(1)

body = r.json()
data = body.get('data', body)
token = data.get('accessToken') or body.get('accessToken')
print(f'✓ Registered, token: {bool(token)}\n')

# Create a branch for testing
branch_data = {'name': f'Test Branch {uuid.uuid4().hex[:4]}', 'code': f'TB{uuid.uuid4().hex[:4].upper()}'}
r = requests.post(f'{api}/branches', json=branch_data, headers={'Authorization': f'Bearer {token}'}, timeout=10)
if r.status_code not in (200, 201):
    print(f'✗ Branch creation failed: {r.status_code}')
    print(r.text[:500])
    exit(1)
branch_body = r.json()
branch_data_resp = branch_body.get('data', branch_body)
branch_id = branch_data_resp.get('id')
print(f'✓ Created branch: {branch_id}\n')

# Test 1: Minimal required fields only
print('TEST 1: Minimal fields (name, assetTag, status, condition)')
headers = ['name', 'assetTag', 'status', 'condition']
rows = [
    ['Laptop 1', 'AST-001', 'active', 'good'],
    ['Laptop 2', 'AST-002', 'maintenance', 'fair'],
]
file_path = create_test_workbook(headers, rows)
status, result = test_import(file_path, token, api)
print(f'Status: {status}')
if result.get('success'):
    print(f'✓ inserted: {result["data"]["insertedCount"]}, failed: {result["data"]["failedCount"]}')
else:
    if result['data']['failures']:
        print(f'✗ Failure: {result["data"]["failures"][0]["message"][:200]}')
print()

# Test 2: Add numeric fields
print('TEST 2: Numeric fields (purchaseCost, expectedUsefulLifeMonths)')
headers = ['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'expectedUsefulLifeMonths']
rows = [
    ['Laptop 3', 'AST-003', 'active', 'good', 500000, 48],
    ['Laptop 4', 'AST-004', 'active', 'good', 450000, 36],
]
file_path = create_test_workbook(headers, rows)
status, result = test_import(file_path, token, api)
print(f'Status: {status}')
if result.get('success'):
    print(f'✓ inserted: {result["data"]["insertedCount"]}, failed: {result["data"]["failedCount"]}')
else:
    if result['data']['failures']:
        print(f'✗ Failure: {result["data"]["failures"][0]["message"][:200]}')
print()

# Test 3: Try with branchName as string vs branchId
print('TEST 3: Try branchName (string)')
headers = ['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'expectedUsefulLifeMonths', 'branchName']
rows = [
    ['Laptop 5', 'AST-005', 'active', 'good', 550000, 48, 'Test Branch'],
]
file_path = create_test_workbook(headers, rows)
status, result = test_import(file_path, token, api)
print(f'Status: {status}')
if result.get('success'):
    print(f'✓ inserted: {result["data"]["insertedCount"]}, failed: {result["data"]["failedCount"]}')
else:
    if result['data']['failures']:
        print(f'✗ Failure: {result["data"]["failures"][0]["message"][:200]}')
print()

# Test 4: Try with branchId (UUID)
print(f'TEST 4: Try branchId as UUID ({branch_id[:8]}...)')
headers = ['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'expectedUsefulLifeMonths', 'branchId']
rows = [
    ['Laptop 6', 'AST-006', 'active', 'good', 600000, 48, branch_id],
]
file_path = create_test_workbook(headers, rows)
status, result = test_import(file_path, token, api)
print(f'Status: {status}')
if result.get('success'):
    print(f'✓ inserted: {result["data"]["insertedCount"]}, failed: {result["data"]["failedCount"]}')
else:
    if result['data']['failures']:
        print(f'✗ Failure: {result["data"]["failures"][0]["message"][:200]}')
print()

# Test 5: Try assigneeEmail vs assigneeId
print('TEST 5: Try assigneeEmail (string)')
headers = ['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'expectedUsefulLifeMonths', 'branchId', 'assigneeEmail']
rows = [
    ['Laptop 7', 'AST-007', 'active', 'good', 650000, 48, branch_id, 'test@test.com'],
]
file_path = create_test_workbook(headers, rows)
status, result = test_import(file_path, token, api)
print(f'Status: {status}')
if result.get('success'):
    print(f'✓ inserted: {result["data"]["insertedCount"]}, failed: {result["data"]["failedCount"]}')
else:
    if result['data']['failures']:
        print(f'✗ Failure: {result["data"]["failures"][0]["message"][:200]}')
print()

# Test 6: Try with dates
print('TEST 6: Add purchaseDate and residualValue')
headers = ['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'purchaseDate', 'expectedUsefulLifeMonths', 'residualValue', 'branchId']
rows = [
    ['Laptop 8', 'AST-008', 'active', 'good', 700000, '2024-01-15', 48, 100000, branch_id],
]
file_path = create_test_workbook(headers, rows)
status, result = test_import(file_path, token, api)
print(f'Status: {status}')
if result.get('success'):
    print(f'✓ inserted: {result["data"]["insertedCount"]}, failed: {result["data"]["failedCount"]}')
else:
    if result['data']['failures']:
        print(f'✗ Failure: {result["data"]["failures"][0]["message"][:200]}')
print()

print('=== SCHEMA DISCOVERY COMPLETE ===')
