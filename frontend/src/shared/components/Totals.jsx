import { money } from "../lib/format";

export default function Totals({ subtotal, vatRate, vatAmount, total, totalLabel = "Total" }) {
  return (
    <div className="totals">
      <div><span>Subtotal</span><span className="money">{money(subtotal)}</span></div>
      <div><span>VAT {Number(vatRate)}%</span><span className="money">{money(vatAmount)}</span></div>
      <div className="grand"><span>{totalLabel}</span><span className="money">{money(total)}</span></div>
    </div>
  );
}
