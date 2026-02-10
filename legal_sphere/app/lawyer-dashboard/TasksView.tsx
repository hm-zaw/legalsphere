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
import { Briefcase, Filter, ArrowUpRight, CheckCircle2 } from "lucide-react";
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
import { motion } from "framer-motion";

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>(tasksData);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const handleTaskAction = (taskId: string, action: "Accepted" | "Denied" | "Completed") => {
    if (action === "Completed") {
        setTasks((prev) => prev.map((t) => t.id === taskId ? {...t, status: "Completed"} : t));
    } else {
        setTasks((prev) => prev.map((t) => t.id === taskId ? {...t, status: action} : t));
    }
    
    toast({
      title: `Task ${action}`,
      description: `Task ${taskId} has been marked as ${action.toLowerCase()}.`,
    });
  };

  const filteredTasks = tasks.filter((task) => {
      if (filter === "all") return task.status === "Pending";
      return task.status === filter; 
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
          <div>
              <h2 className="text-xl font-serif text-[#1a2238]">Task Management</h2>
              <p className="text-xs text-zinc-500">Track and manage your daily legal responsibilities.</p>
          </div>
          <div className="flex gap-2">
              {["all", "Completed", "Accepted"].map((f) => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border transition-all",
                        filter === f 
                            ? "bg-[#1a2238] text-white border-[#1a2238]" 
                            : "bg-white text-zinc-500 border-zinc-200 hover:border-[#af9164] hover:text-[#af9164]"
                    )}
                  >
                      {f === "all" ? "Pending" : f}
                  </button>
              ))}
          </div>
      </div>

      <div className="grid gap-4">
        {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} onAction={handleTaskAction} />
            ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-12 text-center bg-zinc-50/50">
            <CheckCircle2 className="h-12 w-12 text-zinc-300 mb-4" />
            <h3 className="text-sm font-bold text-zinc-700">All Caught Up</h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-xs">
              There are no {filter === 'all' ? 'pending' : filter.toLowerCase()} tasks at the moment.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TaskItem({ task, onAction }: { task: Task, onAction: (id: string, action: any) => void }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="group flex items-center gap-4 p-4 bg-white rounded-lg border border-zinc-200 shadow-sm hover:shadow-md hover:border-[#af9164]/30 transition-all cursor-pointer">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 font-serif",
                        task.status === "Pending" ? "bg-[#af9164]" : "bg-[#1a2238]"
                    )}>
                        {task.clientName.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-[#1a2238] truncate group-hover:text-[#af9164] transition-colors">{task.case}</h4>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                task.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}>
                                {task.status}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-600 line-clamp-1">{task.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400 font-medium">
                            <span>ID: {task.id}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                            <span>Due: {task.dueDate}</span>
                        </div>
                    </div>
                    
                    <div className="text-zinc-300 group-hover:text-[#af9164] transition-colors pl-2">
                        <ArrowUpRight size={18} />
                    </div>
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                <DialogTitle className="font-serif text-xl text-[#1a2238]">Task Details</DialogTitle>
                <DialogDescription className="text-xs">
                    Review full details before taking action.
                </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 border-y border-zinc-100 my-2">
                    <InfoRow label="Case Reference" value={task.case} strong />
                    <InfoRow label="Client Name" value={task.clientName} />
                    <InfoRow label="Task ID" value={task.id} />
                    <InfoRow label="Description" value={task.description} />
                    <InfoRow label="Due Date" value={task.dueDate} />
                    <InfoRow label="Priority" value="High" />
                </div>

                <DialogFooter className="flex gap-2 sm:justify-end">
                    {task.status === "Pending" ? (
                        <>
                            <DialogClose asChild>
                                <Button
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                onClick={() => onAction(task.id, "Denied")}
                                >
                                Deny
                                </Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button
                                className="bg-[#1a2238] text-white hover:bg-[#2c354f]"
                                onClick={() => onAction(task.id, "Accepted")}
                                >
                                Accept Assignment
                                </Button>
                            </DialogClose>
                        </>
                    ) : (
                         <DialogClose asChild>
                            <Button
                            className="bg-[#af9164] text-white hover:bg-[#9c7f56]"
                            onClick={() => onAction(task.id, "Completed")}
                            >
                            Mark as Completed
                            </Button>
                        </DialogClose>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="grid grid-cols-3 items-start gap-4">
      <Label className="text-right text-xs text-zinc-400 font-medium uppercase tracking-wide pt-0.5">{label}</Label>
      <span className={cn("col-span-2 text-sm text-zinc-700", strong && "font-bold text-[#1a2238]")}>
        {value}
      </span>
    </div>
  );
}
