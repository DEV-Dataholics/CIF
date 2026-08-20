const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simulación de latencia (Delay global)
app.use((req, res, next) => {
  setTimeout(next, 500); // 500ms de latencia para ver spinners
});

// ── CAPA DE DATOS (En memoria) ───────────────────────────────────
const dataPath = path.join(__dirname, '../data');
let db = {
  usuarios: [],
  tractocamiones: [],
  cajas: [],
  viajes: [],
  bitacora_viajes: [],
  taller_checklists: [],
  taller_ordenes: [],
  taller_solicitudes: [],
  porteria_bitacora: [],
  operadores: []
};

// Cargar JSON locales al iniciar
function loadData() {
  Object.keys(db).forEach(key => {
    try {
      const file = path.join(dataPath, `${key}.json`);
      if (fs.existsSync(file)) {
        db[key] = JSON.parse(fs.readFileSync(file, 'utf-8'));
      }
    } catch (err) {
      console.error(`Error loading ${key}.json:`, err);
    }
  });
}

// Guardar JSON localmente (Persistencia)
function saveData(key) {
  try {
    const file = path.join(dataPath, `${key}.json`);
    fs.writeFileSync(file, JSON.stringify(db[key], null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving ${key}.json:`, err);
  }
}

loadData();

// Helper de sesión mock
let currentUser = null;

// ── RUTAS MOCK ───────────────────────────────────────────────────

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (password !== 'cif2026') {
    return res.json({ ok: false, mensaje: 'Credenciales inválidas' });
  }
  const user = db.usuarios.find(u => u.email === email);
  if (user) {
    currentUser = user;
    return res.json({ ok: true, usuario: user });
  }
  res.json({ ok: false, mensaje: 'Usuario no encontrado' });
});

app.post('/api/auth/logout', (req, res) => {
  currentUser = null;
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (currentUser) {
    res.json({ ok: true, usuario: currentUser });
  } else {
    res.status(401).json({ ok: false, error: 'No autorizado' });
  }
});

// Dashboard
app.get('/api/dashboard/resumen', (req, res) => {
  res.json({
    ok: true,
    resumen: {
      en_ruta: db.tractocamiones.filter(t => t.estatus === 'en_ruta').length,
      en_taller: db.tractocamiones.filter(t => t.estatus === 'en_taller').length,
      disponibles: db.tractocamiones.filter(t => t.estatus === 'disponible').length,
      viajes_activos: db.viajes.filter(v => ['solicitado', 'asignado', 'en_transito', 'en_aduana'].includes(v.estatus)).length,
      cajas_disponibles: db.cajas.filter(c => c.estatus === 'disponible').length,
      solicitudes_taller_pendientes: db.taller_checklists.length,
      operadores_activos: db.operadores.filter(o => o.activo).length,
      costo_inactividad: db.tractocamiones.filter(t => t.estatus === 'en_taller').length * 4500 // Mock: 4500 mxn al dia por tracto inactivo
    },
    viajes_activos: db.viajes.filter(v => ['solicitado', 'asignado', 'en_transito', 'en_aduana'].includes(v.estatus)),
    tractos_taller: db.tractocamiones.filter(t => t.estatus === 'en_taller'),
    sos_pendientes: [] // Puede implementarse más adelante
  });
});

// Viajes
app.get('/api/viajes', (req, res) => {
  res.json({ ok: true, data: db.viajes });
});

app.post('/api/viajes', (req, res) => {
  const nuevoViaje = {
    id: db.viajes.length + 1,
    folio: `V-2026-00${db.viajes.length + 1}`,
    fecha_solicitud: new Date().toISOString(),
    estatus: 'solicitado',
    ...req.body
  };
  db.viajes.push(nuevoViaje);
  saveData('viajes');
  res.json({ ok: true, data: nuevoViaje });
});

app.put('/api/viajes/:id/estatus', (req, res) => {
  const viaje = db.viajes.find(v => v.id == req.params.id);
  if (viaje) {
    viaje.estatus = req.body.estatus;
    saveData('viajes');
    res.json({ ok: true, data: viaje });
  } else {
    res.status(404).json({ ok: false, error: 'Viaje no encontrado' });
  }
});

app.put('/api/viajes/:id/facturar', (req, res) => {
  const viaje = db.viajes.find(v => v.id == req.params.id);
  if (viaje) {
    viaje.factura = req.body.folio_factura;
    saveData('viajes');
    res.json({ ok: true, data: viaje });
  } else {
    res.status(404).json({ ok: false, error: 'Viaje no encontrado' });
  }
});

app.post('/api/viajes/registrar', (req, res) => {
  res.json({ ok: true, puntos: 2 });
});

app.post('/api/viajes/:id/voucher', (req, res) => {
  const viaje = db.viajes.find(v => v.id == req.params.id);
  if (viaje) {
    viaje.estatus = 'entregado';
    saveData('viajes');
  }
  res.json({ ok: true, puntos: 5 });
});

// Gamificacion Mocks (PWA)
app.get('/api/gamificacion/ranking', (req, res) => {
  res.json({ ok: true, ranking: [
    { operador_id: 1, nombre: 'Mario A. Ruiz', viajes: 45, puntos: 1250 },
    { operador_id: 2, nombre: 'Juan Pérez', viajes: 38, puntos: 980 },
    { operador_id: 3, nombre: 'Carlos G.', viajes: 35, puntos: 890 }
  ]});
});

app.get('/api/gamificacion/scorecard/me', (req, res) => {
  res.json({ ok: true, puntos_semana: 1250, posicion: 1, viajes_cargados: 40, viajes_vacios: 5 });
});

// PWA: Mis Viajes
app.get('/api/operadores/mis-viajes', (req, res) => {
  // Demo: regresamos todos los viajes, en produccion se filtraria por req.user.operador_id
  res.json({ ok: true, viajes: db.viajes });
});

// Tractocamiones y Cajas
app.get('/api/tractocamiones', (req, res) => res.json({ ok: true, data: db.tractocamiones }));
app.post('/api/tractocamiones', (req, res) => {
  const t = { id: db.tractocamiones.length + 1, estatus: 'disponible', ...req.body };
  db.tractocamiones.push(t);
  saveData('tractocamiones');
  res.json({ ok: true, data: t });
});
app.put('/api/tractocamiones/:id', (req, res) => {
  const idx = db.tractocamiones.findIndex(t => t.id == req.params.id);
  if (idx > -1) {
    let updateData = { ...req.body };
    
    // Simular el JOIN de base de datos: Inyectar nombre del operador si se mandó un ID
    if (updateData.operador_asignado_id) {
      const op = db.operadores.find(o => o.id == updateData.operador_asignado_id);
      if (op) {
        updateData.operador_nombre = op.nombre_completo;
      }
    } else if (updateData.operador_asignado_id === null || updateData.operador_asignado_id === "") {
      updateData.operador_nombre = null;
    }

    db.tractocamiones[idx] = { ...db.tractocamiones[idx], ...updateData };
    saveData('tractocamiones');
    res.json({ ok: true, data: db.tractocamiones[idx] });
  } else {
    res.status(404).json({ ok: false, error: 'Tractocamión no encontrado' });
  }
});

app.get('/api/cajas', (req, res) => res.json({ ok: true, data: db.cajas }));
app.post('/api/cajas', (req, res) => {
  const c = { id: db.cajas.length + 1, estatus: 'disponible', ...req.body };
  db.cajas.push(c);
  saveData('cajas');
  res.json({ ok: true, data: c });
});

// Taller
app.get('/api/taller/solicitudes', (req, res) => res.json({ ok: true, solicitudes: db.taller_solicitudes }));
app.put('/api/taller/solicitudes/:id', (req, res) => {
  const idx = db.taller_solicitudes.findIndex(x => x.id == req.params.id);
  if(idx > -1) {
    db.taller_solicitudes[idx] = { ...db.taller_solicitudes[idx], ...req.body };
    saveData('taller_solicitudes');
    res.json({ ok: true, data: db.taller_solicitudes[idx] });
  } else {
    res.status(404).json({ ok: false });
  }
});

app.get('/api/taller/ordenes', (req, res) => res.json({ ok: true, ordenes: db.taller_ordenes }));
app.post('/api/taller/ordenes', (req, res) => {
  const o = { id: db.taller_ordenes.length + 1, estatus: 'abierta', fecha: new Date().toISOString(), ...req.body };
  db.taller_ordenes.push(o);
  saveData('taller_ordenes');
  res.json({ ok: true, data: o });
});
app.put('/api/taller/ordenes/:id', (req, res) => {
  const idx = db.taller_ordenes.findIndex(x => x.id == req.params.id);
  if(idx > -1) {
    db.taller_ordenes[idx] = { ...db.taller_ordenes[idx], ...req.body };
    saveData('taller_ordenes');
    res.json({ ok: true, data: db.taller_ordenes[idx] });
  } else {
    res.status(404).json({ ok:false });
  }
});

app.post('/api/taller/sos', (req, res) => {
  const nuevoSOS = {
    id: db.taller_solicitudes.length + 1,
    economico: 'T-100', // Mockeado para Demo ya que el App no envía ID
    operador: 'Mario Alberto Ruiz', // Mockeado para Demo
    estatus: 'pendiente',
    fecha_reporte: new Date().toISOString(),
    ...req.body
  };
  db.taller_solicitudes.push(nuevoSOS);
  saveData('taller_solicitudes');
  res.json({ ok: true, data: nuevoSOS });
});

app.get('/api/taller/checklists', (req, res) => res.json({ ok: true, data: db.taller_checklists }));
app.post('/api/taller/checklists', (req, res) => {
  const nuevo = {
    id: db.taller_checklists.length + 1,
    fecha_creacion: new Date().toISOString(),
    ...req.body
  };
  db.taller_checklists.push(nuevo);
  saveData('taller_checklists');
  res.json({ ok: true, data: nuevo });
});
app.put('/api/taller/checklists/:id', (req, res) => {
  const idx = db.taller_checklists.findIndex(x => x.id == req.params.id);
  if(idx > -1) {
    db.taller_checklists[idx] = { ...db.taller_checklists[idx], ...req.body };
    saveData('taller_checklists');
    res.json({ ok: true, data: db.taller_checklists[idx] });
  } else {
    res.status(404).json({ ok:false });
  }
});


// Portería
app.get('/api/porteria/bitacora', (req, res) => {
  // JOIN manual para inyectar el numero económico
  const bitacoraEnriquecida = db.porteria_bitacora.map(b => {
    let eco = '—';
    if(b.tractocamion_id) {
       const t = db.tractocamiones.find(tr => tr.id == b.tractocamion_id);
       if(t) eco = t.numero_economico;
    }
    return { ...b, economico: eco };
  }).sort((a,b) => new Date(b.hora) - new Date(a.hora)); // más recientes primero
  
  res.json({ ok: true, registros: bitacoraEnriquecida });
});

app.post('/api/porteria/bitacora', (req, res) => {
  const mov = {
    id: db.porteria_bitacora.length + 1,
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' }),
    ...req.body
  };
  db.porteria_bitacora.push(mov);
  saveData('porteria_bitacora');
  res.json({ ok: true, data: mov });
});

// Viajes
app.get('/api/viajes/catalogos', (req, res) => res.json({
  ok: true,
  data: { tractocamiones: db.tractocamiones, cajas: db.cajas, operadores: db.operadores }
}));

// Operadores
app.get('/api/operadores', (req, res) => res.json({ ok: true, data: db.operadores }));
app.post('/api/operadores', (req, res) => {
  const op = { id: db.operadores.length + 1, activo: true, ...req.body };
  db.operadores.push(op);
  saveData('operadores');
  res.json({ ok: true, data: op });
});
app.put('/api/operadores/:id', (req, res) => {
  const op = db.operadores.find(o => o.id == req.params.id);
  if (op) {
    Object.assign(op, req.body);
    saveData('operadores');
    res.json({ ok: true, data: op });
  } else {
    res.status(404).json({ ok: false, error: 'Operador no encontrado' });
  }
});

// Gamificación
app.get('/api/gamificacion/ranking', (req, res) => res.json({ ok: true, data: [] }));
app.get('/api/gamificacion/scorecard/me', (req, res) => res.json({ ok: true, data: {} }));
app.get('/api/gamificacion/scorecard/:id', (req, res) => res.json({ ok: true, data: {} }));

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Mock API (Demo Mode) running on http://localhost:${PORT}`);
  console.log(`Simulated latency: 500ms`);
  console.log(`Loaded ${db.viajes.length} viajes, ${db.tractocamiones.length} tractocamiones.`);
});
