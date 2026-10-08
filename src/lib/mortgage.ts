export interface MortgageInput {
  price: number;
  depositPercent: number;
  annualRatePercent: number;
  years: number;
}

export interface MortgageResult {
  deposit: number;
  loanAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayable: number;
}

/**
 * Standard amortising-loan repayment: M = P·r(1+r)^n / ((1+r)^n − 1), with a zero-rate
 * fallback. Inputs are clamped so the calculator never produces NaN or negative values.
 */
export function calculateMortgage({
  price,
  depositPercent,
  annualRatePercent,
  years,
}: MortgageInput): MortgageResult {
  const safePrice = Math.max(0, price);
  const deposit = Math.round(safePrice * (Math.min(100, Math.max(0, depositPercent)) / 100));
  const loanAmount = Math.max(0, safePrice - deposit);
  const months = Math.max(1, Math.round(Math.min(40, Math.max(1, years)) * 12));
  const monthlyRate = Math.max(0, annualRatePercent) / 100 / 12;

  const monthlyPayment =
    loanAmount === 0
      ? 0
      : monthlyRate === 0
        ? loanAmount / months
        : (loanAmount * monthlyRate * (1 + monthlyRate) ** months) /
          ((1 + monthlyRate) ** months - 1);

  const totalRepayable = monthlyPayment * months;
  return {
    deposit,
    loanAmount,
    monthlyPayment: Math.round(monthlyPayment),
    totalInterest: Math.round(Math.max(0, totalRepayable - loanAmount)),
    totalRepayable: Math.round(totalRepayable),
  };
}
