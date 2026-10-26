import { Button, Modal } from "react-bootstrap";

export default function ConfirmDialog({ show, title, children, confirmLabel = "Yes", onConfirm, onCancel, busy }) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button className="btn-brand" onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
      </Modal.Footer>
    </Modal>
  );
}
