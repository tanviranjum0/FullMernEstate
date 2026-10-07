type JsonLdValue = Record<string, unknown> | Record<string, unknown>[];

/**
 * Structured data script. `<` is escaped so text content (titles, descriptions) can never
 * terminate the script element and inject markup.
 */
export function JsonLd({ data }: { data: JsonLdValue }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
