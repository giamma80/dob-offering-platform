/** Porta la card `id` in cima alla colonna centrale scorrendo SOLO quella colonna.
   scrollIntoView scorrerebbe anche i contenitori con overflow nascosto (la pagina intera),
   facendo salire testata e footer. */
export function scorriA(id: string) {
  const el = document.getElementById(id);
  const col = el?.closest('.content') as HTMLElement | null;
  if (!el || !col) return;
  const top = el.getBoundingClientRect().top - col.getBoundingClientRect().top + col.scrollTop - 12;
  col.scrollTo({ top, behavior: 'smooth' });
}
