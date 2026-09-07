import sys
with open("frontend/src/components/SuperCapturaWizard.jsx", "r", encoding="utf-8") as f:
    c = f.read()

old_insert = """onClick={() => {
                              const nueva = window.prompt("Número de nueva caja (Agregado rápido):");
                              if(nueva && nueva.trim() !== '') {
                                // Esto generará algo de deuda técnica sin placa/año, pero agiliza la captura
                                crud.insert('cajas', { numero_caja: nueva.trim(), estatus: 'disponible', tipo_caja: 'Seca' });
                                setCaja(nueva.trim());
                              }
                            }}"""
                            
new_insert = """onClick={async () => {
                              const nueva = window.prompt("Número de nueva caja (Agregado rápido):");
                              if(nueva && nueva.trim() !== '') {
                                try {
                                  await crud.insert('cajas', { numero_caja: nueva.trim(), estatus: 'disponible', tipo: 'seca', placas_mx: 'PENDIENTE' });
                                  setCaja(nueva.trim());
                                } catch (err) {
                                  alert("Error al agregar caja: " + err.message);
                                }
                              }
                            }}"""

c = c.replace(old_insert, new_insert)

with open("frontend/src/components/SuperCapturaWizard.jsx", "w", encoding="utf-8") as f:
    f.write(c)
