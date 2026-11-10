import { useEffect, useState } from "react";

export function useMedia(q: string) {
  const [m, setM] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return m;
}
/** Desktop layout: sidebar navigation and multi-column grids. Phones and narrow windows get the app layout. */
export const WIDE = "(min-width: 900px)";
