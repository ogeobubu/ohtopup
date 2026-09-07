import { IconType } from "react-icons";
export default function Card({ title, count, icon: Icon }: { title: string; count: string | number; icon: IconType; bgColor?: string }) {
  return <div className="ot-admin-metric"><div><span>{title}</span><Icon /></div><strong>{count}</strong></div>;
}
