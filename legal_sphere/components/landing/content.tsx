import { Button } from "@/components/landing/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ContentSection() {
  return (
    <section id="about" className="scroll-mt-20 py-16 md:py-32">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
        <img
          className="rounded-(--radius) grayscale"
          src="https://images.unsplash.com/photo-1530099486328-e021101a494a?q=80&w=2747&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="team image"
          height=""
          width=""
          loading="lazy"
        />

        <div className="grid gap-6 md:grid-cols-2 md:gap-12">
          <h2 className="text-5xl font-medium">
            Delivering practical solutions through trusted legal support
          </h2>
          <div className="space-y-6">
            <p>
              We are committed to delivering practical solutions through trusted
              legal support tailored to your unique needs. Our experienced team
              focuses on clear, effective strategies that u resolve challenges
              efficiently while protecting your rights every step of the way.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
