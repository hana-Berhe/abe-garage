export const ORDER_STATUS = { 1: "Awaiting approval", 2: "Approved", 3: "In progress", 4: "Completed", 5: "Declined" };
const LINE_STATUS = { 0: ["Not started", 5], 1: ["Started", 3], 2: ["Done", 4] };

export function StatusBadge({ status }) {
  return <span className={`ag-badge ag-badge--${status}`}>{ORDER_STATUS[status] || "Unknown"}</span>;
}

export function LineStatusBadge({ status }) {
  const [label, tone] = LINE_STATUS[status] || ["Unknown", 5];
  return <span className={`ag-badge ag-badge--${tone}`}>{label}</span>;
}

export function PaidBadge({ paid }) {
  return paid ? <span className="ag-badge ag-badge--paid">Paid</span> : <span className="ag-badge ag-badge--unpaid">Unpaid</span>;
}

export function ActiveBadge({ active }) {
  return active ? <span className="ag-badge ag-badge--4">Active</span> : <span className="ag-badge ag-badge--5">Inactive</span>;
}
