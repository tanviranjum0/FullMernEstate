import "server-only";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "a",
  "blockquote",
  "hr",
  "br",
  "code",
  "pre",
];

/**
 * Renders editor-authored Markdown to HTML and strips anything outside a small editorial
 * allow-list, so even a compromised editor account cannot inject script into public pages.
 */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { gfm: true, breaks: false, async: false });
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "title", "rel", "target"] },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      h1: "h2",
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const external = /^https?:\/\//i.test(href);
        const safe: Record<string, string> = external
          ? { href, rel: "noopener noreferrer nofollow", target: "_blank" }
          : { href };
        return { tagName, attribs: safe };
      },
    },
  });
}

export function markdownToPlainText(markdown: string): string {
  return sanitizeHtml(marked.parse(markdown, { async: false }), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();
}
