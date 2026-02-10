import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

const notifications: NotificationItem[] = [
  { id: "1", title: "New Task Assigned", description: 'Review contract for Stark Industries.', time: "2m", unread: true },
  { id: "2", title: "Case Re-assignment", description: 'Case #2024-031 re-assigned to you.', time: "1h", unread: false },
  { id: "3", title: "Policy Update", description: "New firm-wide document retention policy.", time: "5h", unread: false },
  { id: "4", title: "New Case Message", description: "Doc sent re: Case Consultation.", time: "1d", unread: false },
  { id: "5", title: "Appointment Confirmed", description: "Meeting with Bob Williams, July 8th.", time: "2d", unread: false },
];

export function Notifications({ className }: { className?: string }) {
  return (
    <Card className={`w-[280px] bg-white border border-zinc-200 shadow-lg rounded-md ${className}`}>
      
      {/* Compact Header */}
      <CardHeader className="p-3 border-b border-zinc-100 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-bold text-zinc-900">Notifications</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5 text-zinc-400 hover:text-blue-600"
          title="Mark all as read"
        >
          <Check className="h-3 w-3" />
        </Button>
      </CardHeader>

      {/* High-Density List */}
      <CardContent className="p-0 max-h-[250px] overflow-y-auto">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`group px-3 py-2 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 cursor-pointer flex gap-2.5 items-start transition-colors`}
          >
            {/* Dot Indicator */}
            <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${item.unread ? "bg-blue-600" : "bg-transparent"}`} />

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <p className={`text-[11px] truncate ${item.unread ? "font-bold text-zinc-900" : "font-medium text-zinc-700"}`}>
                  {item.title}
                </p>
                <span className="text-[9px] text-zinc-400 shrink-0 ml-1">
                  {item.time}
                </span>
              </div>
              
              {/* Force 1 line description with truncate */}
              <p className="text-[10px] text-zinc-500 truncate">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>

      {/* Slim Footer */}
      <CardFooter className="p-0 border-t border-zinc-100">
        <button className="w-full py-1.5 text-[10px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors">
          View all
        </button>
      </CardFooter>
    </Card>
  );
}