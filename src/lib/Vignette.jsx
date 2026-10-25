import { useState } from 'react';
import { urlVignette } from './photos';

// Petite photo carrée d'un article. La case garde toujours la même taille (pas de
// saut d'affichage pendant le chargement), l'image ne se charge que lorsqu'elle devient
// visible, et si l'article n'a pas de photo (ou si elle ne charge pas) on affiche un
// carton à la place.
export default function Vignette({ url, taille = 44 }) {
  const [enErreur, setEnErreur] = useState(false);
  const src = urlVignette(url, taille * 2); // x2 : net sur les écrans haute densité

  const boite = {
    width: taille, height: taille, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
    background: 'var(--cream-deep)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: Math.round(taille * 0.45),
  };

  if (!src || enErreur) return <div style={boite} title="Pas de photo">📦</div>;

  return (
    <div style={boite}>
      <img
        src={src}
        alt=""
        width={taille}
        height={taille}
        loading="lazy"
        decoding="async"
        onError={() => setEnErreur(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}
