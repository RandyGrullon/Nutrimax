/** Tipos del panel de inicio (sin imports de servidor; seguros para Client Components). */
export type DashboardStats = {
  clientsCount: number;
  dietsCount: number;
  activeAssignmentsCount: number;
  mealPlansCount: number;
  foodsCount: number;
};

export type DashboardRecentClient = {
  id: string;
  full_name: string;
  updated_at: string;
};
