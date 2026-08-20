import { useState } from 'react';
import { User, Lock, Eye, EyeSlash, SignIn } from '@phosphor-icons/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('cif2026'); // Credenciales demo pre-cargadas
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.mensaje || 'Credenciales incorrectas o error en el servidor.');
        setLoading(false);
        return;
      }

      if (data.ok && data.usuario) {
        sessionStorage.setItem('cif_user', JSON.stringify(data.usuario));
        // Redirigir al dashboard principal
        window.location.href = '/';
      } else {
        setError('Error al procesar la respuesta del servidor.');
      }
    } catch (err) {
      setError('Fallo de conexión con la API del servidor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] flex flex-col justify-between p-6 relative overflow-hidden font-body">
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#d1a14e]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#3d2b1f]/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header logo / Title */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full z-10">
        <div className="flex items-center gap-3">
          <img src="/assets/LOGOCIF.png" alt="Logo CIF" className="h-8 w-auto object-contain" />
          <span className="text-xs font-label uppercase tracking-widest text-[#a1a1aa] font-semibold border-l border-[#27272a] pl-3 hidden sm:inline">
            Cruces Internacionales Fronterizos
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[420px] mx-auto my-auto z-10">
        <div className="bg-[#121214] border border-[#27272a]/60 shadow-[0_8px_32px_rgba(0,0,0,0.8)] p-8 rounded-none">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[#f4f4f5]">Acceso al Sistema</h1>
            <p className="text-xs text-[#a1a1aa] mt-1.5 font-body">Ingresa tus credenciales para administrar la logística</p>
            <div className="w-12 h-[2px] bg-[#d1a14e] mt-4" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-none flex items-center gap-2 animate-pulse">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-label uppercase tracking-wider text-[#a1a1aa] font-bold">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1aa]">
                  <User size={16} weight="light" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cif.mx"
                  className="w-full bg-[#09090b] border border-[#3f3f46] focus:border-[#d1a14e] focus:ring-1 focus:ring-[#d1a14e]/20 text-sm py-3 pl-10 pr-4 outline-none transition-all placeholder-[#52525b] text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-label uppercase tracking-wider text-[#a1a1aa] font-bold">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1aa]">
                  <Lock size={16} weight="light" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#09090b] border border-[#3f3f46] focus:border-[#d1a14e] focus:ring-1 focus:ring-[#d1a14e]/20 text-sm py-3 pl-10 pr-12 outline-none transition-all placeholder-[#52525b] text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d1a14e] hover:bg-[#bfa044] text-[#09090b] font-semibold py-3 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#09090b] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <SignIn size={18} weight="bold" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full text-center z-10">
        <p className="text-[10px] font-label uppercase tracking-widest text-[#52525b]">
          © 2026 CIF Logística · Cruces Internacionales Fronterizos · MVP v1.0
        </p>
      </div>
    </div>
  );
}
