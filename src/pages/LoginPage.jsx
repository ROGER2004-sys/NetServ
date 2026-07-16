import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Mail, Lock, Eye, EyeOff, Shield, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const ROLES = [
  'Technicien Support',
  'Responsable IT'
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, authError, setAuthError } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', role: '', displayName: ''
  });

  const [liveNodes, setLiveNodes] = useState(4281);
  const [totalNodes, setTotalNodes] = useState(5000);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'equipements'), (snapshot) => {
      let online = 0;
      let total = snapshot.docs.length;
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === 'online' || data.status === 'warning') online++;
      });
      if (total > 0) {
        setLiveNodes(online);
        setTotalNodes(total);
      }
    }, (err) => {
      console.warn("Could not fetch live nodes (requires auth or network error), using fallback.", err);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setAuthError(null);
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch {
      // error shown via authError
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.role || !form.displayName) {
      setAuthError('Veuillez remplir tous les champs.');
      return;
    }
    if (form.password.length < 6) {
      setAuthError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.role, form.displayName);
      navigate('/dashboard');
    } catch {
      // error shown via authError
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        {/* Logo */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(34,197,94,0.35)'
            }}>
              <Network size={20} color="white" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
              NetServMonitor
            </span>
          </div>

          <h1 className="login-hero-title">
            Enterprise Network<br />
            Visibility and<br />
            Performance<br />
            Management.
          </h1>

          <p className="login-hero-sub">
            Access your system core to manage nodes, monitor alerts, and
            generate deep-path inventory reports in real-time.
          </p>
        </div>

        {/* Stats */}
        <div className="login-stats">
          <div className="login-stat-card">
            <div className="stat-label">Live Nodes</div>
            <div className="stat-value">{liveNodes.toLocaleString()}</div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${Math.round((liveNodes / totalNodes) * 100)}%` }} />
            </div>
          </div>
          <div className="login-stat-card">
            <div className="stat-label">System Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              <div className="stat-value" style={{ fontSize: 18 }}>Optimal</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
          {/* Title */}
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            {mode === 'login' ? 'Connexion au Système' : 'Créer un compte'}
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>
            {mode === 'login'
              ? 'Identifiez-vous pour accéder à votre console d\'administration.'
              : 'Créez votre compte collaborateur pour accéder à NetServMonitor.'
            }
          </p>

          {/* Error */}
          {authError && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#dc2626', marginBottom: 16
            }}>
              {authError}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
            {/* Display name (register only) */}
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Nom Complet</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    id="register-name"
                    name="displayName"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="Votre nom complet"
                    value={form.displayName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Professionnel</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="nom@entreprise.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Mot de Passe</label>
                {mode === 'login' && (
                  <span style={{ fontSize: 12, color: '#3b82f6', cursor: 'pointer', fontWeight: 500 }}>
                    Oublié ?
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role (register only) */}
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Rôle Utilisateur</label>
                <div style={{ position: 'relative' }}>
                  <Shield size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                  <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  <select
                    id="login-role"
                    name="role"
                    className="form-select"
                    style={{ paddingLeft: 36 }}
                    value={form.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner votre rôle</option>
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Remember me (login only) */}
            {mode === 'login' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: '#1e3a6e' }}
                />
                <span style={{ fontSize: 13, color: '#475569' }}>Rester connecté pendant 30 jours</span>
              </label>
            )}

            {/* Submit */}
            <button
              id={mode === 'login' ? 'login-submit-btn' : 'register-submit-btn'}
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0a1628, #1e3a6e)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(10,22,40,0.25)'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                  Connexion en cours...
                </>
              ) : (
                mode === 'login' ? 'Accéder au Dashboard →' : 'Créer mon compte →'
              )}
            </button>

          </form>

          {/* Toggle mode */}
          <div style={{ textAlign: 'center', fontSize: 13, color: '#475569' }}>
            {mode === 'login' ? (
              <>
                Nouveau collaborateur ?{' '}
                <button
                  id="go-to-register-btn"
                  type="button"
                  onClick={() => { setMode('register'); setAuthError(null); }}
                  style={{ background: 'none', border: 'none', color: '#1e3a6e', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                >
                  Demander un accès
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button
                  id="go-to-login-btn"
                  type="button"
                  onClick={() => { setMode('login'); setAuthError(null); }}
                  style={{ background: 'none', border: 'none', color: '#1e3a6e', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                >
                  Se connecter
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#94a3b8' }}>
            <div style={{ marginBottom: 4 }}>
              <span>Support</span>  &nbsp;
              <span>Politique de Confidentialité</span>  &nbsp;
              <span>V2.4.0</span>
            </div>
            <div>© 2026 NetServMonitor. Tous droits réservés.</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LoginPage;
