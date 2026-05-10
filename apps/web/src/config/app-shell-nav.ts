/**
 * Configuración única del menú principal (shell).
 * Mantenerla fuera del cliente evita copias divergentes y facilita el SSR + hidratación.
 */
export const APP_SHELL_NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/clients', label: 'Pacientes' },
  /** Solo `/nutrition`: si coincidiera un prefijo, `/nutrition/plans` marcaría también Nutrición. */
  { href: '/nutrition', label: 'Nutrición', exact: true },
  { href: '/nutrition/plans', label: 'Plan alimenticio' },
  { href: '/diets', label: 'Dietas' },
] as const;

export type AppShellNavItem = (typeof APP_SHELL_NAV)[number];
