/**
 * Enter animation that resolves a skeleton into real content: it rises a
 * little, sharpens from a soft blur, and fades in on the same ease Torph uses.
 * Pair it with `delay-*` and `fill-mode-both` to stagger siblings.
 */
export const revealClassName =
  'animate-in fade-in blur-in-sm slide-in-from-bottom-2 duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:animate-none'
