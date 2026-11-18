/** Кадр фильма. Постер в форме необязателен, поэтому без него показываем пустую плашку того же размера. */
export function Poster({ src, className }: { src?: string; className: string }) {
  return src ? <img className={className} src={src} alt="" loading="lazy" /> : <div className={`${className} poster-empty`} aria-hidden="true" />;
}
