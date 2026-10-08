import { Types } from "mongoose";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { submitInquiryAction } from "@/server/actions/inquiries";
import { setFavoriteAction } from "@/server/actions/favorites";
import { deleteSavedSearchAction, saveSearchAction } from "@/server/actions/saved-searches";
import { InquiryModel } from "@/server/models/inquiry";
import { FavoriteModel, SavedSearchModel } from "@/server/models/user-data";
import { getFavoriteIdsForUser } from "@/server/services/favorites";
import { actAs, testSession } from "../setup/session-state";
import { createAgent, createLocations, createProperty, freshDatabase, staff } from "./fixtures";

const day = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("client features", () => {
  let published: string;
  let draft: string;
  let agentId: string;
  const client = staff("user");

  beforeAll(async () => {
    await freshDatabase(
      "properties",
      "locations",
      "agents",
      "favorites",
      "saved_searches",
      "inquiries",
      "rate_limits",
      "daily_metrics",
    );
    await createLocations();
    agentId = (await createAgent())._id.toString();
    published = (await createProperty({ agent: agentId }))._id.toString();
    draft = (await createProperty({ status: "draft" }))._id.toString();
  });

  beforeEach(() => {
    actAs(null);
    testSession.ip = `203.0.113.${Math.floor(Math.random() * 200) + 20}`;
  });

  describe("favourites", () => {
    it("requires an account", async () => {
      expect(await setFavoriteAction(published, true)).toMatchObject({
        ok: false,
        code: "unauthenticated",
      });
    });

    it("saves and removes a home idempotently", async () => {
      actAs(client);
      const saved = { ok: true, data: { favorited: true } };
      expect(await setFavoriteAction(published, true)).toEqual(saved);
      expect(await setFavoriteAction(published, true)).toEqual(saved);
      expect(await getFavoriteIdsForUser(client.id)).toEqual([published]);
      expect(await setFavoriteAction(published, false)).toEqual({
        ok: true,
        data: { favorited: false },
      });
      expect(await FavoriteModel.countDocuments({ user: client.id })).toBe(0);
    });

    it("rejects unpublished, unknown and malformed input", async () => {
      actAs(client);
      expect(await setFavoriteAction(draft, true)).toMatchObject({ ok: false, code: "not_found" });
      expect(await setFavoriteAction(new Types.ObjectId().toString(), true)).toMatchObject({
        ok: false,
        code: "not_found",
      });
      expect(await setFavoriteAction({ $ne: null }, true)).toMatchObject({
        ok: false,
        code: "validation",
      });
      expect(await setFavoriteAction(published, "yes")).toMatchObject({
        ok: false,
        code: "validation",
      });
    });

    it("lets a client remove a home that has since been unpublished", async () => {
      actAs(client);
      await FavoriteModel.create({ user: client.id, property: draft });
      expect(await setFavoriteAction(draft, false)).toEqual({
        ok: true,
        data: { favorited: false },
      });
      expect(await FavoriteModel.countDocuments({ user: client.id, property: draft })).toBe(0);
    });
  });

  describe("saved searches", () => {
    it("stores only the canonical, validated query and de-duplicates", async () => {
      actAs(client);
      const first = await saveSearchAction({
        name: "Gulshan rentals",
        query: "city=dhaka&listing=rent&evil=%24where&page=4",
      });
      expect(first.ok).toBe(true);
      const stored = await SavedSearchModel.findOne({ user: client.id }).lean();
      expect(stored?.query).toBe("listing=rent&city=dhaka");

      const again = await saveSearchAction({
        name: "Same search",
        query: "listing=rent&city=dhaka",
      });
      expect(again).toMatchObject({ ok: true, message: "This search is already saved." });
      expect(await SavedSearchModel.countDocuments({ user: client.id })).toBe(1);
    });

    it("never lets one client delete another client's search", async () => {
      actAs(client);
      const saved = await saveSearchAction({ name: "Villas", query: "type=villa" });
      const id = saved.ok ? saved.data.id : "";

      actAs(staff("user"));
      expect(await deleteSavedSearchAction(id)).toMatchObject({ ok: false, code: "not_found" });

      actAs(client);
      expect(await deleteSavedSearchAction(id)).toEqual({ ok: true, data: undefined });
    });
  });

  describe("enquiries", () => {
    const viewing = () => ({
      type: "viewing",
      propertyId: published,
      name: "Viewing Client",
      email: `client-${Math.random().toString(36).slice(2)}@example.test`,
      preferredContact: "email",
      viewingDate: day(5),
      viewingTimeSlot: "morning",
      consent: "on",
      sourcePath: "/properties/test",
    });

    it("stores a viewing request linked to the listing, its advisor and the signed-in client", async () => {
      actAs(client);
      const fields = viewing();
      const result = await submitInquiryAction(null, form(fields));
      expect(result).toMatchObject({
        ok: true,
        data: { reference: expect.stringMatching(/^[A-F0-9]{6}$/) },
      });

      const stored = await InquiryModel.findOne({ email: fields.email }).lean();
      expect(stored?.status).toBe("new");
      expect(stored?.property?.toString()).toBe(published);
      expect(stored?.assignedTo?.toString()).toBe(agentId);
      expect(stored?.user?.toString()).toBe(client.id);
      expect(stored?.viewing?.timeSlot).toBe("morning");
      expect(stored?.meta?.ipHash).toMatch(/^[a-f0-9]{32}$/);
      expect(JSON.stringify(stored)).not.toContain(testSession.ip);
    });

    it("returns the original reference for an identical resubmission", async () => {
      const fields = viewing();
      const first = await submitInquiryAction(null, form(fields));
      const second = await submitInquiryAction(null, form(fields));
      expect(second).toMatchObject({ ok: true, message: expect.stringMatching(/already/) });
      if (first?.ok && second?.ok) expect(second.data.reference).toBe(first.data.reference);
      expect(await InquiryModel.countDocuments({ email: fields.email })).toBe(1);
    });

    it("validates input and refuses unpublished listings", async () => {
      const missingConsent = await submitInquiryAction(null, form({ ...viewing(), consent: "" }));
      expect(missingConsent).toMatchObject({
        ok: false,
        code: "validation",
        fieldErrors: { consent: expect.any(String) },
      });
      expect(
        await submitInquiryAction(null, form({ ...viewing(), propertyId: draft })),
      ).toMatchObject({ ok: false, code: "not_found" });
    });

    it("rate-limits repeated submissions from one address", async () => {
      testSession.ip = "198.51.100.77";
      const outcomes = [];
      for (let attempt = 0; attempt < 6; attempt += 1)
        outcomes.push(await submitInquiryAction(null, form(viewing())));
      expect(outcomes.slice(0, 5).every((outcome) => outcome?.ok)).toBe(true);
      expect(outcomes[5]).toMatchObject({ ok: false, code: "rate_limited" });
    });
  });
});
