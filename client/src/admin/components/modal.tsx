import React, { useRef, useEffect, useId } from "react";
import { FiX } from "react-icons/fi";

// Multiple open dialogs must share the scroll lock regardless of closing order.
let openModalCount = 0;
let previousBodyOverflow = '';

interface ModalProps {
  isOpen: boolean;
  closeModal: () => void;
  title?: string;
  children: React.ReactNode;
  isDarkMode?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  stickyHeader?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, closeModal, title, children, isDarkMode, size = 'md', showCloseButton = true, stickyHeader }) => {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useRef(closeModal);
  close.current = closeModal;

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    if (openModalCount === 0) previousBodyOverflow = document.body.style.overflow;
    openModalCount += 1;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
      }
      if (event.key !== 'Tab') return;
      const elements = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []).filter(el => el.getClientRects().length > 0);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) {
        event.preventDefault(); first.focus();
      }
    };
    panel.current?.addEventListener('keydown', handleKey);
    const element = panel.current;
    return () => {
      element?.removeEventListener('keydown', handleKey);
      openModalCount -= 1;
      if (openModalCount === 0) document.body.style.overflow = previousBodyOverflow;
      previousFocus?.focus();
    };
  }, [isOpen]);

  return <div className={`ot-modal-overlay${isDarkMode ? ' dark' : ''}`} hidden={!isOpen} onClick={event => {
    if (event.target === event.currentTarget && showCloseButton) closeModal();
  }}>
    <div ref={panel} className={`ot-modal ot-modal-${size}`} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : 'Payment details'}>
      <div className="ot-modal-scroll">
        {(title || stickyHeader) && <div className="ot-modal-header">
          {title && <div className="ot-modal-title"><h2 id={titleId}>{title}</h2>{showCloseButton && <button type="button" className="ot-icon-button" onClick={closeModal} aria-label="Close modal"><FiX /></button>}</div>}
          {stickyHeader}
        </div>}
        {!title && !stickyHeader && showCloseButton && <div className="ot-modal-close"><button type="button" className="ot-icon-button" onClick={closeModal} aria-label="Close modal"><FiX /></button></div>}
        <div className="ot-modal-body">{children}</div>
      </div>
    </div>
  </div>;
};
export default Modal;
