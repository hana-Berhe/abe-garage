const ORDER_STATUS = {
  1: ["Awaiting approval", "warning"],
  2: ["Approved", "info"],
  3: ["In progress", "primary"],
  4: ["Completed", "success"],
  5: ["Declined", "secondary"],
};
const LINE_STATUS = { 0: ["Not started", "secondary"], 1: ["Started", "primary"], 2: ["Done", "success"] };

export function StatusBadge({ status }) {
  const [label, color] = ORDER_STATUS[status] || ["Unknown", "dark"];
  return <span className={`badge text-bg-${color}`}>{label}</span>;
}

export function LineStatusBadge({ status }) {
  const [label, color] = LINE_STATUS[status] || ["Unknown", "dark"];
  return <span className={`badge text-bg-${color}`}>{label}</span>;
}

export function PaidBadge({ paid }) {
  return paid ? <span className="badge text-bg-success">Paid</span> : <span className="badge text-bg-danger">Unpaid</span>;
}

export function ActiveBadge({ active }) {
  return active ? <span className="badge text-bg-success">Active</span> : <span className="badge text-bg-secondary">Inactive</span>;
}
