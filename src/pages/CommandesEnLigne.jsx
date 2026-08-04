import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appelApi, getUtilisateur } from '../lib/api';

const STATUTS = [
  { id: '', label: 'Toutes' },
  { id: 'EN_ATTENTE', label: 'En attente' },
  { id: 'CONFIRMEE', label: 'Confirmée' },
  { id: 'PRETE', label: 'Prête' },
  { id: 'LIVREE', label: 'Livrée' },
  { id: 'ANNULEE', label: 'Annulée' },
];

const LABEL_STATUT = Object.fromEntries(STATUTS.filter((s) => s.id).map((s) => [s.id, s.label]));

export default function CommandesEnLigne() {
  const navigate = useNavigate();
  const utilisateur = getUtilisateur();
  const estAdmin = utilisateur?.role === 'ADMIN';

  const [statutFiltre, setStatutFiltre] = useState('');
  const [commandes, setCommandes] = useState([]);
  const [lieux, setLieux] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [commandeOuverte, setCommandeOuverte] = useState(null);
  const [lieuSortieChoisi, setLieuSortieChoisi] = useState({});

  useEffect(() => { chargerCommandes(); }, [statutFiltre]);
  useEffect(() => { appelApi('GET', '/stock/lieux').then(setLieux).catch(() => {}); }, []);

  function chargerCommandes() {
    setChargement(true);
    setErreur('');
    const params = statutFiltre ? `?statut=${statutFiltre}` : '';
    appelApi('GET', `/boutique/admin/commandes${params}`)
      .then(setCommandes)
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }

  // Une commande en livraison (pas de boutique de retrait) doit préciser d'où le
  // stock sera sorti, avant sa toute première bascule vers un statut actif.
  function demandeLieuSortie(commande) {
    const statutsActifs = ['CONFIRMEE', 'PRETE', 'LIVREE'];
    return commande.modeLivraison === 'LIVRAISON' && !commande.stockDecompte
      && !statutsActifs.includes(commande.statut);
  }

  async function changerStatut(commande, statut) {
    setErreur('');
    try {
      const corps = { statut };
      if (demandeLieuSortie(commande) && ['CONFIRMEE', 'PRETE', 'LIVREE'].includes(statut)) {
        const lieuId = lieuSortieChoisi[commande.id];
        if (!lieuId) {
          setErreur("Choisis d'abord la boutique/entrepôt de sortie pour cette commande en livraison.");
          return;
        }
        corps.lieuSortieId = Number(lieuId);
      }
      await appelApi('PUT', `/boutique/admin/commandes/${commande.id}`, corps);
      chargerCommandes();
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.enTete}>
        <button onClick={() => navigate('/dashboard')} style={styles.boutonRetour}>← Tableau de bord</button>
        <h1 style={styles.titre}>Commandes en ligne</h1>
      </div>

      {erreur && <div style={styles.bandeauErreur}>{erreur}</div>}

      <div style={styles.nav}>
        {STATUTS.map((s) => (
          <div
            key={s.id}
            onClick={() => setStatutFiltre(s.id)}
            style={s.id === statutFiltre ? styles.navItemActif : styles.navItem}
          >
            {s.label}
          </div>
        ))}
      </div>

      {chargement && <p style={styles.texteMuet}>Chargement…</p>}
      {!chargement && commandes.length === 0 && (
        <p style={styles.texteMuet}>Aucune commande pour ce filtre.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {commandes.map((c) => (
          <div key={c.id} style={styles.carte}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: 8 }}
              onClick={() => setCommandeOuverte(commandeOuverte === c.id ? null : c.id)}
            >
              <div>
                <strong>{c.numero}</strong> — {c.nomClient} — {c.telephoneClient}
                <div style={styles.texteMuet}>
                  {new Date(c.createdAt).toLocaleString('fr-FR')} — {c.modeLivraison === 'RETRAIT' ? 'Retrait en boutique' : `Livraison — ${c.villeLivraison}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <strong>{Number(c.totalCommande).toLocaleString('fr-FR')} F</strong>
                <span style={styles.badgeStatut}>{LABEL_STATUT[c.statut] || c.statut}</span>
              </div>
            </div>

            {commandeOuverte === c.id && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--cream-deep)', paddingTop: 12 }}>
                <div style={styles.listeLignes}>
                  {c.lignes.map((l) => (
                    <div key={l.id} style={styles.ligneItem}>
                      <span>{l.designation}</span>
                      <span>× {l.quantite} — {Number(l.prixUnitaire).toLocaleString('fr-FR')} F/u</span>
                    </div>
                  ))}
                </div>
                {c.modeLivraison === 'LIVRAISON' && (
                  <p style={styles.texteMuet}>Adresse : {c.adresseLivraison}, {c.villeLivraison}</p>
                )}
                {c.notes && <p style={styles.texteMuet}>Notes : {c.notes}</p>}

                <p style={styles.texteMuet}>
                  {c.stockDecompte
                    ? `✓ Stock sorti (${lieux.find((l) => l.id === c.lieuSortieId)?.nom || 'lieu inconnu'})`
                    : '— Stock pas encore sorti (se fait à la première confirmation)'}
                </p>

                {estAdmin && demandeLieuSortie(c) && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 700, marginTop: 8, maxWidth: 260 }}>
                    Sortir le stock depuis
                    <select
                      value={lieuSortieChoisi[c.id] || ''}
                      onChange={(e) => setLieuSortieChoisi((prec) => ({ ...prec, [c.id]: e.target.value }))}
                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--cream-deep)', fontSize: 14 }}
                    >
                      <option value="">— Choisir —</option>
                      {lieux.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
                    </select>
                  </label>
                )}

                {estAdmin && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {STATUTS.filter((s) => s.id && s.id !== c.statut).map((s) => (
                      <button key={s.id} onClick={() => changerStatut(c, s.id)} style={styles.boutonRetour}>
                        Passer à "{s.label}"
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 24, fontFamily: 'var(--font-body)', color: 'var(--brown-ink)', display: 'flex', flexDirection: 'column', gap: 16 },
  enTete: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'space-between' },
  titre: { fontFamily: 'var(--font-display)', margin: 0, fontSize: 24, flex: 1 },
  boutonRetour: { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--gold-mid)', background: 'transparent', color: 'var(--brown-ink)', cursor: 'pointer', fontSize: 13 },
  nav: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  navItem: { padding: '8px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', border: '1px solid var(--cream-deep)' },
  navItemActif: { padding: '8px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', background: 'var(--gold-deep)', color: 'var(--white)', fontWeight: 600, border: '1px solid var(--gold-deep)' },
  texteMuet: { fontSize: 13, color: 'var(--brown-soft)' },
  bandeauErreur: { padding: '10px 14px', borderRadius: 8, background: '#FBE4E1', color: 'var(--error)', fontSize: 14, fontWeight: 600 },
  carte: { background: 'var(--white)', borderRadius: 12, padding: 16 },
  badgeStatut: { fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'var(--cream-deep)' },
  listeLignes: { display: 'flex', flexDirection: 'column', gap: 6 },
  ligneItem: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' },
};
