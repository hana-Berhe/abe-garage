import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import employeeService from "../../../services/employee.service";
import Pagination from "../../../components/Pagination";
import SearchBox from "../../../components/SearchBox";
import Alert from "../../../components/Alert";
import { ActiveBadge } from "../../../components/StatusBadge";

export default function EmployeeList() {
  const [query, setQuery] = useState({ page: 1, search: "" });
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    employeeService
      .list(query)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [query]);

  const onSearch = useCallback((search) => setQuery({ page: 1, search }), []);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h1 className="page-title mb-0">Employees</h1>
        <Link to="/admin/employee/new" className="btn btn-brand">Add employee</Link>
      </div>
      <div className="mb-3" style={{ maxWidth: 360 }}>
        <SearchBox value={query.search} onSearch={onSearch} placeholder="Search by name or email" />
      </div>
      <Alert>{error}</Alert>
      {data && (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th className="d-none d-md-table-cell">Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((e) => (
                  <tr key={e.employee_id}>
                    <td>{e.first_name} {e.last_name}</td>
                    <td>{e.email}</td>
                    <td className="d-none d-md-table-cell">{e.phone || "–"}</td>
                    <td>{e.role_name}</td>
                    <td><ActiveBadge active={e.active} /></td>
                    <td className="text-end">
                      <Link to={`/admin/employee/${e.employee_id}/edit`} className="btn btn-sm btn-outline-secondary">Edit</Link>
                    </td>
                  </tr>
                ))}
                {data.rows.length === 0 && (
                  <tr><td colSpan="6" className="text-muted">No employees match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination {...data} onChange={(page) => setQuery({ ...query, page })} />
        </>
      )}
    </>
  );
}
