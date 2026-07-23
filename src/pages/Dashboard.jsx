import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appelApi, clearSession, getUtilisateur } from '../lib/api';

const LIENS = [
  { id: 'ventes', label: 'Ventes', chemin: '/ventes', adminSeulement: false },
  { id: 'clients', label: 'Clients', chemin: '/clients', adminSeulement: false },
  { id: 'articles', label: 'Articles', chemin: '/articles', adminSeulement: true },
  { id: 'stock', label: 'Stock', chemin: '/stock', adminSeulement: true },
  { id: 'etats', label: 'États', chemin: '/etats', adminSeulement: false },
  { id: 'cartes-cadeaux', label: 'Cartes cadeaux', chemin: '/cartes-cadeaux', adminSeulement: false },
  { id: 'depenses', label: 'Dépenses', chemin: '/depenses', adminSeulement: false },
  { id: 'listes-cadeaux', label: 'Listes cadeaux', chemin: '/listes-cadeaux', adminSeulement: false },
  { id: 'utilisateurs', label: 'Utilisateurs', chemin: '/utilisateurs', adminSeulement: true },
  { id: 'roles', label: 'Rôles', chemin: '/roles', adminSeulement: true },
  { id: 'parametres', label: 'Paramètres', chemin: '/parametres', adminSeulement: true },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const utilisateur = getUtilisateur();
  const estAdmin = utilisateur?.role === 'ADMIN';
  const [dashboard, setDashboard] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    appelApi('GET', '/dashboard')
      .then(setDashboard)
      .catch((err) => setErreur(err.message));
  }, []);

  function deconnexion() {
    clearSession();
    navigate('/');
  }

  return (
    <div style={styles.page} className="app-shell">
      <aside style={styles.sidebar} className="app-sidebar">
        <div style={styles.marque}>
          <img src="/logo-archange-bebe.png" alt="Archange Bébé" style={styles.logoMarque} />
          <span>ARCHANGE BÉBÉ</span>
        </div>

        <nav style={styles.nav} className="app-nav">
          {LIENS.filter((lien) => !lien.adminSeulement || estAdmin).map((lien) => (
            <button key={lien.id} onClick={() => navigate(lien.chemin)} style={styles.boutonNav}>
              {lien.label}
            </button>
          ))}
        </nav>

        <button onClick={deconnexion} style={styles.boutonDeconnexion}>
          Déconnexion
        </button>

        <div style={styles.pied} className="app-pied">Gestion Commerciale et CRM by Phil</div>
      </aside>

      <main style={styles.contenu} className="app-content">
        <h1 style={styles.titre}>Bonjour, {utilisateur?.nomComplet || 'Administrateur'} 👋</h1>

        {erreur && <p style={{ color: 'var(--error)' }}>{erreur}</p>}

        {dashboard && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, maxWidth: 800 }}>
            <div style={{ background: 'var(--cream-deep)', padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Ventes du jour</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboard.ventes.total.toLocaleString('fr-FR')} F</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{dashboard.ventes.nombre} vente(s)</div>
            </div>
            <div style={{ background: 'var(--cream-deep)', padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Alertes stock</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboard.alertesStock.length}</div>
            </div>
            <div style={{ background: 'var(--cream-deep)', padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Demandes de remise</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboard.demandesRemiseEnAttente}</div>
            </div>
          </div>
        )}

        <p style={{ marginTop: 32, fontSize: 13, opacity: 0.6 }}>
          Le reste de l'interface (articles, ventes, cartes cadeaux...) arrive dans les prochaines sessions.
        </p>
      </main>
    </div>
  );
}

const styles = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-body)', color: 'var(--brown-ink)' },
  sidebar: {
    width: 220, background: 'var(--cream-deep)', padding: '24px 16px', display: 'flex', flexDirection: 'column',
    gap: 8, flexShrink: 0, borderRight: '1px solid var(--gold-light)',
  },
  marque: {
    display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)',
    fontWeight: 600, fontSize: 15, letterSpacing: 0.5, marginBottom: 20, color: 'var(--brown-deep)',
  },
  logoMarque: { width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: 'var(--white)', padding: 2 },
  nav: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  boutonNav: {
    padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gold-deep)', background: 'var(--gold-deep)',
    color: 'var(--white)', cursor: 'pointer', fontWeight: 600, textAlign: 'left', fontSize: 14,
  },
  boutonDeconnexion: {
    padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gold-deep)', background: 'transparent',
    cursor: 'pointer', textAlign: 'left', fontSize: 14, marginTop: 12, color: 'var(--brown-ink)',
  },
  pied: { marginTop: 20, fontSize: 11, opacity: 0.5, textAlign: 'center' },
  contenu: { flex: 1, padding: 32 },
  titre: { marginTop: 0, marginBottom: 24, fontFamily: 'var(--font-display)', fontWeight: 600 },
};
