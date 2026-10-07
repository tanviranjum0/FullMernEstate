import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `Terms that apply when you use the ${siteConfig.name} website.`,
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    title: "Listings",
    body: "Property details, prices, floor areas and images are provided in good faith but may change and do not form part of any offer or contract. Please verify all details, including title and approvals, with your own advisers before committing to a transaction.",
  },
  {
    title: "Estimates",
    body: "Finance estimates and market figures on this site are illustrations based on the information shown. They are not financial advice or an offer of credit.",
  },
  {
    title: "Your account",
    body: "You are responsible for keeping your password confidential and for activity under your account. We may suspend accounts that are used to misuse the site or its enquiry forms.",
  },
  {
    title: "Acceptable use",
    body: "Do not attempt to disrupt the site, access other users' information, submit false enquiries, or copy listings and images for commercial use without permission.",
  },
  {
    title: "Content",
    body: "Text, photography and design on this site are protected. Photography may be licensed from third parties.",
  },
  {
    title: "Changes",
    body: "We may update these terms from time to time. The date at the top of this page shows when they last changed.",
  },
];

export default function TermsPage() {
  return (
    <>
      <PageIntro crumbs={[{ label: "Terms", href: "/terms" }]} eyebrow="Legal" title="Terms of use" lead="Last updated 8 October 2026." />
      <div className="container-prose pb-[var(--section-y)]">
        <div className="prose-editorial">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
