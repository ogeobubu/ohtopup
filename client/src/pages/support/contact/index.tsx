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
      <p style={{ fontSize: 13, color: 'var(--ot-muted)', marginBottom: 20 }}>You can reach us via the following channels:</p>
      <div style={{ display: 'grid', gap: 10 }}>
        {channels.map((ch) => (
          <a key={ch.detail} href={ch.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--ot-tint)', borderRadius: 6, textDecoration: 'none', color: 'var(--ot-ink)', fontSize: 13, transition: 'background 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--ot-paper)', border: '1px solid var(--ot-line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ch.icon size={16} style={{ color: ch.color }} />
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>{ch.label}</div>
                <div style={{ fontSize: 12, color: 'var(--ot-muted)' }}>{ch.detail}</div>
              </div>
            </div>
            <span style={{ color: 'var(--ot-muted)', fontSize: 14 }}>→</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Contact;
