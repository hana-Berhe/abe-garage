export default function Alert({ kind = "danger", children }) {
  if (!children) return null;
  return <div className={`alert alert-${kind}`} role={kind === "danger" ? "alert" : "status"}>{children}</div>;
}
