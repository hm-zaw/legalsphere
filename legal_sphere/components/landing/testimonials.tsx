import { Avatar, AvatarFallback, AvatarImage } from "@/components/landing/ui/avatar";
import { Card, CardContent } from "@/components/landing/ui/card";

type Testimonial = {
  name: string;
  role: string;
  image: string;
  quote: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Harvey",
    role: "Senior Litigator",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
    quote: `I’ll admit, I was the last one in the office to give up my physical filing cabinet. I didn't trust 'the cloud.' But once I realized this isn't just a server somewhere—that it’s a distributed, encrypted network where I hold the keys—my perspective shifted. It’s actually more secure than my old locked drawer.`,
  },
  {
    name: "Sofia",
    role: "International Arbitrator",
    image: "https://randomuser.me/api/portraits/men/6.jpg",
    quote: `From a security standpoint, the end-to-end encryption and decentralized storage are top-tier. It’s the first time I’ve slept soundly during an external audit knowing our client data is cryptographically siloed.`,
  },
  {
    name: "Julian",
    role: "Director of Operations",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    quote: `Efficiency is everything in a mid-sized firm. We were drowning in redundant backups and worrying about regional server outages. By moving to a distributed architecture, we've essentially eliminated downtime. Even if one node goes offline, the rest of the firm keeps moving. It has fundamentally changed how we calculate our billable hour efficiency because we aren't fighting the software anymore. It’s invisible, which is exactly what good tech should be.`,
  },
  {
    name: "Alistair",
    role: "Human Rights Lawyer",
    image: "https://randomuser.me/api/portraits/men/8.jpg",
    quote: `The zero-knowledge proof implementation ensures that even the service providers can't see our client's sensitive discovery documents. In an era of mass surveillance, this is the gold standard for attorney-client privilege.`,
  },
  {
    name: "Chloe",
    role: "Junior Associate",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    quote: `The mobile integration is seamless. I can review a brief on the train, sign it securely, and the distributed ledger updates the firm's master file instantly. No lag, no syncing errors, just work getting done.`,
  },
  {
    name: "Dr. Elena",
    role: "Compliance Consultant",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    quote: `Managing data sovereignty used to be a nightmare. In the EU, we have GDPR; in California, CCPA. This system allows us to tag data so it stays within specific geographic 'shards' of the distributed network. We get the benefits of a global system with the granular control of a local one. It’s a masterclass in modern compliance architecture.`,
  },
  {
    name: "Tyler",
    role: "Summer Intern",
    image: "https://randomuser.me/api/portraits/men/5.jpg",
    quote: `I was up and running in twenty minutes.`,
  },
  {
    name: "Markus",
    role: "Digital Forensics Lead",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    quote: `I’ve spent a decade auditing legal software, and most of it is just old code with a fresh coat of paint. This system is different. The immutable audit logs mean that nobody—not even an admin—can alter a document's history without a trail. For evidentiary integrity, this is the only system I trust.`,
  },
  {
    name: "Brian",
    role: "Founding Partner",
    image: "https://randomuser.me/api/portraits/men/10.jpg",
    quote: `We saved a fortune on hardware.`,
  },
  {
    name: "Priya",
    role: "Corporate Counsel",
    image: "https://randomuser.me/api/portraits/men/11.jpg",
    quote: `Legal research and drafting are no longer solitary sports. We can have five people working on a single complex merger agreement simultaneously. Because the system is distributed, we don't deal with the 'document locked for editing' messages that used to plague our old SharePoint setup. It’s transformed our collaborative workflow from a series of hand-offs into a true team effort.`,
  },
  {
    name: "Sam",
    role: "IT Support Specialist",
    image: "https://randomuser.me/api/portraits/men/12.jpg",
    quote: `When we had a local hardware failure last month, I didn't panic. I knew the data was distributed across the network nodes. We didn't lose a single byte of data, and the recovery time was effectively zero. That's the peace of mind you can't put a price tag on.`,
  },
  {
    name: "Jordan",
    role: "Entrepreneur",
    image: "https://randomuser.me/api/portraits/men/13.jpg",
    quote: `I just wanted an app that worked and kept my secrets safe. This does both.`,
  },
];

const chunkArray = (
  array: Testimonial[],
  chunkSize: number,
): Testimonial[][] => {
  const result: Testimonial[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

const testimonialChunks = chunkArray(
  testimonials,
  Math.ceil(testimonials.length / 3),
);

export default function Testimonial() {
  return (
    <section id="testimonials" className="scroll-mt-20">
      <div className="py-16 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-4xl max-md:font-semibold">
              Loved by the Community
            </h2>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-12 lg:grid-cols-3">
            {testimonialChunks.map((chunk, chunkIndex) => (
              <div key={chunkIndex} className="space-y-3">
                {chunk.map(({ name, role, quote, image }, index) => (
                  <Card key={index}>
                    <CardContent className="grid grid-cols-[auto_1fr] gap-3 pt-6">
                      <Avatar className="size-9">
                        <AvatarImage
                          alt={name}
                          src={image}
                          loading="lazy"
                          width="120"
                          height="120"
                        />
                        <AvatarFallback>ST</AvatarFallback>
                      </Avatar>

                      <div>
                        <h3 className="font-medium">{name}</h3>

                        <span className="text-muted-foreground block text-sm tracking-wide">
                          {role}
                        </span>

                        <blockquote className="mt-3">
                          <p className="text-gray-700 dark:text-gray-300">
                            {quote}
                          </p>
                        </blockquote>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
