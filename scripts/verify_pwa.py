import json
import re
import os

with open('manifest.json', encoding='utf-8') as f:
    m = json.load(f)
print('Manifest valid, app name:', m['name'])

with open('sw.js', encoding='utf-8') as f:
    sw_text = f.read()

matches = re.findall(r"'(/[a-zA-Z0-9_\-\./]+)'", sw_text)
print('Found precache asset references:', len(matches))

missing = []
for url in matches:
    if url == '/':
        rel_path = 'index.html'
    else:
        rel_path = url.lstrip('/')
    
    if not os.path.exists(rel_path):
        missing.append((url, rel_path))

if missing:
    print('Missing assets:', missing)
else:
    print('SUCCESS: All', len(matches), 'precache assets exist on disk!')
