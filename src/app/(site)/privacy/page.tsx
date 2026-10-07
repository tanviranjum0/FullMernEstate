import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: `How ${siteConfig.name} collects, uses and protects personal information.`,
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "What we collect",
    body: [
      "Account details you provide when you register: your name, email address and, if you add it, your phone number. Passwords are stored only as salted hashes.",
      "Enquiries and viewing requests: the contact details and message you submit, the property or advisor concerned, and the page you sent it from.",
      "Your saved homes, saved searches and the homes you have recently viewed while signed in, so you can return to them.",
      "Security information: a one-way hash of your IP address is stored with enquiries and rate-limit counters to prevent abuse. We do not store raw IP addresses with your enquiries.",
    ],
  },
  {
    title: "Analytics",
    body: [
      "We count page views and a small number of anonymous events (for example, how often a listing is viewed or shared) as daily totals. These counts are not linked to you.",
      "We use privacy-focused web analytics that does not use cookies or build profiles across sites.",
    ],
  },
  {
    title: "Cookies and local storage",
    body: [
      "We set a secure, HTTP-only session cookie only when you sign in. It is required to keep you signed in and is not used for advertising.",
      "Your comparison list and a device-only list of recently viewed homes are kept in your browser's local storage. You can clear them at any time.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "To respond to your enquiries, arrange viewings and provide the services you ask for.",
      "To operate your account, including saved homes and searches.",
      "To keep the site secure and prevent misuse.",
      "We do not sell your personal information.",
    ],
  },
  {
    title: "Sharing",
    body: [
      "Enquiries are shared with the advisor responsible for the property or request. We use carefully selected service providers for hosting, database, email delivery and media storage, who process data on our behalf.",
    ],
  },
  {
    title: "Retention",
    body: [
      "Recently viewed records are deleted automatically after 90 days. Anonymous daily analytics totals are kept for around 13 months. Enquiries are kept for as long as needed to handle them and meet our legal obligations.",
    ],
  },
  {
    title: "Your choices and rights",
    body: [
      "You can update your name and phone number in your account settings, remove saved homes and searches at any time, and contact us to request access to or deletion of your personal information.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageIntro crumbs={[{ label: "Privacy", href: "/privacy" }]} eyebrow="Legal" title="Privacy notice" lead="Last updated 8 October 2026." />
      <div className="container-prose pb-[var(--section-y)]">
        <div className="prose-editorial">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
          <h2>Contact</h2>
          <p>
            For any privacy question or request, please use the <a href="/contact">contact form</a>.
          </p>
        </div>
      </div>
    </>
  );
}
