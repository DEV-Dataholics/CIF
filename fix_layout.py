import sys
with open('frontend/src/layouts/AppLayout.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(\"import { Outlet } from 'react-router-dom';\", \"import { Outlet } from 'react-router-dom';\\nimport ErrorBoundary from '../components/ErrorBoundary';\")
c = c.replace('<Outlet />', '<ErrorBoundary><Outlet /></ErrorBoundary>')

with open('frontend/src/layouts/AppLayout.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
