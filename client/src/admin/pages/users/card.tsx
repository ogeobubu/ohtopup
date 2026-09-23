import { IconType } from "react-icons";
export default function Card({ title, count, icon: Icon }: { title: string; count: string | number; icon: IconType; bgColor?: string }) {
  return <div className="min-w-0 rounded-md border border-line bg-paper p-5"><div><span>{title}</span><Icon /></div><strong>{count}</strong></div>;
}
