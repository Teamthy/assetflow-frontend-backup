#!/usr/bin/env python3
"""
Test CSV import vs Excel import.
"""
import requests, uuid, csv, tempfile
from openpyxl import Workbook

api = 'http://localhost:4000/api'

# Register
reg = {
    'firstName': 'Test',
    'lastName': 'User',
    'email': f'test-{uuid.uuid4().hex[:8]}@test.io',
    'password': 'Test1234!',
    'organizationName': 'TestOrg',
    'accountType': 'organization'
}
r = requests.post(f'{api}/auth/register', json=reg, timeout=10)
token = r.json()['data']['accessToken']

# Create branch
r = requests.post(f'{api}/branches', json={'name': 'TB', 'code': 'TB'}, headers={'Authorization': f'Bearer {token}'}, timeout=10)
branch_id = r.json()['data']['id']

print(f'Branch: {branch_id[:8]}...\n')

# Test 1: Excel
print('TEST 1: Excel format')
wb = Workbook()
ws = wb.active
ws.append(['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'branchId'])
ws.append(['Laptop', 'AST-001', 'active', 'good', 50000, branch_id])
excel_file = tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False)
wb.save(excel_file.name)

with open(excel_file.name, 'rb') as f:
    files = {'file': (excel_file.name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    r = requests.post(f'{api}/assets/import', files=files, headers={'Authorization': f'Bearer {token}'}, timeout=120)

data = r.json().get('data', r.json())
print(f'  Inserted: {data.get("insertedCount", 0)}, Failed: {data.get("failedCount", 0)}')
if data.get('failures'):
    print(f'  Error: {data["failures"][0].get("message", "unknown")[:100]}')

# Test 2: CSV
print('\nTEST 2: CSV format')
csv_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='')
writer = csv.writer(csv_file)
writer.writerow(['name', 'assetTag', 'status', 'condition', 'purchaseCost', 'branchId'])
writer.writerow(['Laptop', 'AST-002', 'active', 'good', 50000, branch_id])
csv_file.close()

with open(csv_file.name, 'rb') as f:
    files = {'file': (csv_file.name, f, 'text/csv')}
    r = requests.post(f'{api}/assets/import', files=files, headers={'Authorization': f'Bearer {token}'}, timeout=120)

data = r.json().get('data', r.json())
print(f'  Inserted: {data.get("insertedCount", 0)}, Failed: {data.get("failedCount", 0)}')
if data.get('failures'):
    print(f'  Error: {data["failures"][0].get("message", "unknown")[:100]}')
