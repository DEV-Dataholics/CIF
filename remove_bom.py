
with open("backend/api/app/Controllers/PeajeController.php", "rb") as f:
    content = f.read()

if content.startswith(b"\xef\xbb\xbf"):
    content = content[3:]

with open("backend/api/app/Controllers/PeajeController.php", "wb") as f:
    f.write(content)

