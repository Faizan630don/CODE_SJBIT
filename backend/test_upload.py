import requests

with open('../frontend/public/xray.svg', 'rb') as f:
    response = requests.post('http://127.0.0.1:8000/analyze', files={'file': ('demo_xray.svg', f, 'image/svg+xml')})

print(response.status_code)
print(response.text)
