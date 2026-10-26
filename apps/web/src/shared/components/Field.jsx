// A labelled input that shows the server's message under the wrong field (NFR-10).
export default function Field({ label, name, error, as = "input", children, ...props }) {
  const id = `f-${name}`;
  const cls = `${as === "select" ? "form-select" : "form-control"}${error ? " is-invalid" : ""}`;
  const Tag = as;
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <Tag id={id} name={name} className={cls} aria-invalid={!!error} {...props}>
        {children}
      </Tag>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
