import json
import pathlib
import urllib.request
import urllib.error
import uuid

api = 'http://localhost:4000/api'
file_path = pathlib.Path('test-assets-30.xlsx')
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

email = f'import-{uuid.uuid4().hex[:8]}@assetflow.test'
reg = {
    'firstName': 'Import',
    'lastName': 'Tester',
    'email': email,
    'password': 'ImportPass123!',
    'organizationName': f'Import Org {uuid.uuid4().hex[:4]}',
    'accountType': 'organization',
}
status, body = request_json('POST', '/auth/register', body=reg, headers={'Content-Type': 'application/json'})
print('register status', status)
if isinstance(body, dict):
    data = body.get('data', body)
    token = data.get('accessToken') or body.get('accessToken')
    print('token available', bool(token))
else:
    token = None
    print(body)

if not token:
    raise SystemExit('No auth token available')

boundary = '----AssetFlowBoundary123'
body_parts = [
    f'--{boundary}\r\n'.encode(),
    b'Content-Disposition: form-data; name="file"; filename="test-assets-30.xlsx"\r\n',
    b'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n',
    file_path.read_bytes(),
    f'\r\n--{boundary}--\r\n'.encode(),
]
payload = b''.join(body_parts)
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
        print(raw.decode('utf-8')[:8000])
except urllib.error.HTTPError as e:
    raw = e.read()
    print('import status', e.code)
    print('content-type', e.headers.get('content-type'))
    print(raw.decode('utf-8')[:8000])
