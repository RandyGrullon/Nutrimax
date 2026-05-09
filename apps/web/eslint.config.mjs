import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/** Artefactos generados por next-pwa / Workbox: no aplicar reglas TS al bundle minificado. */
const ignoresGeneratedPublic = {
  ignores: ['public/sw.js', 'public/workbox-*.js'],
};

/** Patrones habituales (hidratación, sincronización con props) que la regla nueva marca en falso positivo. */
const hooksPragmatic = {
  rules: {
    'react-hooks/set-state-in-effect': 'off',
  },
};

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [...coreWebVitals, ...typescript, ignoresGeneratedPublic, hooksPragmatic];

export default eslintConfig;
