
with open("backend/api/app/Controllers/PeajeController.php", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("update(int $id = null)", "update($id = null)")
content = content.replace("delete(int $id = null)", "delete($id = null)")

with open("backend/api/app/Controllers/PeajeController.php", "w", encoding="utf-8") as f:
    f.write(content)

