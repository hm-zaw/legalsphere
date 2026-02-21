"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import Link from "next/link";

type FAQItem = {
  id: string;
  icon: IconName;
  question: string;
  answer: string;
};

export default function FAQs() {
  const faqItems: FAQItem[] = [
    {
      id: "item-1",
      icon: "clock",
      question: `Is my firm’s data actually "unhackable" on a distributed network?`,
      answer: `While no system is 100% immune to every threat, our Distributed Ledger Technology (DLT) removes the "honeypot" risk. In a traditional cloud, a hacker only needs to break into one central server to access everyone's files. With us, your data is encrypted, fragmented, and spread across multiple secure nodes. To steal a single document, an attacker would have to breach dozens of independent locations simultaneously—a feat that is computationally near-impossible.`,
    },
    {
      id: "item-2",
      icon: "credit-card",
      question: `Will this slow down my team's workflow?`,
      answer: `Quite the opposite. Because the system is distributed, it automatically pulls data from the node closest to your physical location. This reduces "latency" (lag), making document opening and saving faster than traditional remote desktops or VPNs. Your team gets the speed of a local hard drive with the security of a global fortress.`,
    },
    {
      id: "item-3",
      icon: "truck",
      question: `How do we handle "privileged" documents in a distributed environment?`,
      answer: `We utilize Zero-Knowledge Architecture. This means the system is designed so that only you hold the decryption keys. Even our system administrators and engineers cannot see your files, metadata, or client lists. Your attorney-client privilege is baked into the very code of the platform, ensuring you remain in total control of your digital borders.`,
    },
    {
      id: "item-4",
      icon: "globe",
      question: `What happens if our office internet goes down?`,
      answer: `The beauty of a distributed system is its redundancy. Since your data isn't trapped in one physical office or one specific data center, your team can switch to mobile hotspots or work from home and access the exact same real-time files instantly. The system is "always on" because it lives everywhere on the network at once.`,
    },
    {
      id: "item-5",
      icon: "package",
      question: `Can we integrate our existing tools like Outlook or Clio?`,
      answer: `Yes. We provide a Secure API Bridge that allows you to link your favorite calendar, email, and billing tools. You keep the interface you’re used to, while our system works in the background as a "security layer," ensuring that every attachment sent or received is automatically encrypted and logged in your firm's private distributed archive.`,
    },
  ];

  return (
    <section id="faqs" className="scroll-mt-20 bg-muted dark:bg-background py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:gap-16">
          <div className="md:w-1/3">
            <div className="sticky top-20">
              <h2 className="mt-4 text-4xl max-md:font-semibold">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground mt-4">
                Can't find what you're looking for? Contact our{" "}
                <Link
                  href="#"
                  className="text-primary font-medium hover:underline"
                >
                  customer support team
                </Link>
              </p>
            </div>
          </div>
          <div className="md:w-2/3">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqItems.map(item => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="bg-background shadow-xs rounded-lg border px-4 last:border-b"
                >
                  <AccordionTrigger className="cursor-pointer items-center py-5 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex size-6">
                        <DynamicIcon
                          name={item.icon}
                          className="m-auto size-4"
                        />
                      </div>
                      <span className="text-base">{item.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="px-9">
                      <p className="text-base">{item.answer}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
