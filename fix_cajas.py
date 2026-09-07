import sys, re
with open('frontend/src/components/SuperCapturaWizard.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

pattern = r"onClick=\{.*?crud\.insert\('cajas'.*?setCaja.*?\}\}"
new_code = '''onClick={async () => {
                              const nueva = window.prompt("N?mero de nueva caja (Agregado r?pido):");
                              if(nueva && nueva.trim() !== '') {
                                try {
                                  await crud.insert('cajas', { numero_caja: nueva.trim(), estatus: 'disponible', tipo: 'seca', placas_mx: 'PENDIENTE' });
                                  setCaja(nueva.trim());
                                } catch (e) {
                                  alert('Error al agregar caja: ' + e.message);
                                }
                              }
                            }}'''

c = re.sub(pattern, new_code, c, flags=re.DOTALL)
with open('frontend/src/components/SuperCapturaWizard.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
