import json
import pathlib
import requests

api = 'http://localhost:4000/api'
file_path = pathlib.Path('test-assets-30.csv')
print('API:', api)
print('File exists:', file_path.exists(), 'size:', file_path.stat().st_size if file_path.exists() else None)

for url in ['http://localhost:4000/api/health', 'http://localhost:4000/health']:
    try:
        r = requests.get(url, timeout=8)
        print(url, r.status_code)
        print(r.text[:500])
    except Exception as e:
        print(url, 'ERROR', repr(e))

creds = [
    {'email': 'admin@assetflow.co', 'password': 'Admin1234!'},
    {'email': 'test@test.com', 'password': 'Test1234!'},
]

token = None
for c in creds:
    try:
        r = requests.post(f'{api}/auth/login', json=c, timeout=15)
        print('login', c['email'], r.status_code)
        body = r.json()
        data = body.get('data', body)
        token = data.get('accessToken') or body.get('accessToken')
        if token:
            print('token ok', token[:20])
            break
    except Exception as e:
        print('login error', c['email'], e)

if not token:
    reg = {
        'firstName': 'Import',
        'lastName': 'Tester',
        'email': 'import-test-1@assetflow.test',
        'password': 'ImportPass123!',
        'organizationName': 'Import Test Org',
        'accountType': 'organization',
    }
    r = requests.post(f'{api}/auth/register', json=reg, timeout=20)
    print('register status', r.status_code)
    body = r.json()
    data = body.get('data', body)
    token = data.get('accessToken') or body.get('accessToken')
    print('token after register', bool(token))

if not token:
    raise SystemExit('No auth token available')

with file_path.open('rb') as fh:
    files = {'file': (file_path.name, fh, 'text/csv')}
    r = requests.post(
        f'{api}/assets/import',
        files=files,
        headers={'Authorization': f'Bearer {token}'},
        timeout=120,
    )

print('import status', r.status_code)
print('content-type', r.headers.get('content-type'))
try:
    print(json.dumps(r.json(), indent=2)[:8000])
except Exception as e:
    print(r.text[:8000])
