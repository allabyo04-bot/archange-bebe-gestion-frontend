import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appelApi, getUtilisateur, setSession, getToken, clearSession } from '../lib/api';
import './Login.css';

// Affiché juste après la connexion quand un administrateur a réinitialisé le
// PIN de l'utilisateur (doitChangerPin) — bloque l'accès au reste de l'appli
// tant qu'un nouveau code personnel n'a pas été choisi.
export default function ChangerPinObligatoire() {
  const navigate = useNavigate();
  const utilisateur = getUtilisateur();
  const [ancienPin, setAncienPin] = useState('');
  const [nouveauPin, setNouveauPin] = useState('');
  const [confirmationPin, setConfirmationPin] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErreur('');
    if (!/^\d{4,6}$/.test(nouveauPin)) {
      setErreur('Le nouveau PIN doit comporter entre 4 et 6 chiffres.');
      return;
    }
    if (nouveauPin !== confirmationPin) {
      setErreur('Les deux saisies du nouveau PIN ne correspondent pas.');
      return;
    }
    setChargement(true);
    try {
      await appelApi('POST', '/utilisateurs/changer-mon-pin', { ancienPin, nouveauPin });
      setSession(getToken(), { ...utilisateur, doitChangerPin: false });
      navigate('/dashboard');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-panel--brand">
        <div className="arc arc--one" />
        <div className="arc arc--two" />
        <div className="brand-mark">
          <div className="u-badge">
            <img src="/logo-archange-bebe.png" alt="Archange Bébé" />
          </div>
          <span className="wordmark">Archange Bébé</span>
        </div>
        <div className="brand-copy">
          <span className="tagline">Pour Le Bonheur Des Boudchou</span>
        </div>
      </div>

      <div className="login-panel--form">
        <div className="login-card">
          <h2>Nouveau code requis</h2>
          <p className="sub">
            Bonjour {utilisateur?.nomComplet} — votre code PIN a été réinitialisé par un administrateur.
            Choisissez un nouveau code personnel pour continuer.
          </p>

          {erreur && <div className="login-error">{erreur}</div>}

          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Code actuel (celui qui vous a été communiqué)</label>
              <input type="password" inputMode="numeric" value={ancienPin} onChange={(e) => setAncienPin(e.target.value)} required />
            </div>
            <div className="field">
              <label>Nouveau code (4 à 6 chiffres)</label>
              <input type="password" inputMode="numeric" value={nouveauPin} onChange={(e) => setNouveauPin(e.target.value)} required />
            </div>
            <div className="field">
              <label>Confirmez le nouveau code</label>
              <input type="password" inputMode="numeric" value={confirmationPin} onChange={(e) => setConfirmationPin(e.target.value)} required />
            </div>
            <button type="submit" disabled={chargement}>
              {chargement ? 'Enregistrement…' : 'Valider mon nouveau code'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
            Ce n'est pas vous ?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); clearSession(); navigate('/'); }}>
              Se déconnecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
