"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { recentActivitiesData } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function RecentActivities() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>An overview of  recent actions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentActivitiesData.map((activity) => (
          <div key={activity.id} className="flex items-center gap-4">
            <Avatar className="h-9 w-9">
                <AvatarFallback>{activity.actor.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-sm">
                <p>
                    <span className="font-medium">{activity.actor}</span>
                    {' '}{activity.action} on{' '}
                    <span className="font-medium">{activity.case}</span>.
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
