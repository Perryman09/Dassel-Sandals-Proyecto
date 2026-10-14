import { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const [username, setUsername] = useState('Dassel2026');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Control de máximo 5 intentos
  const [attempts, setAttempts] = useState(() => {
    try {
      return parseInt(localStorage.getItem('dassel_login_attempts') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [lockExpires, setLockExpires] = useState(() => {
    try {
      const saved = localStorage.getItem('dassel_login_locked_until');
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });

  // Temporizador para refrescar el estado de bloqueo en segundos
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const isLocked = Boolean(lockExpires && now < lockExpires);
  const remainingSeconds = isLocked
    ? Math.max(1, Math.ceil((lockExpires - now) / 1000))
    : 0;

  // Auto-desbloqueo inmediato en cuanto pasen los 10 segundos
  useEffect(() => {
    if (lockExpires && now >= lockExpires) {
      localStorage.removeItem('dassel_login_attempts');
      localStorage.removeItem('dassel_login_locked_until');
      setAttempts(0);
      setLockExpires(null);
      setError('');
    }
  }, [now, lockExpires]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLocked) {
      setError(`Acceso bloqueado por superar los 5 intentos. Espera ${remainingSeconds} segundo(s).`);
      return;
    }

    if (!username.trim()) {
      setError('Por favor, ingresa tu usuario.');
      return;
    }
    if (!password) {
      setError('Por favor, ingresa tu contraseña.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      // Éxito: restablecer intentos
      localStorage.removeItem('dassel_login_attempts');
      localStorage.removeItem('dassel_login_locked_until');
      setAttempts(0);
      setLockExpires(null);
    } catch (err) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      localStorage.setItem('dassel_login_attempts', String(nextAttempts));

      if (nextAttempts >= 5) {
        const lockoutTime = Date.now() + 10 * 1000; // 10 segundos exactos
        setLockExpires(lockoutTime);
        localStorage.setItem('dassel_login_locked_until', String(lockoutTime));
        setError('Has superado el límite de 5 intentos fallidos. Acceso bloqueado por 10 segundos.');
      } else {
        const remaining = 5 - nextAttempts;
        const msg = err.message || 'Usuario o contraseña incorrectos.';
        setError(`${msg} (Intentos restantes: ${remaining} de 5)`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-background-decor">
        <div className="decor-circle circle-1" />
        <div className="decor-circle circle-2" />
        <div className="decor-circle circle-3" />
      </div>

      <div className="login-card">
        {/* Encabezado con Logo Oficial */}
        <div className="login-header">
          <div className="login-logo-container">
            <img
              src="/dassel-logo.png"
              alt="Dassel Sandals Logo"
              className="login-brand-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="login-title">Dassel Sandals</h1>
          <span className="login-subtitle">Sistema Integral de Inventario &amp; Facturación</span>
        </div>

        {/* Mensaje de error o bloqueo con contador en vivo */}
        {error && (
          <div className="login-error-alert" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {isLocked && (
          <div className="login-lock-banner">
            <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Lock size={16} /> <strong>Acceso bloqueado temporalmente</strong>
            </p>
            <div className="countdown-pill">
              Podrás reintentar en <strong>{remainingSeconds}</strong> segundo{remainingSeconds !== 1 ? 's' : ''}...
            </div>
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field-box">
            <label htmlFor="login-username" className="login-label">
              Usuario
            </label>
            <div className="login-input-wrapper">
              <User size={19} className="login-input-icon" />
              <input
                id="login-username"
                type="text"
                className="login-input"
                placeholder="Ingresa tu usuario..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading || isLocked}
                autoFocus
              />
            </div>
          </div>

          <div className="login-field-box">
            <label htmlFor="login-password" className="login-label">
              Contraseña
            </label>
            <div className="login-input-wrapper">
              <Lock size={19} className="login-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Ingresa tu contraseña..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading || isLocked}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                disabled={isLocked}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading || isLocked}
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                <span>Verificando credenciales...</span>
              </>
            ) : isLocked ? (
              <>
                <span>Bloqueado ({remainingSeconds}s)</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        {/* Pie limpio */}
        <div className="login-footer">
          <p className="login-legal-text">
            Dassel Sandals &amp; Joyas © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
