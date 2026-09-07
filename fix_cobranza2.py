import sys
with open("frontend/src/pages/Cobranza.jsx", "r", encoding="utf-8") as f:
    c = f.read()

# Fix the first button (list)
c = c.replace(
    '''<button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-primary text-on-primary' : 'text-outline hover:text-on-surface'}`} title="Vista de Lista">''',
    '''<button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-primary text-on-primary' : 'text-outline hover:text-on-surface'}`} title="Vista de Lista">'''
) # Already replaced with list. Let's just blindly re-write both.

import re
c = re.sub(r'<button onClick=\{\(\) => setViewMode\(\'list\'\)\}.*?title="Vista de Lista">', 
           '''<button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-primary text-on-primary' : 'text-outline hover:text-on-surface'}`} title="Vista de Lista">''', c)

c = re.sub(r'<button onClick=\{\(\) => setViewMode\(\'cards\'\)\}.*?title="Vista de Tarjetas">', 
           '''<button onClick={() => setViewMode('cards')} className={`p-1 rounded ${viewMode === 'cards' ? 'bg-primary text-on-primary' : 'text-outline hover:text-on-surface'}`} title="Vista de Tarjetas">''', c)

with open("frontend/src/pages/Cobranza.jsx", "w", encoding="utf-8") as f:
    f.write(c)
