"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { tasksData, type Task } from "@/lib/data";
import { Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(tasksData);
  const { toast } = useToast();

  const handleTaskAction = (taskId: string, action: "Accepted" | "Denied") => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    toast({
      title: `Task ${action}`,
      description: `You have ${action.toLowerCase()} task ${taskId}.`,
    });
  };

  const pendingTasks = tasks.filter((task) => task.status === "Pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Tasks</CardTitle>
        <CardDescription>
          Review and respond to your pending tasks.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {pendingTasks.length > 0 ? (
          <div className="space-y-4">
            {pendingTasks.map((task) => (
              <Dialog key={task.id}>
                <DialogTrigger asChild>
                  <button className="flex w-full items-center gap-4 rounded-md border p-4 text-left transition-colors hover:bg-muted/50">
                    {/* 🎨 Colored Icon */}
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        "bg-amber-100 text-amber-700"
                      )}
                    >
                      <task.icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{task.case}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {task.dueDate}
                    </div>
                  </button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle>Task Details</DialogTitle>
                    <DialogDescription>
                      Review the details of the task before accepting or denying.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <InfoRow label="Case" value={task.case} strong />
                    <InfoRow label="Client" value={task.clientName} />
                    <InfoRow label="Task ID" value={task.id} />
                    <InfoRow label="Description" value={task.description} />
                    <InfoRow label="Due Date" value={task.dueDate} />
                  </div>

                  {/* ✅ Accept / Deny */}
                  <DialogFooter className="flex gap-2 sm:justify-end">
                    <DialogClose asChild>
                      <Button
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() =>
                          handleTaskAction(task.id, "Denied")
                        }
                      >
                        Deny
                      </Button>
                    </DialogClose>

                    <DialogClose asChild>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          handleTaskAction(task.id, "Accepted")
                        }
                      >
                        Accept
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Pending Tasks</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              All tasks are up to date.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Small helper ---------- */
function InfoRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 items-start gap-4">
      <Label className="text-right">{label}</Label>
      <span
        className={cn(
          "col-span-2 text-sm",
          strong && "font-semibold"
        )}
      >
        {value}
      </span>
    </div>
  );
}
