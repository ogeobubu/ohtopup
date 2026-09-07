const SOCIAL_LINKS = {
  facebook: 'http://facebook.com/ohtopup',
  instagram: 'http://instagram.com/ohtopup',
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

// Content is trusted, already-rendered email HTML. Use inline styles and layout
// tables so the same quiet design works without web fonts or external images.
function emailLayout(content, { unsubscribeUrl, footerNote } = {}) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>OhTopUp</title></head>
<body style="margin:0;padding:0;background-color:#f7f8fa;color:#18232d;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f8fa;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e6e9;border-radius:6px;">
<tr><td style="padding:26px 28px;border-bottom:1px solid #e2e6e9;"><span style="font-size:24px;line-height:1;font-weight:600;letter-spacing:-1px;color:#18232d;">ohtopup</span></td></tr>
<tr><td style="padding:28px;font-size:14px;line-height:1.7;color:#18232d;word-break:break-word;">${content}</td></tr>
<tr><td style="padding:22px 28px;border-top:1px solid #e2e6e9;color:#626d79;font-size:12px;line-height:1.8;">
${footerNote ? `<p style="margin:0 0 12px;">${escapeHtml(footerNote)}</p>` : ''}
<p style="margin:0 0 12px;"><a href="${SOCIAL_LINKS.facebook}" style="color:#3057c5;text-decoration:underline;">Facebook</a><span style="padding:0 12px;color:#a5afb9;">·</span><a href="${SOCIAL_LINKS.instagram}" style="color:#3057c5;text-decoration:underline;">Instagram</a></p>
<p style="margin:0;">OhTopUp · Everyday essentials</p><p style="margin:4px 0 0;font-size:11px;">&copy; ${new Date().getFullYear()} OhTopUp. All rights reserved.</p>
${unsubscribeUrl ? `<p style="margin:10px 0 0;"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#626d79;text-decoration:underline;">Unsubscribe</a></p>` : ''}
</td></tr></table></td></tr></table></body></html>`;
}

module.exports = { emailLayout, escapeHtml, SOCIAL_LINKS };
