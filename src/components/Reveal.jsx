import { useReveal, useStagger } from '../hooks/useReveal.js';

/**
 * Enveloppe un bloc et le révèle quand il entre dans la fenêtre.
 *
 * @param {'up'|'scale'|'left'|'right'} variant  direction de l'animation
 * @param {number} index   position dans la série, pour le décalage
 * @param {string} as      élément rendu (section, div, li…)
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  variant = 'up',
  index = 0,
  step = 70,
  className = '',
  ...rest
}) {
  const [ref, revealed] = useReveal();
  const variantClass = variant === 'up' ? 'reveal' : `reveal-${variant}`;

  return (
    <Tag
      ref={ref}
      className={`${variantClass} ${revealed ? 'is-revealed' : ''} ${className}`.trim()}
      style={{ '--reveal-delay': `${useStagger(index, step)}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
