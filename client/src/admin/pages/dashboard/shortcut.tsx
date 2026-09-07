import { FiWifi, FiTv, FiUsers, FiArrowUpRight } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function Shortcut() {
  return <div className="ot-admin-shortcuts">{[
    { to: '/admin/users', label: 'Manage users', Icon: FiUsers },
    { to: '/admin/utilities?id=data', label: 'Buy data', Icon: FiWifi },
    { to: '/admin/utilities?id=tv', label: 'Buy cable', Icon: FiTv },
  ].map(({ to, label, Icon }) => <Link key={to} to={to}><Icon /><span>{label}</span><FiArrowUpRight /></Link>)}</div>;
}
