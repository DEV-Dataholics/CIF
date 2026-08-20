/**
 * CIF — Cliente API compartido
 * Maneja llamadas, sesiones y helpers globales de UI
 */

const BASE_URL = (() => {
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:8080/api';
  const secureOrigin = window.location.origin.replace(/^http:/, 'https:');
  return `${secureOrigin}/api`;
})();

const cifAPI = {

  // ── Sesión en memoria ──────────────────────────────────────
  _user: null,

  getCurrentUser() {
    if (this._user) return this._user;
    try {
      const raw = sessionStorage.getItem('cif_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  _setUser(u) {
    this._user = u;
    if (u) sessionStorage.setItem('cif_user', JSON.stringify(u));
    else    sessionStorage.removeItem('cif_user');
  },

  async me() {
    const cached = this.getCurrentUser();
    if (cached) return cached;
    const data = await this.get('/auth/me');
    if (data?.ok && data.usuario) {
      this._setUser(data.usuario);
      return data.usuario;
    }
    return null;
  },

  async login(email, password) {
    return await this.post('/auth/login', { email, password });
  },

  async logout() {
    await this.post('/auth/logout', {});
    this._setUser(null);
    window.location.href = 'index.html';
  },

  // ── Petición HTTP base ─────────────────────────────────────────────────
  async request(endpoint, method = 'GET', data = null) {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const options = {
      method,
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    };

    if (data !== null && method !== 'GET' && method !== 'HEAD') {
      if (data instanceof FormData) {
        options.body = data;
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
      }
    }

    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type') || '';

      let payload = {};
      if (contentType.includes('application/json')) {
        payload = await response.json();
      } else {
        const text = await response.text();
        payload = { ok: response.ok, mensaje: text || 'Respuesta no JSON del servidor.' };
      }

      if (!response.ok && payload.ok === undefined) payload.ok = false;
      return payload;
    } catch (err) {
      console.error(`[CIF API] Falla en request ${url}`, err);
      try {
        return await this.requestViaXHR(url, method, data);
      } catch (xhrErr) {
        const detail = xhrErr?.message ? ` (${xhrErr.message})` : '';
        return { ok: false, error: `No fue posible conectar con API${detail}.` };
      }
    }
  },

  requestViaXHR(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.withCredentials = true;
      xhr.setRequestHeader('Accept', 'application/json');

      if (data !== null && method !== 'GET' && method !== 'HEAD') {
        if (!(data instanceof FormData)) {
          xhr.setRequestHeader('Content-Type', 'application/json');
        }
      }

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;

        const contentType = xhr.getResponseHeader('content-type') || '';
        let payload = {};

        if (contentType.includes('application/json')) {
          try {
            payload = JSON.parse(xhr.responseText || '{}');
          } catch {
            payload = { ok: false, mensaje: 'Respuesta JSON inválida del servidor.' };
          }
        } else {
          payload = { ok: xhr.status >= 200 && xhr.status < 300, mensaje: xhr.responseText || 'Respuesta no JSON del servidor.' };
        }

        if (xhr.status < 200 || xhr.status >= 300) {
          if (payload.ok === undefined) payload.ok = false;
        }
        resolve(payload);
      };

      xhr.onerror = () => reject(new Error('XHR network error'));
      xhr.ontimeout = () => reject(new Error('XHR timeout'));
      xhr.timeout = 20000;

      const body = (data !== null && method !== 'GET' && method !== 'HEAD') ? 
        (data instanceof FormData ? data : JSON.stringify(data)) : null;
      xhr.send(body);
    });
  },

  get:    (e)    => cifAPI.request(e, 'GET'),
  post:   (e, d) => cifAPI.request(e, 'POST', d),
  postFile:(e, fd)=> cifAPI.request(e, 'POST', fd),
  put:    (e, d) => cifAPI.request(e, 'PUT', d),
  delete: (e)    => cifAPI.request(e, 'DELETE'),
};

// ── Badges de estatus de viaje ─────────────────────────────
function badgeViaje(estatus) {
  const map = {
    solicitado:  ['badge-muted',    '📋 Solicitado'],
    asignado:    ['badge-info',     '📌 Asignado'],
    en_transito: ['badge-warning',  '🚛 En Tránsito'],
    en_aduana:   ['badge-accent',   '🛃 En Aduana'],
    entregado:   ['badge-success',  '✅ Entregado'],
    documentado: ['badge-success',  '📄 Documentado'],
    facturado:   ['badge-success',  '💰 Facturado'],
  };
  const [cls, label] = map[estatus] ?? ['badge-muted', estatus];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Formateo de fechas ─────────────────────────────────────
function fmtFecha(fecha) {
  if (!fecha) return '—';
  try {
    return new Date(fecha).toLocaleString('es-MX', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
      hour:  '2-digit',
      minute:'2-digit',
    });
  } catch { return fecha; }
}

// ── Formateo de fechas (solo fecha) ───────────────────────
function fmtFechaSolo(fecha) {
  if (!fecha) return '—';
  try {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return fecha; }
}

// ── Notificaciones Toast ──────────────────────────────────
function cifToast(mensaje, tipo = 'success') {
  const container = document.getElementById('toast-container') || crearContenedorToasts();
  const toast = document.createElement('div');

  const estilos = {
    success: 'toast-success',
    error:   'toast-error',
    danger:  'toast-error',
    info:    'toast-success',
  };
  toast.className = `toast ${estilos[tipo] || 'toast-success'}`;
  toast.textContent = mensaje;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}

function crearContenedorToasts() {
  const c = document.createElement('div');
  c.id = 'toast-container';
  c.style.cssText = 'position:fixed;bottom:2rem;right:2rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;';
  document.body.appendChild(c);
  return c;
}

window.cifAPI = cifAPI;
