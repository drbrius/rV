/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" schaltet die Routen auf Hash-Navigation um (Einzeldatei-Vorschau) */
  readonly VITE_HASH_ROUTING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
