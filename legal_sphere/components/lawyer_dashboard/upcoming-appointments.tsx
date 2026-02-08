"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader as TableHeaderPrimitive, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { upcomingAppointmentsData } from "@/lib/data";

export function UpcomingAppointments() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Appointments </CardTitle>
        <CardDescription>Your next client meetings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeaderPrimitive>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeaderPrimitive>
          <TableBody>
            {upcomingAppointmentsData.map((appointment, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={appointment.avatar} alt={appointment.client} data-ai-hint="person face" />
                      <AvatarFallback>
                        {appointment.client.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{appointment.client}</div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.purpose}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-medium">{appointment.date}</div>
                  <div className="text-sm text-muted-foreground">
                    {appointment.time}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
