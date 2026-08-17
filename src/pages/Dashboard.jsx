import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appelApi, clearSession, getUtilisateur } from '../lib/api';

const LIENS = [
  { id: 'ventes', label: 'Ventes', chemin: '/ventes', adminSeulement: false },
  { id: 'clients', label: 'Clients', chemin: '/clients', adminSeulement: false },
  { id: 'articles', label: 'Articles', chemin: '/articles', adminSeulement: true },
  { id: 'stock', label: 'Stock', chemin: '/stock', adminSeulement: true },
  { id: 'commandes-en-ligne', label: 'Commandes en ligne', chemin: '/commandes-en-ligne', adminSeulement: false },
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
            <div
              style={{ background: 'var(--cream-deep)', padding: 20, borderRadius: 12, cursor: 'pointer' }}
              onClick={() => navigate('/ventes?onglet=historique&periode=jour')}
            >
              <div style={{ fontSize: 13, opacity: 0.7 }}>Ventes du jour</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboard.ventes.total.toLocaleString('fr-FR')} F</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{dashboard.ventes.nombre} vente(s)</div>
            </div>
            {!estAdmin && (
              <div style={{ background: 'var(--cream-deep)', padding: 20, borderRadius: 12 }}>
                <div style={{ fontSize: 13, opacity: 0.7 }}>Alertes stock</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboard.alertesStock.length}</div>
              </div>
            )}
            {estAdmin && (
              <CarteRemisesVsVentes
                ventesMois={dashboard.parBoutique.reduce((s, b) => s + b.ventesMois, 0)}
                remisesMois={dashboard.remises.mois.total}
              />
            )}
            <div style={{ background: 'var(--cream-deep)', padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Demandes de remise</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboard.demandesRemiseEnAttente}</div>
            </div>
            {estAdmin && (
              <>
                <div style={{ background: 'var(--cream-deep)', padding: 20, borderRadius: 12 }}>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>Remises du jour</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboard.remises.jour.total.toLocaleString('fr-FR')} F</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{dashboard.remises.jour.nombre} vente(s) remisée(s)</div>
                </div>
                <div
                  style={{ background: 'var(--cream-deep)', padding: 20, borderRadius: 12, cursor: 'pointer' }}
                  onClick={() => navigate('/ventes?onglet=historique&periode=mois&remise=1')}
                >
                  <div style={{ fontSize: 13, opacity: 0.7 }}>Remises du mois en cours</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboard.remises.mois.total.toLocaleString('fr-FR')} F</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{dashboard.remises.mois.nombre} vente(s) remisée(s)</div>
                </div>
              </>
            )}
          </div>
        )}

        {dashboard && estAdmin && dashboard.ventesEnLigne && (
          <div style={{ marginTop: 32, maxWidth: 800 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 12 }}>
              Ventes en ligne (site e-commerce)
            </h2>
            <p style={{ fontSize: 12, color: 'var(--brown-soft)', marginTop: -8, marginBottom: 12 }}>
              Comptées séparément du CA boutique — uniquement les commandes marquées "Livrée" (une commande en
              attente peut encore être annulée).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div style={{ background: 'var(--cream-deep)', padding: 20, borderRadius: 12 }}>
                <div style={{ fontSize: 13, opacity: 0.7 }}>En ligne — aujourd'hui</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{dashboard.ventesEnLigne.jour.total.toLocaleString('fr-FR')} F</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{dashboard.ventesEnLigne.jour.nombre} commande(s) livrée(s)</div>
              </div>
              <div style={{ background: 'var(--cream-deep)', padding: 20, borderRadius: 12 }}>
                <div style={{ fontSize: 13, opacity: 0.7 }}>En ligne — ce mois-ci</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{dashboard.ventesEnLigne.mois.total.toLocaleString('fr-FR')} F</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{dashboard.ventesEnLigne.mois.nombre} commande(s) livrée(s)</div>
              </div>
              <div style={{ background: '#E4F3E6', padding: 20, borderRadius: 12 }}>
                <div style={{ fontSize: 13, opacity: 0.7 }}>Total combiné — aujourd'hui</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1E6B36' }}>
                  {(dashboard.ventes.total + dashboard.ventesEnLigne.jour.total).toLocaleString('fr-FR')} F
                </div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>Boutique + site en ligne</div>
              </div>
            </div>
          </div>
        )}

        {dashboard && estAdmin && dashboard.parBoutique.length > 0 && (
          <div style={{ marginTop: 32, maxWidth: 800 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 12 }}>
              Objectif du mois par boutique
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {dashboard.parBoutique.map((b) => (
                <div key={b.lieuId} style={{ background: 'var(--cream-deep)', padding: 20, borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{b.nom}</span>
                    <span style={{ fontSize: 13, opacity: 0.7 }}>
                      {b.ventesMois.toLocaleString('fr-FR')} F / {b.objectifMensuel.toLocaleString('fr-FR')} F ({b.pourcentageObjectif}%)
                    </span>
                  </div>
                  <div style={{ background: 'var(--cream)', borderRadius: 8, height: 14, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, b.pourcentageObjectif)}%`,
                        height: '100%',
                        background: b.pourcentageObjectif >= 100 ? '#1E6B36' : 'var(--gold-deep)',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 13, opacity: 0.8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>
                      Ventes du jour : {b.ventesJour.total.toLocaleString('fr-FR')} F ({b.ventesJour.nombre} vente(s))
                    </span>
                    <span>Coût d'achat (mois) : {b.coutMarchandiseMois.toLocaleString('fr-FR')} F</span>
                    <span>Dépenses (mois) : {b.depensesMois.toLocaleString('fr-FR')} F</span>
                    <span style={{ fontWeight: 700, color: b.margeMois >= 0 ? '#1E6B36' : 'var(--error)' }}>
                      Marge nette du mois : {b.margeMois.toLocaleString('fr-FR')} F
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
              L'objectif de chaque boutique se règle dans Paramètres → Lieux.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// Donut "Remises vs Ventes (mois en cours)" — remplace la carte Alertes stock
// pour les admins. Montre la part des remises accordées dans le total facturé
// (ventes nettes + remises = montant brut avant remise). Pur SVG, pas de
// dépendance externe.
function CarteRemisesVsVentes({ ventesMois, remisesMois }) {
  const brut = ventesMois + remisesMois;
  const pourcentageRemises = brut > 0 ? (remisesMois / brut) * 100 : 0;

  const rayon = 34;
  const circonference = 2 * Math.PI * rayon;
  const longueurRemises = (pourcentageRemises / 100) * circonference;

  return (
    <div style={{
      background: 'var(--cream-deep)', padding: 20, borderRadius: 12,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <div style={{ fontSize: 13, opacity: 0.7, alignSelf: 'flex-start' }}>Remises vs Ventes (mois)</div>

      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="degradeVentes" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--gold-mid, #6E93C4)" />
              <stop offset="100%" stopColor="var(--gold-deep, #2E4E9E)" />
            </linearGradient>
            <linearGradient id="degradeRemises" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--bordeaux-tendre, #A8455C)" />
              <stop offset="100%" stopColor="var(--bordeaux-deep, #8E3159)" />
            </linearGradient>
          </defs>
          <circle
            cx="50" cy="50" r={rayon} fill="none"
            stroke="url(#degradeVentes)" strokeWidth="13" strokeLinecap="round"
          />
          {pourcentageRemises > 0 && (
            <circle
              cx="50" cy="50" r={rayon} fill="none"
              stroke="url(#degradeRemises)" strokeWidth="13" strokeLinecap="round"
              strokeDasharray={`${longueurRemises} ${circonference - longueurRemises}`}
            />
          )}
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{pourcentageRemises.toFixed(1)}%</div>
          <div style={{ fontSize: 10, opacity: 0.6 }}>remisé</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, fontSize: 11, opacity: 0.85 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold-deep, #2E4E9E)', display: 'inline-block' }} />
          Ventes : {ventesMois.toLocaleString('fr-FR')} F
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bordeaux-deep, #8E3159)', display: 'inline-block' }} />
          Remises : {remisesMois.toLocaleString('fr-FR')} F
        </div>
      </div>
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
