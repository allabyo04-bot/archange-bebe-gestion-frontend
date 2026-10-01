import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Articles from './pages/Articles.jsx';
import Ventes from './pages/Ventes.jsx';
import EcranClient from './pages/EcranClient.jsx';
import Stock from './pages/Stock.jsx';
import CartesCadeaux from './pages/CartesCadeaux.jsx';
import ListesCadeaux from './pages/ListesCadeaux.jsx';
import ListeCadeauPublique from './pages/ListeCadeauPublique.jsx';
import Etats from './pages/Etats.jsx';
import Utilisateurs from './pages/Utilisateurs.jsx';
import Roles from './pages/Roles.jsx';
import Familles from './pages/Familles.jsx';
import Depenses from './pages/Depenses.jsx';
import Clients from './pages/Clients';
import CommandesEnLigne from './pages/CommandesEnLigne.jsx';
import Parametres from './pages/Parametres.jsx';
import ChangerPinObligatoire from './pages/ChangerPinObligatoire.jsx';
import { getUtilisateur, aAcces } from './lib/api';
import { LIENS } from './pages/Dashboard.jsx';

const MODULES_PAR_CHEMIN = Object.fromEntries(LIENS.map((l) => [l.chemin, l.modules]));
// Gestion des familles (renommer, etc.) : admins seulement. La création d'une famille par
// un non-admin se fait directement depuis le formulaire « Nouvel article ».
MODULES_PAR_CHEMIN['/familles'] = [];

function estConnecte() {
  return !!localStorage.getItem('jesma_token');
}

function doitChangerPin() {
  const brut = localStorage.getItem('jesma_utilisateur');
  if (!brut) return false;
  try { return !!JSON.parse(brut).doitChangerPin; } catch { return false; }
}

// modules : si fourni, le compte doit avoir au moins un de ces modules (ou être admin) ;
// tableau vide = réservé aux administrateurs. Évite qu'un profil limité (ex. gestionnaire
// de stock) atteigne un écran non autorisé en tapant l'adresse à la main.
function RouteProtegee({ children, modules }) {
  if (!estConnecte()) return <Navigate to="/" replace />;
  if (doitChangerPin()) return <Navigate to="/changer-pin-obligatoire" replace />;
  if (modules) {
    const u = getUtilisateur();
    const estAdmin = u?.role === 'ADMIN';
    if (!estAdmin && (modules.length === 0 || !aAcces(...modules))) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={estConnecte() ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/changer-pin-obligatoire" element={estConnecte() ? <ChangerPinObligatoire /> : <Navigate to="/" replace />} />
      <Route
        path="/dashboard"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/dashboard']}>
            <Dashboard />
          </RouteProtegee>
        }
      />
      <Route
        path="/articles"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/articles']}>
            <Articles />
          </RouteProtegee>
        }
      />
      <Route
        path="/roles"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/roles']}>
            <Roles />
          </RouteProtegee>
        }
      />
      <Route
        path="/familles"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/familles']}>
            <Familles />
          </RouteProtegee>
        }
      />
      <Route
        path="/parametres"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/parametres']}>
            <Parametres />
          </RouteProtegee>
        }
      />
      <Route
        path="/ventes"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/ventes']}>
            <Ventes />
          </RouteProtegee>
        }
      />
      <Route
        path="/stock"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/stock']}>
            <Stock />
          </RouteProtegee>
        }
      />
      <Route
        path="/etats"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/etats']}>
            <Etats />
          </RouteProtegee>
        }
      />
      <Route
        path="/utilisateurs"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/utilisateurs']}>
            <Utilisateurs />
          </RouteProtegee>
        }
      />
      <Route
        path="/cartes-cadeaux"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/cartes-cadeaux']}>
            <CartesCadeaux />
          </RouteProtegee>
        }
      />
      <Route
        path="/depenses"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/depenses']}>
            <Depenses />
          </RouteProtegee>
        }
      />
      <Route
        path="/listes-cadeaux"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/listes-cadeaux']}>
            <ListesCadeaux />
          </RouteProtegee>
        }
      />
      <Route path="/liste-cadeau/:codeAcces" element={<ListeCadeauPublique />} />
      <Route path="/ecran-client" element={<EcranClient />} />
      <Route
  path="/clients"
  element={
    <RouteProtegee modules={MODULES_PAR_CHEMIN['/clients']}>
      <Clients />
    </RouteProtegee>
  }
/>
      <Route
        path="/commandes-en-ligne"
        element={
          <RouteProtegee modules={MODULES_PAR_CHEMIN['/commandes-en-ligne']}>
            <CommandesEnLigne />
          </RouteProtegee>
        }
      />
    </Routes>
  );
}