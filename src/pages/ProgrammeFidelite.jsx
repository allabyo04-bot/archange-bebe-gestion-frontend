import { useEffect, useState } from 'react';
import { appelApi } from '../lib/api';
import { lienWhatsApp } from '../lib/telephone';

// Programme de fidélité (administrateur) : tout se règle ici, rien n'est écrit en dur.
//  - paliers de bonus : quand le cumul courant d'un client atteint le seuil, il a droit au bonus ;
//  - statuts : niveaux selon le cumul à vie (badge sur sa fiche, ligne sur le ticket) ;
//  - réglages : alerte avant un palier, ventes avec remise, ventes à crédit.
// Éteint au départ : à allumer seulement une fois les montants validés par la direction.
const EXEMPLE = {
  paliers: [{ seuil: '500000', montantBonus: '5000' }, { seuil: '1000000', montantBonus: '10000' }],
  statuts: [{ nom: 'Bienvenue', seuil: '0' }, { nom: 'Fidèle', seuil: '150000' }, { nom: 'Privilège', seuil: '400000' }, { nom: 'VIP', seuil: '1000000' }],
};

export default function ProgrammeFidelite() {
  const [form, setForm] = useState(null);
  const [etatInitial, setEtatInitial] = useState(null);
  const [classement, setClassement] = useState(null);
  const [bilan, setBilan] = useState(null);
  const [depuis, setDepuis] = useState('2026-01-01');
  const [reprise, setReprise] = useState(null); // résultat de l'aperçu (avec la date aperçue)
  const [repriseMsg, setRepriseMsg] = useState('');
  const [repriseEnCours, setRepriseEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [enCours, setEnCours] = useState(false);

  function versFormulaire(p) {
    return {
      actif: p.actif,
      alerteReste: String(p.alerteReste),
      exclureRemises: p.exclureRemises,
      compterCredit: p.compterCredit,
      valeurPoint: String(p.valeurPoint || 1000),
      paliers: p.paliers.map((x) => ({ seuil: String(x.seuil), montantBonus: String(x.montantBonus) })),
      statuts: p.statuts.map((x) => ({ nom: x.nom, seuil: String(x.seuil) })),
    };
  }

  function charger() {
    appelApi('GET', '/programme-fidelite/programme')
      .then((p) => { setForm(versFormulaire(p)); setEtatInitial(p.actif); })
      .catch((err) => setErreur(err.message));
    appelApi('GET', '/programme-fidelite/classement').then(setClassement).catch(() => {});
    appelApi('GET', '/programme-fidelite/bilan').then(setBilan).catch(() => {});
  }
  useEffect(() => { charger(); }, []);

  function changerLigne(liste, index, champ, valeur) {
    setForm((f) => ({ ...f, [liste]: f[liste].map((l, i) => (i === index ? { ...l, [champ]: valeur } : l)) }));
    setMessage('');
  }
  function ajouterLigne(liste, modele) { setForm((f) => ({ ...f, [liste]: [...f[liste], modele] })); setMessage(''); }
  function retirerLigne(liste, index) { setForm((f) => ({ ...f, [liste]: f[liste].filter((_, i) => i !== index) })); setMessage(''); }

  async function enregistrer() {
    setErreur(''); setMessage('');
    if (form.actif && !etatInitial) {
      const ok = window.confirm("Allumer le programme maintenant ?\n\nLes caissières verront le statut et les points de chaque client identifié, et la remise de fidélité se déduira automatiquement. Si vous voulez compter l'historique des ventes, lancez d'abord la reprise (voir la note en bas de page).");
      if (!ok) return;
    }
    setEnCours(true);
    try {
      const corps = {
        actif: form.actif,
        alerteReste: Number(form.alerteReste),
        exclureRemises: form.exclureRemises,
        compterCredit: form.compterCredit,
        valeurPoint: Number(form.valeurPoint),
        paliers: form.paliers.map((p) => ({ seuil: Number(p.seuil), montantBonus: Number(p.montantBonus) })),
        statuts: form.statuts.map((s) => ({ nom: s.nom, seuil: Number(s.seuil) })),
      };
      const p = await appelApi('PUT', '/programme-fidelite/programme', corps);
      setForm(versFormulaire(p));
      setEtatInitial(p.actif);
      setMessage('Programme enregistré.');
      appelApi('GET', '/programme-fidelite/classement').then(setClassement).catch(() => {});
      appelApi('GET', '/programme-fidelite/bilan').then(setBilan).catch(() => {});
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  }

  async function lancerReprise(appliquer) {
    setErreur(''); setRepriseMsg(''); setRepriseEnCours(true);
    try {
      const r = await appelApi('POST', '/programme-fidelite/reprise', { depuis, appliquer });
      if (appliquer) {
        setReprise(null);
        setRepriseMsg(`${r.amettreAJour} client(s) mis à jour.`);
        charger();
      } else {
        setReprise({ ...r, depuis });
      }
    } catch (err) {
      setErreur(err.message);
    } finally {
      setRepriseEnCours(false);
    }
  }

  if (!form) return <p style={styles.muet}>{erreur || 'Chargement…'}</p>;
  const f = (n) => Number(n).toLocaleString('fr-FR');
  const vp = Number(form.valeurPoint) > 0 ? Number(form.valeurPoint) : 1000;

  return (
    <div>
      {bilan && bilan.actif && (
        <div style={{ marginBottom: 18 }}>
          <h3 style={styles.titre}>Ce que le programme a coûté</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[['Ce mois', bilan.cout.mois], ['Depuis janvier', bilan.cout.annee], ['Depuis le début', bilan.cout.total]].map(([titre, c]) => (
              <div key={titre} style={styles.carteChiffre}>
                <div style={styles.muet}>{titre}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{f(c.total)} F</div>
                <div style={styles.muet}>{c.nombre} remise(s) accordée(s)</div>
              </div>
            ))}
            <div style={styles.carteChiffre}>
              <div style={styles.muet}>Remises gagnées, pas encore utilisées</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{f(bilan.montantBonusEnAttente)} F</div>
              <div style={styles.muet}>{bilan.nombreBonusEnAttente} client(s)</div>
            </div>
          </div>

          <h3 style={styles.titre}>Clients proches d'un palier</h3>
          {bilan.proches.length === 0 ? (
            <p style={styles.muet}>Aucun client à moins de {f(Math.ceil((form.alerteReste || 0) / vp))} points d'un palier pour le moment.</p>
          ) : bilan.proches.map((c) => {
            const wa = lienWhatsApp(c.telephone);
            return (
              <div key={c.id} style={styles.ligne}>
                <span style={{ fontWeight: 600 }}>{c.nomComplet}</span>
                <span style={styles.muet}>
                  {f(c.pointsCourants)} pts · encore {f(c.prochainPalier.restePoints)} pts pour {f(c.prochainPalier.bonus)} F
                  {wa && <> · <a href={wa} target="_blank" rel="noopener noreferrer" style={{ color: '#1E6B36', fontWeight: 600 }}>WhatsApp</a></>}
                </span>
              </div>
            );
          })}

          {bilan.bonusEnAttente.length > 0 && (
            <>
              <h3 style={styles.titre}>Remises gagnées à venir (prochain achat)</h3>
              {bilan.bonusEnAttente.map((c) => {
                const wa = lienWhatsApp(c.telephone);
                return (
                  <div key={c.id} style={styles.ligne}>
                    <span style={{ fontWeight: 600 }}>{c.nomComplet}</span>
                    <span style={styles.muet}>
                      {f(c.pointsCourants)} pts · remise de {f(c.bonusDisponible)} F
                      {wa && <> · <a href={wa} target="_blank" rel="noopener noreferrer" style={{ color: '#1E6B36', fontWeight: 600 }}>WhatsApp</a></>}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
      <div style={styles.carteRegle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.actif} onChange={(e) => { setForm({ ...form, actif: e.target.checked }); setMessage(''); }} />
          Programme de fidélité actif
        </label>
        <span style={styles.muet}>
          {form.actif
            ? 'Actif : les clients identifiés cumulent des achats, gagnent des statuts et des bonus.'
            : "Éteint : rien n'est comptabilisé et la caisse reste inchangée."}
        </span>
      </div>

      <h3 style={styles.titre}>Paliers de bonus</h3>
      <p style={styles.muet}>
        Quand le cumul courant d'un client atteint le seuil, il a droit à la remise (le plus haut palier atteint). Elle est déduite AUTOMATIQUEMENT
        du total de son prochain achat comptant, sans autre remise, d'au moins son montant ; le cumul courant repart alors de zéro. Le client,
        lui, ne voit que des points (1 point = {f(vp)} F d'achats).
      </p>
      {form.paliers.map((p, i) => (
        <div key={i} style={styles.ligneForm}>
          <label style={styles.champ}>Seuil (F)<input type="number" style={styles.input} value={p.seuil} onChange={(e) => changerLigne('paliers', i, 'seuil', e.target.value)} /></label>
          <span style={{ ...styles.muet, alignSelf: 'center' }}>= {f(Math.floor(Number(p.seuil || 0) / vp))} points</span>
          <label style={styles.champ}>Bonus (F)<input type="number" style={styles.input} value={p.montantBonus} onChange={(e) => changerLigne('paliers', i, 'montantBonus', e.target.value)} /></label>
          <button onClick={() => retirerLigne('paliers', i)} style={styles.retirer}>Retirer</button>
        </div>
      ))}
      <button onClick={() => ajouterLigne('paliers', { seuil: '', montantBonus: '' })} style={styles.secondaire}>+ Ajouter un palier</button>

      <h3 style={styles.titre}>Statuts (selon le cumul à vie)</h3>
      <p style={styles.muet}>Le cumul à vie n'est jamais effacé. Le premier statut devrait commencer à 0 pour que tout client identifié en ait un.</p>
      {form.statuts.map((s, i) => (
        <div key={i} style={styles.ligneForm}>
          <label style={styles.champ}>Nom<input style={styles.input} value={s.nom} onChange={(e) => changerLigne('statuts', i, 'nom', e.target.value)} /></label>
          <label style={styles.champ}>Cumul à vie (F)<input type="number" style={styles.input} value={s.seuil} onChange={(e) => changerLigne('statuts', i, 'seuil', e.target.value)} /></label>
          <button onClick={() => retirerLigne('statuts', i)} style={styles.retirer}>Retirer</button>
        </div>
      ))}
      <button onClick={() => ajouterLigne('statuts', { nom: '', seuil: '' })} style={styles.secondaire}>+ Ajouter un statut</button>

      <h3 style={styles.titre}>Réglages</h3>
      <label style={styles.champ}>
        Valeur d'un point (F d'achats pour 1 point)
        <input type="number" min="1" style={{ ...styles.input, maxWidth: 160 }} value={form.valeurPoint} onChange={(e) => { setForm({ ...form, valeurPoint: e.target.value }); setMessage(''); }} />
      </label>
      <label style={styles.champ}>
        Alerte à la caisse quand il reste moins de (F) avant un palier
        <input type="number" style={{ ...styles.input, maxWidth: 160 }} value={form.alerteReste} onChange={(e) => { setForm({ ...form, alerteReste: e.target.value }); setMessage(''); }} />
      </label>
      <label style={styles.coche}>
        <input type="checkbox" checked={form.exclureRemises} onChange={(e) => { setForm({ ...form, exclureRemises: e.target.checked }); setMessage(''); }} />
        Une vente avec remise ne compte pas dans les cumuls
      </label>
      <label style={styles.coche}>
        <input type="checkbox" checked={form.compterCredit} onChange={(e) => { setForm({ ...form, compterCredit: e.target.checked }); setMessage(''); }} />
        Les ventes à crédit comptent aussi (sinon, seulement les ventes comptant)
      </label>

      {erreur && <p style={{ color: 'var(--error)' }}>{erreur}</p>}
      {message && <p style={{ color: '#1E6B36', fontWeight: 700 }}>{message}</p>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <button onClick={enregistrer} disabled={enCours} style={styles.principal}>{enCours ? 'Enregistrement…' : 'Enregistrer le programme'}</button>
        <button onClick={() => { setForm({ ...form, paliers: EXEMPLE.paliers, statuts: form.statuts.length ? form.statuts : EXEMPLE.statuts }); setMessage(''); }} style={styles.secondaire}>
          Charger la règle 500 000 → 5 000 / 1 000 000 → 10 000
        </button>
      </div>
      <h3 style={styles.titre}>Reprendre l'historique</h3>
      <p style={styles.muet}>
        Avant d'allumer le programme, on peut compter les achats déjà faits par les clients identifiés (nom + téléphone), depuis une date.
        Faites d'abord un aperçu : rien n'est modifié tant que vous n'avez pas cliqué sur Appliquer.
      </p>
      <div style={styles.ligneForm}>
        <label style={styles.champ}>À partir du
          <input type="date" style={styles.input} value={depuis} onChange={(e) => { setDepuis(e.target.value); setReprise(null); setRepriseMsg(''); }} />
        </label>
        <button onClick={() => lancerReprise(false)} disabled={repriseEnCours || !depuis} style={styles.secondaire}>
          {repriseEnCours ? 'Calcul…' : 'Aperçu'}
        </button>
        {reprise && reprise.depuis === depuis && reprise.amettreAJour > 0 && (
          <button onClick={() => lancerReprise(true)} disabled={repriseEnCours} style={styles.principal}>
            Appliquer à {reprise.amettreAJour} client(s)
          </button>
        )}
      </div>
      {repriseMsg && <p style={{ color: '#1E6B36', fontWeight: 700 }}>{repriseMsg}</p>}
      {reprise && (
        <div style={{ marginTop: 6 }}>
          <p style={styles.muet}>
            Aperçu depuis le {reprise.depuis} : {reprise.clientsAvecAchats} client(s) identifié(s) avec des achats, {reprise.dejaCorrects} déjà correct(s),{' '}
            {reprise.amettreAJour} à mettre à jour. {reprise.ventesSansClientIdentifie} vente(s) ignorée(s) faute de client identifié.
            {!reprise.programmeActif && ' Le programme est éteint : les points seront prêts pour son allumage.'}
          </p>
          {reprise.clients.slice(0, 100).map((c) => (
            <div key={c.id} style={styles.ligne}>
              <span style={{ fontWeight: 600 }}>{c.nomComplet}</span>
              <span style={styles.muet}>
                {f(c.montant)} F · {f(c.points)} pts · {c.achats} achat(s){c.statut ? ` · ${c.statut}` : ''}{c.bonusDisponible > 0 ? ` · remise de ${f(c.bonusDisponible)} F à la prochaine vente` : ''}
              </span>
            </div>
          ))}
          {reprise.clients.length > 100 && <p style={styles.muet}>… et {reprise.clients.length - 100} autre(s).</p>}
          {reprise.proteges.length > 0 && <p style={styles.muet}>Non touchés (déjà suivis par le programme) : {reprise.proteges.join(', ')}.</p>}
        </div>
      )}

      {classement && classement.clients.length > 0 && (
        <>
          <h3 style={styles.titre}>Meilleurs cumuls</h3>
          {classement.clients.map((c) => (
            <div key={c.id} style={styles.ligne}>
              <span style={{ fontWeight: 600 }}>{c.nomComplet}</span>
              <span style={styles.muet}>{c.statut || '—'} · {f(c.pointsCourants)} pts · à vie {f(c.pointsTotal)} pts{c.bonusDisponible > 0 ? ` · remise ${f(c.bonusDisponible)} F gagnée` : ''}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const styles = {
  carteRegle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: 'var(--cream)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, flexWrap: 'wrap' },
  titre: { fontSize: 15, margin: '18px 0 6px' },
  muet: { color: 'var(--brown-soft)', fontSize: 12.5 },
  ligneForm: { display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 },
  champ: { display: 'flex', flexDirection: 'column', fontSize: 13, gap: 4 },
  input: { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--cream-deep)', fontSize: 14, minWidth: 140 },
  coche: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, margin: '8px 0', cursor: 'pointer' },
  principal: { padding: '10px 18px', borderRadius: 8, border: 'none', background: 'var(--gold-deep)', color: 'var(--white)', cursor: 'pointer', fontWeight: 600 },
  secondaire: { padding: '8px 14px', borderRadius: 8, border: '1px solid var(--gold-mid)', background: 'transparent', cursor: 'pointer', fontSize: 13 },
  retirer: { border: 'none', background: 'transparent', color: 'var(--error)', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '8px 4px' },
  carteChiffre: { background: 'var(--cream)', borderRadius: 10, padding: '10px 14px', minWidth: 160 },
  ligne: { display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--cream-deep)', fontSize: 13.5, flexWrap: 'wrap' },
};
