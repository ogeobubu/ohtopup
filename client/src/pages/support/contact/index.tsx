import { FaEnvelope, FaFacebook, FaTwitter, FaWhatsapp } from "react-icons/fa";

const channels = [
  { label: "Email Address", detail: "ohtopup@gmail.com", href: "mailto:ohtopup@gmail.com", icon: FaEnvelope, color: "var(--ot-accent)" },
  { label: "Social Media", detail: "Facebook", href: "https://www.facebook.com", icon: FaFacebook, color: "#1877f2" },
  { label: "Social Media", detail: "X (formerly Twitter)", href: "https://www.x.com", icon: FaTwitter, color: "#1da1f2" },
  { label: "Chat with Us", detail: "WhatsApp", href: "https://wa.me/+2348154212889", icon: FaWhatsapp, color: "#25d366" },
];

const Contact = () => {
  return (
    <div>
      <p className="mb-5 text-[13px] text-muted">You can reach us via the following channels:</p>
      <div className="grid gap-2.5">
        {channels.map((ch) => (
          <a
            key={ch.detail}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-md bg-tint px-4 py-3.5 text-[13px] text-ink transition-colors hover:bg-line/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper">
                <ch.icon size={16} style={{ color: ch.color }} />
              </div>
              <div>
                <div className="font-medium">{ch.label}</div>
                <div className="text-xs text-muted">{ch.detail}</div>
              </div>
            </div>
            <span className="text-sm text-muted">→</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Contact;
