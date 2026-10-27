import { useCallback, useEffect, useState } from "react";
import callbackApi from "../callback.api";
import CallbackTable from "../components/CallbackTable";
import Pagination from "../../../shared/components/Pagination";
import Alert from "../../../shared/components/Alert";

const TABS = [["new", "New"], ["called", "Called"], ["all", "All"]];

// People who asked for a call back on the website. Nothing is booked until the desk speaks to them.
export default function CallbackList() {
  const [query, setQuery] = useState({ page: 1, status: "new" });
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    callbackApi.list(query).then(setData).catch((e) => setError(e.message));
  }, [query]);
  useEffect(load, [load]);

  return (
    <>
      <div className="mb-3">
        <h1 className="page-title mb-1">Call-back requests</h1>
        <p className="muted m-0">Customers who asked for a call or a price on the website. Call them, then mark the request as called.</p>
      </div>
      <div className="btn-group mb-3" role="group" aria-label="Show">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={`btn btn-sm ${query.status === key ? "btn-ink" : "btn-outline-secondary"}`}
            aria-pressed={query.status === key} onClick={() => setQuery({ page: 1, status: key })}>
            {label}{key === "new" && data ? ` (${data.new_count})` : ""}
          </button>
        ))}
      </div>
      <Alert>{error}</Alert>
      {data && (
        <div className="ag-card p-0 callback-card">
          <CallbackTable rows={data.rows} onChanged={load}
            empty={query.status === "new" ? "No new requests. Everyone has been called." : "No requests here."} />
          <div className="px-3 pb-3 pt-2"><Pagination {...data} onChange={(page) => setQuery({ ...query, page })} /></div>
        </div>
      )}
    </>
  );
}
