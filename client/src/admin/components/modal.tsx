import React, { useRef, useEffect, useId } from "react";
import { FiX } from "react-icons/fi";

let openModalCount = 0;
let previousBodyOverflow = "";

const sizeClass: Record<string, string> = {
  sm: "max-w-[384px]",
  md: "max-w-[480px]",
  lg: "max-w-[720px]",
  xl: "max-w-[960px]",
  full: "max-w-[1200px]",
};

interface ModalProps {
  isOpen: boolean;
  closeModal: () => void;
  title?: string;
  children: React.ReactNode;
  isDarkMode?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  stickyHeader?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  closeModal,
  title,
  children,
  isDarkMode,
  size = "md",
  showCloseButton = true,
  stickyHeader,
}) => {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useRef(closeModal);
  close.current = closeModal;

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    if (openModalCount === 0) previousBodyOverflow = document.body.style.overflow;
    openModalCount += 1;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
        ) || []
      ).filter((el) => el.getClientRects().length > 0);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) {
        event.preventDefault();
        first.focus();
      }
    };
    panel.current?.addEventListener("keydown", handleKey);
    const element = panel.current;
    return () => {
      element?.removeEventListener("keydown", handleKey);
      openModalCount -= 1;
      if (openModalCount === 0) document.body.style.overflow = previousBodyOverflow;
      previousFocus?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const iconBtn =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-tint hover:text-ink";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4${isDarkMode ? " dark" : ""}`}
      onClick={(event) => {
        if (event.target === event.currentTarget && showCloseButton) closeModal();
      }}
    >
      <div
        ref={panel}
        className={`flex max-h-full w-full flex-col overflow-hidden rounded-t-lg bg-paper text-ink shadow-xl sm:rounded-lg sm:max-h-[90vh] ${sizeClass[size] || sizeClass.md}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Payment details"}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {(title || stickyHeader) && (
            <div className="shrink-0 border-b border-line bg-paper">
              {title && (
                <div className="flex items-center justify-between gap-4 px-6 py-4">
                  <h2 id={titleId} className="min-w-0 overflow-wrap-anywhere text-lg font-semibold">
                    {title}
                  </h2>
                  {showCloseButton && (
                    <button type="button" className={iconBtn} onClick={closeModal} aria-label="Close modal">
                      <FiX />
                    </button>
                  )}
                </div>
              )}
              {stickyHeader}
            </div>
          )}
          {!title && !stickyHeader && showCloseButton && (
            <div className="flex justify-end px-3 pt-3">
              <button type="button" className={iconBtn} onClick={closeModal} aria-label="Close modal">
                <FiX />
              </button>
            </div>
          )}
          <div className="min-w-0 overflow-wrap-anywhere p-6 max-sm:p-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
