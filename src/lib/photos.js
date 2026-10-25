// Version réduite d'une photo hébergée sur Cloudinary (carré, qualité et format
// automatiques) : pour de petites vignettes, on évite de télécharger la photo
// d'origine, souvent de plusieurs centaines de Ko. Une URL qui n'est pas Cloudinary
// est renvoyée telle quelle.
export function urlVignette(url, taille = 96) {
  if (!url) return null;
  const repere = '/image/upload/';
  if (!url.includes('res.cloudinary.com') || !url.includes(repere)) return url;
  return url.replace(repere, `${repere}w_${taille},h_${taille},c_fill,q_auto,f_auto/`);
}
