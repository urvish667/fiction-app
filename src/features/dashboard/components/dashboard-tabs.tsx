"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./tabs/overview-tab";
import { StoriesTab } from "./tabs/stories-tab";
import { EarningsTab } from "./tabs/earnings-tab";

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  timeRange: string;
}

export function DashboardTabs({ activeTab, setActiveTab, timeRange }: DashboardTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-8">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="stories">Stories</TabsTrigger>
        <TabsTrigger value="earnings">Earnings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab timeRange={timeRange} />
      </TabsContent>

      <TabsContent value="stories">
        <StoriesTab timeRange={timeRange} />
      </TabsContent>

      <TabsContent value="earnings">
        <EarningsTab timeRange={timeRange} />
      </TabsContent>
    </Tabs>
  );
}
