"use client"


import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";

const formSchema = z.object({
  caseId: z.string().min(1, { message: "Case ID is required." }),
  clientName: z.string().min(2, { message: "Client name must be at least 2 characters." }),
  description: z.string().optional(),
});

export function NewCaseForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caseId: "",
      clientName: "",
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values); // In a real app, you'd do something with this data.
    toast({
      title: "New Case Created",
      description: `Case ${values.caseId} has been successfully created.`,
    });
    setOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="caseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Case ID</FormLabel>
              <FormControl>
                <Input placeholder={`#${new Date().getFullYear()}-...`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter client's full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="A brief description of the case." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit">Create Case</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
