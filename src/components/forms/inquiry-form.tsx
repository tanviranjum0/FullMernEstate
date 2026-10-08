"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea, fieldA11y } from "@/components/ui/form-controls";
import {
  CONTACT_METHOD_LABELS,
  CONTACT_METHODS,
  INQUIRY_TYPE_LABELS,
  VIEWING_TIME_SLOT_LABELS,
  VIEWING_TIME_SLOTS,
  type InquiryType,
} from "@/config/domain";
import { fieldErrorsFrom } from "@/lib/actions";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils/cn";
import { inquirySchema, MAX_VIEWING_DAYS_AHEAD } from "@/lib/validation/inquiry";
import { submitInquiryAction, type InquiryActionState } from "@/server/actions/inquiries";

interface InquiryFormProps {
  propertyId?: string;
  propertyTitle?: string;
  agentId?: string;
  /** Selectable enquiry types; the first is the default. */
  types: InquiryType[];
  defaultType?: InquiryType;
  defaultName?: string;
  defaultEmail?: string;
  compact?: boolean;
}

function isoDate(offsetDays: number) {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

export function InquiryForm({
  propertyId,
  propertyTitle,
  agentId,
  types,
  defaultType,
  defaultName = "",
  defaultEmail = "",
  compact = false,
}: InquiryFormProps) {
  const id = useId();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  // Listing pages are statically cached, so signed-in details are filled in on the client.
  const { data: session } = authClient.useSession();
  const prefillName = defaultName || session?.user.name || "";
  const prefillEmail = defaultEmail || session?.user.email || "";
  const [type, setType] = useState<InquiryType>(defaultType ?? types[0] ?? "general");
  const [contact, setContact] = useState<(typeof CONTACT_METHODS)[number]>("email");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [state, formAction, pending] = useActionState<InquiryActionState, FormData>(
    submitInquiryAction,
    null,
  );

  const errors = { ...(state && !state.ok ? state.fieldErrors : {}), ...clientErrors };
  const fid = (name: string) => `${id}-${name}`;

  useEffect(() => {
    if (state && !state.ok)
      formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [state]);

  if (state?.ok) {
    return (
      <div role="status" className="flex flex-col items-start py-4">
        <CheckCircle2 aria-hidden strokeWidth={1.25} className="size-10 text-success-600" />
        <h3 className="mt-5 font-display text-heading-3 text-ink-900">
          {type === "viewing" ? "Viewing request received" : "Thank you — we have your enquiry"}
        </h3>
        <p className="mt-3 text-stone-600">
          {state.message ?? "An advisor will be in touch, usually within one working day."} Your
          reference is{" "}
          <strong className="tabular font-semibold text-ink-900">{state.data.reference}</strong>.
        </p>
        <p className="mt-4 text-sm text-stone-600">
          Signed-in clients can follow enquiries under{" "}
          <Link
            href="/account/enquiries"
            className="underline underline-offset-4 hover:text-ink-900"
          >
            Enquiries & viewings
          </Link>
          .
        </p>
      </div>
    );
  }

  const defaultMessage = propertyTitle
    ? type === "viewing"
      ? `I would like to arrange a viewing of ${propertyTitle}.`
      : `I would like more information about ${propertyTitle}.`
    : "";

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      onSubmit={(event) => {
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        const result = inquirySchema.safeParse(data);
        if (!result.success) {
          event.preventDefault();
          const fieldErrors = fieldErrorsFrom(result.error);
          setClientErrors(fieldErrors);
          requestAnimationFrame(() =>
            formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(),
          );
          return;
        }
        setClientErrors({});
      }}
      className="space-y-5"
      aria-describedby={state && !state.ok ? `${id}-form-error` : undefined}
    >
      {types.length > 1 ? (
        <div
          role="radiogroup"
          aria-label="Enquiry type"
          className="grid auto-cols-fr grid-flow-col gap-1 rounded-sm bg-sand-100 p-1"
        >
          {types.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={type === option}
              onClick={() => setType(option)}
              className={cn(
                "h-10 rounded-xs px-2 text-[0.7rem] font-semibold tracking-[0.1em] uppercase transition-colors",
                type === option
                  ? "bg-paper text-ink-900 shadow-hairline"
                  : "text-stone-600 hover:text-ink-900",
              )}
            >
              {option === "property"
                ? "Information"
                : option === "viewing"
                  ? "Viewing"
                  : INQUIRY_TYPE_LABELS[option].replace(" request", "")}
            </button>
          ))}
        </div>
      ) : null}

      <input type="hidden" name="type" value={type} />
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      {agentId ? <input type="hidden" name="agentId" value={agentId} /> : null}
      <input type="hidden" name="sourcePath" value={pathname} />
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={fid("website")}>Leave this field empty</label>
        <input
          id={fid("website")}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className={cn("grid gap-5", !compact && "sm:grid-cols-2")}>
        <Field id={fid("name")} label="Full name" error={errors.name}>
          <Input
            {...fieldA11y(fid("name"), errors.name)}
            key={`name-${prefillName}`}
            name="name"
            autoComplete="name"
            defaultValue={prefillName}
            required
            maxLength={120}
          />
        </Field>
        <Field id={fid("email")} label="Email" error={errors.email}>
          <Input
            {...fieldA11y(fid("email"), errors.email)}
            key={`email-${prefillEmail}`}
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={prefillEmail}
            required
            maxLength={254}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 block text-[0.7rem] font-semibold tracking-[0.14em] text-stone-700 uppercase">
          Preferred contact
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {CONTACT_METHODS.map((method) => (
            <label
              key={method}
              className={cn(
                "flex h-11 cursor-pointer items-center justify-center rounded-sm border text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-harbour-600",
                contact === method
                  ? "border-ink-900 bg-ink-900 text-ivory"
                  : "border-sand-300 text-ink-800 hover:border-stone-400",
              )}
            >
              <input
                type="radio"
                name="preferredContact"
                value={method}
                checked={contact === method}
                onChange={() => setContact(method)}
                className="sr-only"
              />
              {CONTACT_METHOD_LABELS[method].replace(" call", "")}
            </label>
          ))}
        </div>
      </fieldset>

      <Field id={fid("phone")} label="Phone" optional={contact === "email"} error={errors.phone}>
        <Input
          {...fieldA11y(fid("phone"), errors.phone)}
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          maxLength={40}
          required={contact !== "email"}
        />
      </Field>

      {type === "viewing" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={fid("viewingDate")} label="Preferred date" error={errors.viewingDate}>
            <Input
              {...fieldA11y(fid("viewingDate"), errors.viewingDate)}
              name="viewingDate"
              type="date"
              min={isoDate(1)}
              max={isoDate(MAX_VIEWING_DAYS_AHEAD)}
              required
            />
          </Field>
          <Field
            id={fid("viewingTimeSlot")}
            label="Time of day"
            optional
            error={errors.viewingTimeSlot}
          >
            <Select
              {...fieldA11y(fid("viewingTimeSlot"), errors.viewingTimeSlot)}
              name="viewingTimeSlot"
              defaultValue=""
            >
              <option value="">Any time</option>
              {VIEWING_TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {VIEWING_TIME_SLOT_LABELS[slot]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ) : null}

      <Field
        id={fid("message")}
        label="Message"
        optional={type !== "general"}
        error={errors.message}
      >
        <Textarea
          {...fieldA11y(fid("message"), errors.message)}
          key={type}
          name="message"
          rows={compact ? 3 : 4}
          maxLength={4000}
          defaultValue={defaultMessage}
        />
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-stone-700">
          <Checkbox
            name="consent"
            className="mt-0.5"
            {...fieldA11y(fid("consent"), errors.consent)}
          />
          <span>
            I agree to be contacted about this enquiry. See our{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-ink-900">
              privacy notice
            </Link>
            .
          </span>
        </label>
        {errors.consent ? (
          <p id={`${fid("consent")}-error`} role="alert" className="mt-1.5 text-sm text-danger-600">
            {errors.consent}
          </p>
        ) : null}
      </div>

      {state && !state.ok ? (
        <p
          id={`${id}-form-error`}
          role="alert"
          className="rounded-sm bg-danger-50 px-4 py-3 text-sm text-danger-600"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : type === "viewing" ? "Request viewing" : "Send enquiry"}
      </Button>
    </form>
  );
}
