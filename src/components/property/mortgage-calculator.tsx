"use client";

import { useId, useState } from "react";
import { formatPrice } from "@/lib/format";
import { calculateMortgage } from "@/lib/mortgage";

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="text-[0.7rem] font-semibold tracking-[0.14em] text-stone-700 uppercase"
        >
          {label}
        </label>
        <output htmlFor={id} className="tabular text-sm font-semibold text-ink-900">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-sand-200 accent-ink-900"
      />
    </div>
  );
}

/** Indicative repayment estimate. Clearly labelled as an illustration, not a loan offer. */
export function MortgageCalculator({ price, currency }: { price: number; currency: string }) {
  const id = useId();
  const [depositPercent, setDepositPercent] = useState(30);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(20);
  const result = calculateMortgage({ price, depositPercent, annualRatePercent: rate, years });
  const money = (value: number) => formatPrice(value, currency, { compact: value >= 10_000_000 });

  return (
    <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
      <div className="space-y-7">
        <SliderField
          id={`${id}-deposit`}
          label="Deposit"
          value={depositPercent}
          min={10}
          max={90}
          step={5}
          display={`${depositPercent}% · ${money(result.deposit)}`}
          onChange={setDepositPercent}
        />
        <SliderField
          id={`${id}-rate`}
          label="Interest rate"
          value={rate}
          min={4}
          max={16}
          step={0.25}
          display={`${rate.toFixed(2)}%`}
          onChange={setRate}
        />
        <SliderField
          id={`${id}-years`}
          label="Term"
          value={years}
          min={5}
          max={30}
          step={1}
          display={`${years} years`}
          onChange={setYears}
        />
      </div>
      <div className="flex flex-col justify-between bg-ink-950 p-7 text-ivory">
        <div>
          <p className="eyebrow text-ivory/60">Estimated monthly repayment</p>
          <p className="tabular mt-3 font-display text-[2.4rem] leading-none" aria-live="polite">
            {formatPrice(result.monthlyPayment, currency)}
          </p>
        </div>
        <dl className="mt-8 space-y-2 text-sm text-ivory/75">
          <div className="flex justify-between gap-4">
            <dt>Loan amount</dt>
            <dd className="tabular">{money(result.loanAmount)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Total interest</dt>
            <dd className="tabular">{money(result.totalInterest)}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs leading-relaxed text-ivory/50">
          Illustration only, assuming a fixed rate for the full term. Lenders&apos; rates, fees and
          eligibility vary.
        </p>
      </div>
    </div>
  );
}
