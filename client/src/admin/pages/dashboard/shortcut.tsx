import { FiWifi, FiTv, FiUsers, FiArrowUpRight } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function Shortcut() {
  return (
    <div className="px-4 pb-4 nav:px-5 nav:pb-4">
      {[
        { to: '/admin/users', label: 'Manage users', Icon: FiUsers },
        { to: '/admin/utilities?id=data', label: 'Buy data', Icon: FiWifi },
        { to: '/admin/utilities?id=tv', label: 'Buy cable', Icon: FiTv },
      ].map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex min-h-[46px] items-center gap-3 border-t border-line text-xs text-ink no-underline hover:text-accent"
        >
          <Icon className="shrink-0" />
          <span>{label}</span>
          <FiArrowUpRight className="ml-auto text-muted" />
        </Link>
      ))}
    </div>
  );
}
