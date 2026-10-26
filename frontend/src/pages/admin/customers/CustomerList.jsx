import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import customerService from "../../../services/customer.service";
import Pagination from "../../../components/Pagination";
import SearchBox from "../../../components/SearchBox";
import Alert from "../../../components/Alert";
import { ActiveBadge } from "../../../components/StatusBadge";
import { useAuth } from "../../../context/AuthContext";
import { OFFICE } from "../../../services/roles";
import { date } from "../../../utils/format";

export default function CustomerList() {
  const { employee } = useAuth();
  const [query, setQuery] = useState({ page: 1, search: "" });
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    customerService.list(query).then((d) => live && setData(d)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [query]);

  const onSearch = useCallback((search) => setQuery({ page: 1, search }), []);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h1 className="page-title mb-0">Customers</h1>
        {OFFICE.includes(employee.role) && <Link to="/admin/customer/new" className="btn btn-brand">+ New customer</Link>}
      </div>
      <div className="mb-3" style={{ maxWidth: 420 }}>
        <SearchBox value={query.search} onSearch={onSearch} placeholder="Name, phone, email or plate" />
      </div>
      <Alert>{error}</Alert>
      {data && (
        <div className="ag-card p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th className="d-none d-md-table-cell">Email</th>
                  <th className="d-none d-sm-table-cell">Cars</th>
                  <th className="d-none d-lg-table-cell">Since</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((c) => (
                  <tr key={c.customer_id}>
                    <td><Link to={`/admin/customer/${c.customer_id}`}>{c.first_name} {c.last_name}</Link></td>
                    <td>{c.phone}</td>
                    <td className="d-none d-md-table-cell">{c.email}</td>
                    <td className="d-none d-sm-table-cell">{c.vehicle_count}</td>
                    <td className="d-none d-lg-table-cell">{date(c.created_at)}</td>
                    <td><ActiveBadge active={c.active} /></td>
                  </tr>
                ))}
                {data.rows.length === 0 && <tr><td colSpan="6" className="muted">No customers match.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-3 pb-3"><Pagination {...data} onChange={(page) => setQuery({ ...query, page })} /></div>
        </div>
      )}
    </>
  );
}
