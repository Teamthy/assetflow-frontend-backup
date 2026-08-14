import json
import pathlib
import urllib.request
import urllib.error
import mimetypes

api = 'http://localhost:4000/api'
file_path = pathlib.Path('test-assets-30.csv')
print('API:', api)
print('File exists:', file_path.exists(), 'size:', file_path.stat().st_size if file_path.exists() else None)


def request_json(method, path, body=None, headers=None):
    data = None
    if body is not None:
        data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(f'{api}{path}', data=data, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read()
            try:
                return resp.status, json.loads(raw.decode('utf-8'))
            except Exception:
                return resp.status, raw.decode('utf-8')
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw.decode('utf-8'))
        except Exception:
            return e.code, raw.decode('utf-8')
    except Exception as e:
        return None, str(e)


for path in ['/health', '/health']:
    status, body = request_json('GET', path)
    print(path, '->', status)
    print(body if isinstance(body, str) else json.dumps(body, indent=2)[:500])

creds = [
    {'email': 'admin@assetflow.co', 'password': 'Admin1234!'},
    {'email': 'test@test.com', 'password': 'Test1234!'},
]

token = None
for c in creds:
    status, body = request_json('POST', '/auth/login', body=c, headers={'Content-Type': 'application/json'})
    print('login', c['email'], '->', status)
    if isinstance(body, dict):
        data = body.get('data', body)
        token = data.get('accessToken') or body.get('accessToken')
        if token:
            print('token ok', token[:20])
            break
    else:
        print(body)

if not token:
    reg = {
        'firstName': 'Import',
        'lastName': 'Tester',
        'email': 'import-test-1@assetflow.test',
        'password': 'ImportPass123!',
        'organizationName': 'Import Test Org',
        'accountType': 'organization',
    }
    status, body = request_json('POST', '/auth/register', body=reg, headers={'Content-Type': 'application/json'})
    print('register status', status)
    if isinstance(body, dict):
        data = body.get('data', body)
        token = data.get('accessToken') or body.get('accessToken')
        print('token after register', bool(token))

if not token:
    raise SystemExit('No auth token available')

boundary = '----AssetFlowBoundary123'
body = []
body.append(f'--{boundary}\r\n'.encode())
body.append(b'Content-Disposition: form-data; name="file"; filename="test-assets-30.csv"\r\n')
body.append(b'Content-Type: text/csv\r\n\r\n')
body.append(file_path.read_bytes())
body.append(f'\r\n--{boundary}--\r\n'.encode())
payload = b''.join(body)

req = urllib.request.Request(
    f'{api}/assets/import',
    data=payload,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': f'multipart/form-data; boundary={boundary}',
    },
    method='POST',
)
try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read()
        print('import status', resp.status)
        print('content-type', resp.headers.get('content-type'))
        try:
            print(json.dumps(json.loads(raw.decode('utf-8')), indent=2)[:8000])
        except Exception:
            print(raw.decode('utf-8')[:8000])
except urllib.error.HTTPError as e:
    raw = e.read()
    print('import status', e.code)
    print('content-type', e.headers.get('content-type'))
    try:
        print(json.dumps(json.loads(raw.decode('utf-8')), indent=2)[:8000])
    except Exception:
        print(raw.decode('utf-8')[:8000])
