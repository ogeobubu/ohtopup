import { IconType } from "react-icons";

export default function Card({ title, count, icon: Icon }: { title: string; count: number; icon: IconType }) {
  return <div className="ot-admin-metric"><div><span>{title}</span><Icon /></div><strong>{count.toLocaleString()}</strong></div>;
}
