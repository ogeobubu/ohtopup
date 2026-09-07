import { FiUser, FiSettings, FiShield, FiBell, FiCheckCircle } from 'react-icons/fi';

const tabs = [['Profile', FiUser], ['General', FiSettings], ['Security', FiShield], ['Notification', FiBell], ['Services', FiCheckCircle]] as const;
export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  return <nav className="ot-admin-settings-nav" aria-label="Settings sections">{tabs.map(([name, Icon]) => <button key={name} aria-pressed={activeTab === name} onClick={() => setActiveTab(name)}><Icon />{name}</button>)}</nav>;
}
