import { useEffect, useId, useRef } from "react";

export default function AdminFormDialog({
  title,
  error,
  saving,
  onClose,
  children,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();

    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="admin-form-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
    >
      <div className="admin-form-dialog__head">
        <h2 id={titleId} className="admin-panel-title">
          {title}
        </h2>

        <button
          type="button"
          className="admin-form-dialog__close"
          aria-label="Đóng hộp thoại"
          disabled={saving}
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {children}
    </dialog>
  );
}