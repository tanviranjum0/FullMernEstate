import { describe, expect, it } from "vitest";
import { USER_ROLES } from "@/config/domain";
import { canManageInquiry, canManageProperty, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { toEmbed } from "@/lib/media/embed";
import { markdownToPlainText, renderMarkdown } from "@/lib/security/markdown";

describe("role permissions", () => {
  it("gives clients no staff permissions and administrators all of them", () => {
    for (const permission of PERMISSIONS) {
      expect(hasPermission("user", permission)).toBe(false);
      expect(hasPermission("admin", permission)).toBe(true);
    }
    expect(hasPermission(null, "admin:access")).toBe(false);
  });

  it("limits advisors and editors to their areas", () => {
    expect(hasPermission("agent", "properties:manage_own")).toBe(true);
    expect(hasPermission("agent", "properties:manage_all")).toBe(false);
    expect(hasPermission("agent", "users:manage")).toBe(false);
    expect(hasPermission("editor", "content:manage")).toBe(true);
    expect(hasPermission("editor", "properties:manage_own")).toBe(false);
    expect(hasPermission("editor", "settings:manage")).toBe(false);
    for (const role of USER_ROLES) expect(hasPermission(role, "audit:read")).toBe(role === "admin");
  });

  it("lets advisors manage only what is assigned to them", () => {
    const advisor = { role: "agent" as const, agentId: "agent-1" };
    expect(canManageProperty(advisor, { agentId: "agent-1" })).toBe(true);
    expect(canManageProperty(advisor, { agentId: "agent-2" })).toBe(false);
    expect(canManageProperty(advisor, { agentId: null })).toBe(false);
    expect(canManageProperty({ role: "agent", agentId: null }, { agentId: null })).toBe(false);
    expect(canManageProperty({ role: "admin", agentId: null }, { agentId: "agent-2" })).toBe(true);
    expect(canManageInquiry(advisor, { assignedAgentId: "agent-1" })).toBe(true);
    expect(canManageInquiry(advisor, { assignedAgentId: "agent-9" })).toBe(false);
    expect(canManageInquiry({ role: "editor", agentId: null }, { assignedAgentId: null })).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("allows same-origin paths only", () => {
    expect(safeRedirectPath("/account/saved?x=1")).toBe("/account/saved?x=1");
    expect(safeRedirectPath("//evil.example")).toBe("/account");
    expect(safeRedirectPath("https://evil.example")).toBe("/account");
    expect(safeRedirectPath("/\\evil.example")).toBe("/account");
    expect(safeRedirectPath("/ok\r\nSet-Cookie: x")).toBe("/account");
    expect(safeRedirectPath(undefined, "/")).toBe("/");
  });
});

describe("toEmbed", () => {
  it("embeds allow-listed providers in privacy-friendly form", () => {
    expect(toEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      provider: "youtube",
      src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
    });
    expect(toEmbed("https://youtu.be/dQw4w9WgXcQ")?.provider).toBe("youtube");
    expect(toEmbed("https://vimeo.com/76979871")?.src).toBe("https://player.vimeo.com/video/76979871?dnt=1");
    expect(toEmbed("https://my.matterport.com/show/?m=SxQL3iGyoDo")?.provider).toBe("matterport");
  });

  it("refuses anything else", () => {
    expect(toEmbed("http://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(toEmbed("https://evil.example/embed")).toBeNull();
    expect(toEmbed("javascript:alert(1)")).toBeNull();
    expect(toEmbed("https://www.youtube.com/watch?v=<script>")).toBeNull();
    expect(toEmbed("not a url")).toBeNull();
  });
});

describe("renderMarkdown", () => {
  it("strips scripts, handlers and unsafe links", () => {
    const html = renderMarkdown(
      '# Title\n\n<script>alert(1)</script><img src=x onerror="alert(1)">\n\n[bad](javascript:alert(1)) [ok](/properties)',
    );
    expect(html).not.toMatch(/<script|onerror|<img|javascript:/i);
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain('<a href="/properties">ok</a>');
  });

  it("marks external links", () => {
    expect(renderMarkdown("[site](https://example.com)")).toContain(
      '<a href="https://example.com" rel="noopener noreferrer nofollow" target="_blank">site</a>',
    );
  });

  it("produces plain text for descriptions", () => {
    expect(markdownToPlainText("## Heading\n\nSome **bold** text.")).toBe("Heading Some bold text.");
  });
});
