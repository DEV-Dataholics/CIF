
with open("src/main.jsx", "rb") as f:
    content = f.read()

# find the null bytes and strip everything from there
idx = content.find(b"\0")
if idx != -1:
    content = content[:idx-1] # also remove the preceding newline

with open("src/main.jsx", "wb") as f:
    f.write(content)

