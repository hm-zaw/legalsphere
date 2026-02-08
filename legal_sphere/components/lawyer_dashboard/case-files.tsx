"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { caseFilesData, type CaseFile } from "@/lib/data";
import { cn } from "@/lib/utils";
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
import { NewCaseForm } from "./new-case-form";

export function CaseFiles() {
  const [isNewCaseDialogOpen, setIsNewCaseDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Case Files </CardTitle>
          <CardDescription>Manage your firm's case files.</CardDescription>
        </div>
        <Dialog open={isNewCaseDialogOpen} onOpenChange={setIsNewCaseDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Case
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Case</DialogTitle>
              <DialogDescription>
                Enter the details for the new case file. Click create when you're done.
              </DialogDescription>
            </DialogHeader>
            <NewCaseForm setOpen={setIsNewCaseDialogOpen} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {caseFilesData.map((file: CaseFile) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">{file.id}</TableCell>
                <TableCell>{file.clientName}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      file.status === "Active"
                        ? "secondary"
                        : file.status === "Closed"
                        ? "outline"
                        : "default"
                    }
                    className={cn(
                      file.status === "Active" &&
                        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
                      file.status === "Pending" &&
                        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
                      file.status === "Closed" &&
                        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                    )}
                  >
                    {file.status}
                  </Badge>
                </TableCell>
                <TableCell>{file.lastUpdated}</TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                      <DialogHeader>
                        <DialogTitle>Case Details</DialogTitle>
                        <DialogDescription>
                          Viewing details for case {file.id}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="case-id" className="text-right">
                            Case ID
                          </Label>
                          <span
                            id="case-id"
                            className="col-span-2 font-semibold"
                          >
                            {file.id}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="client-name" className="text-right">
                            Client
                          </Label>
                          <span id="client-name" className="col-span-2">
                            {file.clientName}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 items-start gap-4">
                            <Label htmlFor="case-description" className="text-right mt-1">
                                Description
                            </Label>
                            <p id="case-description" className="col-span-2 text-sm leading-relaxed">
                                {file.description}
                            </p>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="status" className="text-right">
                            Status
                          </Label>
                          <div id="status" className="col-span-2">
                            <Badge
                              variant={
                                file.status === "Active"
                                  ? "secondary"
                                  : file.status === "Closed"
                                  ? "outline"
                                  : "default"
                              }
                              className={cn(
                                file.status === "Active" &&
                                  "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
                                file.status === "Pending" &&
                                  "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                              )}
                            >
                              {file.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label
                            htmlFor="last-updated"
                            className="text-right"
                          >
                            Last Updated
                          </Label>
                          <span id="last-updated" className="col-span-2">
                            {file.lastUpdated}
                          </span>
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Close</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
