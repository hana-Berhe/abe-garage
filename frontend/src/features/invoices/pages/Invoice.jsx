import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { invoiceApi } from "../../orders/order.api";
import Alert from "../../../shared/components/Alert";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";
import OrderDocument from "../../orders/components/OrderDocument";
import { dateTime, money } from "../../../shared/lib/format";

// FR-INV-01..07, BE-040: issue the invoice once, then print it and mark it paid (cash).
// An issued invoice is a stored copy: later edits to services, customers or settings do not change it.
export default function Invoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [canIssue, setCanIssue] = useState(false);

  useEffect(() => {
    invoiceApi.get(id).then(setInvoice).catch((e) => {
      if (e.data?.issued === false && e.data.can_issue) return setCanIssue(true);
      setError(e.data?.issued === false ? "The invoice can be issued once every job is done." : e.message);
    });
  }, [id]);

  async function issue() {
    setBusy(true);
    setError(null);
    try {
      setInvoice(await invoiceApi.issue(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      setInvoice(await invoiceApi.markPaid(id));
    } catch (e) {
      setError(e.message);
      // Someone else may have taken the payment in another tab (AT-13): show the stored state.
      invoiceApi.get(id).then(setInvoice).catch(() => {});
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  if (!invoice) {
    return (
      <>
        {canIssue ? (
          <Alert kind="info">
            This order is complete. Issuing the invoice stores it exactly as it is now, with invoice number INV-{String(id).padStart(6, "0")}.
            Later changes to services, the customer or garage settings will not change it.
          </Alert>
        ) : (
          <Alert>{error}</Alert>
        )}
        <div className="d-flex gap-2 flex-wrap">
          <Link to={`/admin/order/${id}`} className="btn btn-outline-secondary">Back to order</Link>
          {canIssue && <button type="button" className="btn btn-brand" disabled={busy} onClick={issue}>{busy ? "Issuing…" : "Issue invoice"}</button>}
        </div>
        {canIssue && error && <div className="mt-3"><Alert>{error}</Alert></div>}
      </>
    );
  }

  return (
    <>
      <div className="d-flex gap-2 mb-3 flex-wrap no-print">
        <Link to={`/admin/order/${id}`} className="btn btn-outline-secondary">Back to order</Link>
        <button type="button" className="btn btn-outline-secondary" onClick={() => window.print()}>Print or save as PDF</button>
        {invoice.paid ? (
          <button type="button" className="btn btn-outline-secondary" disabled>Paid on {dateTime(invoice.paid_at)}</button>
        ) : (
          <button type="button" className="btn btn-brand" onClick={() => setConfirm(true)}>Mark as paid (cash)</button>
        )}
      </div>
      <Alert>{error}</Alert>
      <OrderDocument order={invoice} title="Invoice" number={invoice.invoice_number} docDate={invoice.invoice_issued_at}>
        <div className="mt-4 d-flex justify-content-between flex-wrap gap-2">
          <span className="muted small">Order {invoice.order_id} · Payment in cash only</span>
          {invoice.paid ? (
            <span className="fw-semibold">PAID in cash on {dateTime(invoice.paid_at)} · received by {invoice.paid_received_by_name}</span>
          ) : (
            <span className="fw-semibold">Amount due: {money(invoice.total)}</span>
          )}
        </div>
      </OrderDocument>
      <ConfirmDialog show={confirm} title="Mark as paid" confirmLabel={`Yes, received ${money(invoice.total)}`} busy={busy}
        onConfirm={pay} onCancel={() => setConfirm(false)}>
        Did you receive <strong>{money(invoice.total)}</strong> in cash from {invoice.first_name} {invoice.last_name}?
      </ConfirmDialog>
    </>
  );
}
