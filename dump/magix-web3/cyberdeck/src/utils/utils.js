/**
 * la raison pourquoi:
 * pour que les glitch effects suivent la couleur
 * choisie du joueur, et que la minicarte 3d suive aussi,
 * ils n'ont pas vraiment acces a CSS.
 */
export const PRIMARY = getComputedStyle(
  document.documentElement,
).getPropertyValue("--primary");
