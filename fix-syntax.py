with open('src/api/mock/routes.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('},,', '},')

with open('src/api/mock/routes.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed syntax error")
