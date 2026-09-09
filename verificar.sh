#!/usr/bin/env bash
# Compuerta de Calidad Integral - Desarrollo Ágil Dataholics
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$RAIZ/apps/web" ]; then
    WEB="$RAIZ/apps/web"
else
    WEB="$RAIZ/frontend"
fi

if [ -d "$RAIZ/apps/api" ]; then
    API="$RAIZ/apps/api"
elif [ -d "$RAIZ/backend/api" ]; then
    API="$RAIZ/backend/api"
else
    API="$RAIZ/backend"
fi

FALLAS=0

echo ""
echo "=================================================="
echo ">>> 1. Frontend: Typecheck (tsc --noEmit)"
echo "=================================================="
if [ -d "$WEB" ]; then
    cd "$WEB"
    if [ -f "tsconfig.json" ]; then
        npx tsc --noEmit
        if [ $? -ne 0 ]; then
            echo -e "\033[0;31m[FAIL] Frontend Typecheck fallo\033[0m"
            FALLAS=$((FALLAS + 1))
        else
            echo -e "\033[0;32m[OK] Frontend Typecheck paso\033[0m"
        fi
    else
        echo -e "\033[0;33m[INFO] tsconfig.json no detectado en $WEB, saltando typecheck...\033[0m"
    fi
fi

echo ""
echo "=================================================="
echo ">>> 2. Frontend: Lint"
echo "=================================================="
if [ -d "$WEB" ]; then
    cd "$WEB"
    if npx --no-install oxlint --version &>/dev/null; then
        npx oxlint
    else
        npm run lint
    fi
    if [ $? -ne 0 ]; then
        echo -e "\033[0;31m[FAIL] Frontend Lint fallo\033[0m"
        FALLAS=$((FALLAS + 1))
    else
        echo -e "\033[0;32m[OK] Frontend Lint paso\033[0m"
    fi
fi

echo ""
echo "=================================================="
echo ">>> 3. Backend: Rutas de API"
echo "=================================================="
if [ -d "$API" ] && [ -f "$API/spark" ]; then
    if [ -d "$API/vendor" ]; then
        cd "$API"
        php spark routes
        if [ $? -ne 0 ]; then
            echo -e "\033[0;31m[FAIL] Backend Rutas fallo\033[0m"
            FALLAS=$((FALLAS + 1))
        else
            echo -e "\033[0;32m[OK] Backend Rutas paso\033[0m"
        fi
    else
        echo -e "\033[0;33m[INFO] Backend vendor no instalado (sesion frontend), saltando chequeo de rutas...\033[0m"
    fi
fi

cd "$RAIZ"

echo ""
echo "=================================================="
if [ $FALLAS -eq 0 ]; then
    echo -e "\033[0;32m[OK] COMPUERTA EN VERDE - Todos los chequeos pasaron correctamente.\033[0m"
    exit 0
else
    echo -e "\033[0;31m[FAIL] COMPUERTA ROJA - $FALLAS chequeos fallaron.\033[0m"
    exit 1
fi
