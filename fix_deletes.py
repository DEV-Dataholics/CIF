import re

with open('backend/api/app/Config/Routes.php', 'r', encoding='utf-8') as f:
    content = f.read()

# Add delete to cajas
content = content.replace(
    \"\->put('cajas/(:num)/asignar','CajaController::asignar/\');\",
    \"\->put('cajas/(:num)/asignar','CajaController::asignar/\');\n    \->delete('cajas/(:num)',         'CajaController::delete/\');\"
)

# Add delete to operadores
content = content.replace(
    \"\->put('operadores/(:num)',         'OperadorController::update/\');\",
    \"\->put('operadores/(:num)',         'OperadorController::update/\');\n    \->delete('operadores/(:num)',      'OperadorController::delete/\');\"
)

# Add delete to cobranza
content = content.replace(
    \"\->put('cobranza/(:num)/pagar',      'CobranzaController::pagar/\');\",
    \"\->put('cobranza/(:num)/pagar',      'CobranzaController::pagar/\');\n    \->delete('cobranza/(:num)',        'CobranzaController::delete/\');\"
)

with open('backend/api/app/Config/Routes.php', 'w', encoding='utf-8') as f:
    f.write(content)
