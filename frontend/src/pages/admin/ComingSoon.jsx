export default function ComingSoon({ title, owner }) {
  return (
    <>
      <h1 className="page-title">{title}</h1>
      <p className="text-muted">This page is not built yet{owner ? ` (${owner})` : ""}.</p>
    </>
  );
}
