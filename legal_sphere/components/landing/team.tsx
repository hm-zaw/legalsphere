import Link from "next/link";
import profile1 from "../../public/diego-hernandez-MSepzbKFz10-unsplash.jpg";
import profile2 from "../../public/wellington-ferreira-72TE8cWKXRY-unsplash.jpg";
import profile3 from "../../public/ian-dooley-d1UPkiFd04A-unsplash.jpg";
import profile4 from "../../public/jake-nackos-IF9TK5Uy-KI-unsplash.jpg";
import profile5 from "../../public/jurica-koletic-7YVZYZeITc8-unsplash.jpg";
import profile6 from "../../public/linkedin-sales-solutions-pAtA8xe_iVM-unsplash.jpg";
import Image from "next/image";

const members = [
  {
    name: "Liam Brown",
    role: "Founder - CEO",
    avatar: profile1,
    link: "#",
  },
  {
    name: "Elijah Jones",
    role: "Co-Founder - CTO",
    avatar: profile2,
    link: "#",
  },
  {
    name: "Isabella Garcia",
    role: "Sales Manager",
    avatar: profile3,
    link: "#",
  },
  {
    name: "Henry Lee",
    role: "UX Engeneer",
    avatar: profile4,
    link: "#",
  },
  {
    name: "Ava Williams",
    role: "Interaction Designer",
    avatar: profile5,
    link: "#",
  },
  {
    name: "Olivia Miller",
    role: "Visual Designer",
    avatar: profile6,
    link: "#",
  },
];

export default function TeamSection() {
  return (
    <section id="team" className="scroll-mt-20 bg-gray-50 py-16 md:py-32 dark:bg-transparent">
      <div className="mx-auto max-w-5xl border-t px-6">
        <span className="text-caption -ml-6 -mt-3.5 block w-max bg-gray-50 px-6 dark:bg-gray-950">
          Team
        </span>
        <div className="mt-12 gap-4 sm:grid sm:grid-cols-2 md:mt-24">
          <div className="sm:w-2/5">
            <h2 className="text-4xl max-md:font-semibold sm:text-4xl">
              Our team
            </h2>
          </div>
          <div className="mt-6 sm:mt-0">
            <p>
              During the working process, we perform regular fitting with the
              client because he is the only person who can feel whether a new
              suit fits or not.
            </p>
          </div>
        </div>
        <div className="mt-12 md:mt-24">
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member, index) => (
              <div key={index} className="group overflow-hidden">
                <Image
                  className="h-96 w-full rounded-md object-cover object-top grayscale transition-all duration-500 hover:grayscale-0 group-hover:h-[22.5rem] group-hover:rounded-xl"
                  src={member.avatar}
                  alt="team member"
                  width="826"
                  height="1239"
                />
                <div className="px-2 pt-2 sm:pb-0 sm:pt-4">
                  <div className="flex justify-between">
                    <h3 className="text-base font-medium transition-all duration-500 group-hover:tracking-wider">
                      {member.name}
                    </h3>
                    <span className="text-xs">_0{index + 1}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-muted-foreground inline-block translate-y-6 text-sm opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {member.role}
                    </span>
                    <Link
                      href={member.link}
                      className="group-hover:text-primary-600 dark:group-hover:text-primary-400 inline-block translate-y-8 text-sm tracking-wide opacity-0 transition-all duration-500 hover:underline group-hover:translate-y-0 group-hover:opacity-100"
                    >
                      {" "}
                      Linkedin
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
