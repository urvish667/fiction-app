// Public barrel interface for dashboard feature
export { DashboardHeader } from "./components/dashboard-header";
export { DashboardTabs } from "./components/dashboard-tabs";
export { StatsCard } from "./components/stats-card";
export { ReadsChart } from "./components/charts/reads-chart";
export { EngagementChart } from "./components/charts/engagement-chart";
export { EarningsChart } from "./components/charts/earnings-chart";
export { TopStoriesTable } from "./components/overview/top-stories-table";
export { TransactionsTable } from "./components/earnings/transactions-table";
export { OverviewTab } from "./components/tabs/overview-tab";
export { StoriesTab } from "./components/tabs/stories-tab";
export { EarningsTab } from "./components/tabs/earnings-tab";

// Hooks
export { useDashboardStats } from "./hooks/use-dashboard-stats";
export { useDashboardStories } from "./hooks/use-dashboard-stories";
export { useEarningsData } from "./hooks/use-earnings-data";
export { useReadsChartData, useEngagementChartData, useEarningsChartData } from "./hooks/use-chart-data";
export { useUserStories } from "./hooks/use-user-stories";

// API
export { DashboardService } from "./api/dashboard-api";

// Types
export type * from "./types/dashboard.types";
