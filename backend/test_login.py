import urllib.request
import urllib.parse
import json

data = urllib.parse.urlencode({"username": "admin@gov.in", "password": "password123"}).encode()
req = urllib.request.Request("http://localhost:8000/auth/login", data=data)

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print(e.read().decode())
except Exception as e:
    print(e)
