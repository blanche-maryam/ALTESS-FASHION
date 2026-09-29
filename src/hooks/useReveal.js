import { useEffect, useRef, useState } from 'react';

/**
 * Révèle un élément lorsqu'il entre dans la fenêtre.
 * L'élément est invisible jusqu'à l'observation : sans JavaScript il le reste,
 * ce qui est le comportement inverse de l'accessibilité. On s'appuie donc sur
 * une classe ajoutée par l'observateur plutôt que sur une classe de départ.
 *
 * @param {number} threshold  part visible déclenchant l'animation (0 à 1)
 * @param {boolean} once      ne se redéclenche pas au second passage
 */
export function useReveal({ threshold = 0.12, once = true, rootMargin = '0px 0px -60px 0px' } = {}) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Pas d'IntersectionObserver (navigateur ancien) : on affiche tout.
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    // Respect du réglage système « réduire les animations ».
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setRevealed(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return [ref, revealed];
}

/** Petit wrapper pour appliquer le décalage vertical sans dupliquer le hook. */
export function useStagger(index, step = 70) {
  return Math.min(index, 8) * step;
}
