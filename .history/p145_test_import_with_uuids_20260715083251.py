#!/usr/bin/env python3
"""
Test asset import with proper UUID fields for branchId and assignedTo.
This verifies that the backend now accepts the corrected schema.
"""

import json
import urllib.request
import urllib.error
import uuid
import time
from pathlib import Path

API = 'http://localhost:4000/api'

def req(method, path, body=None, token=None):
    """Make HTTP request to API."""
    url = f'{API}{path}'
    data = json.dumps(body).encode() if body else None
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            raw = resp.read()
            try: 
                return resp.status, json.loads(raw)
            except: 
                return resp.status, raw.decode()
    except urllib.error.HTTPError as e:
        raw = e.read()
        try: 
            return e.code, json.loads(raw)
        except: 
            return e.code, raw.decode()

def upload_file(file_path, token):
    """Upload Excel file using multipart/form-data."""
    with open(file_path, 'rb') as f:
        file_data = f.read()
    
    boundary = str(uuid.uuid4())
    body = b''
    body += f'--{boundary}\r\n'.encode()
    body += b'Content-Disposition: form-data; name="file"; filename="test-assets.xlsx"\r\n'
    body += b'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n'
    body += file_data
    body += f'\r\n--{boundary}--\r\n'.encode()
    
    url = f'{API}/assets/import'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': f'multipart/form-data; boundary={boundary}',
        'Accept': 'application/json'
    }
    r = urllib.request.Request(url, data=body, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(r, timeout=120) as resp:
            raw = resp.read()
            try:
                return resp.status, json.loads(raw)
            except:
                return resp.status, raw.decode()
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except:
            return e.code, raw.decode()

print('=== ASSET IMPORT TEST WITH UUIDS ===\n')

ts = str(int(time.time()))[-6:]

# 1. Register test user
print('1. Registering test user...')
reg = {
    'firstName': 'Import',
    'lastName': f'Test{ts}',
    'email': f'import-test-{ts}@assetflow.test',
    'password': 'ImportTest123!',
    'organizationName': f'Import Test Org {ts}',
    'accountType': 'organization'
}
s, b = req('POST', '/auth/register', reg)
print(f'   Status: {s}')

if s not in (200, 201):
    print(f'   ✗ Registration failed: {b}')
    exit(1)

data = b.get('data', b) if isinstance(b, dict) else {}
token = data.get('accessToken') or b.get('accessToken')
print(f'   ✓ Token: {bool(token)}')

# 2. Create branches (we need their IDs)
print('\n2. Creating test branches...')
branch_ids = {}
for i in range(2):
    s, b = req('POST', '/branches', {'name': f'Test Branch {i+1}', 'code': f'TB{i+1}{ts}'}, token=token)
    print(f'   Branch {i+1} status: {s}')
    if s in (200, 201):
        bd = b.get('data', b) if isinstance(b, dict) else {}
        bid = bd.get('id')
        branch_ids[f'branch{i+1}'] = bid
        print(f'   ✓ ID: {bid}')
    else:
        print(f'   ✗ Failed: {str(b)[:100]}')

# 3. Create assignees (we need their IDs)
print('\n3. Creating test users to assign assets...')
assignee_ids = {}
for i in range(2):
    email = f'assignee{i+1}-{ts}@test.io'
    reg2 = {
        'firstName': f'Assignee{i+1}',
        'lastName': ts,
        'email': email,
        'password': 'Test1234!',
        'organizationName': f'Assignee Org {i+1} {ts}',
        'accountType': 'organization'
    }
    s, b = req('POST', '/auth/register', reg2)
    print(f'   Assignee {i+1} status: {s}')
    if s in (200, 201):
        bd = b.get('data', b) if isinstance(b, dict) else {}
        uid = bd.get('id')
        assignee_ids[f'assignee{i+1}'] = uid
        print(f'   ✓ ID: {uid}')
    else:
        print(f'   ✗ Failed: {str(b)[:100]}')

# 4. Generate Excel file with proper schema
print('\n4. Generating Excel file with UUIDs...')
try:
    from openpyxl import Workbook
    from datetime import datetime, timedelta
    
    wb = Workbook()
    ws = wb.active
    ws.title = 'Assets'
    
    # Headers matching corrected backend schema
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
    
    # Get IDs for use in data
    branch1_id = list(branch_ids.values())[0] if branch_ids else None
    branch2_id = list(branch_ids.values())[1] if len(branch_ids) > 1 else None
    assignee1_id = list(assignee_ids.values())[0] if assignee_ids else None
    assignee2_id = list(assignee_ids.values())[1] if len(assignee_ids) > 1 else None
    
    # Add sample data with valid UUIDs (or empty for optional fields)
    sample_rows = [
        ['Laptop 1', 'AST-001', 'SN001', 450000, '2024-01-15', 'active', 'good', 48, 50000, branch1_id or '', assignee1_id or '', 'true', 'true'],
        ['Desktop 1', 'AST-002', 'SN002', 250000, '2024-02-20', 'active', 'fair', 36, 25000, branch2_id or '', assignee2_id or '', 'true', 'true'],
        ['Printer 1', 'AST-003', 'SN003', 85000, '2024-03-10', 'maintenance', 'good', 24, 8000, '', '', 'true', 'true'],
        ['Desk 1', 'AST-004', 'SN004', 15000, '2024-04-05', 'active', 'good', 120, 1500, '', '', 'false', 'false'],
        ['Chair 1', 'AST-005', 'SN005', 8000, '2024-04-05', 'active', 'good', 60, 800, '', '', 'false', 'false'],
    ]
    
    for row in sample_rows:
        ws.append(row)
    
    wb.save('test-assets-import.xlsx')
    print('   ✓ Generated test-assets-import.xlsx with 5 sample assets')
    print(f'   Branch IDs used: {list(branch_ids.values())}')
    print(f'   Assignee IDs used: {list(assignee_ids.values())}')
    
except Exception as e:
    print(f'   ✗ Failed to generate Excel: {e}')
    exit(1)

# 5. Upload and test import
print('\n5. Uploading file to import endpoint...')
s, b = upload_file('test-assets-import.xlsx', token)
print(f'   Status: {s}')

if s in (200, 201):
    print('   ✓ Upload accepted')
    result = b.get('data', b) if isinstance(b, dict) else {}
    inserted = result.get('insertedCount', result.get('inserted', 0))
    failed = result.get('failedCount', result.get('failed', 0))
    print(f'   Inserted: {inserted}')
    print(f'   Failed: {failed}')
    
    if inserted > 0:
        print(f'\n✅ SUCCESS! {inserted} assets imported!')
    else:
        print('\n⚠ No assets imported. Showing failures:')
        failures = result.get('failures', result.get('errors', []))
        for failure in failures[:5]:
            row = failure.get('row', '?')
            msg = failure.get('message', failure.get('error', 'unknown'))
            print(f'   Row {row}: {msg}')
        
        if len(failures) > 5:
            print(f'   ... and {len(failures) - 5} more failures')
else:
    print(f'   ✗ Upload failed')
    print(f'   Response: {str(b)[:500]}')

print('\n=== TEST COMPLETE ===')
