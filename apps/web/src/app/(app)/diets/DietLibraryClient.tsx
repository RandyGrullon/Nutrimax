'use client';

import DietsAdmin from '@/components/diets/DietsAdmin';

/** Encapsula la biblioteca en el árbol `app/` para evitar fallos de chunk Webpack al importar el CMS desde la página servidor. */
export default function DietLibraryClient() {
  return <DietsAdmin embedded />;
}
