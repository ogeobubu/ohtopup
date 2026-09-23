import { IconType } from "react-icons";

export default function Card({ title, count, icon: Icon }: { title: string; count: number; icon: IconType }) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-paper p-4 nav:p-5">
      <div className="flex items-center justify-between gap-2.5 text-[11px] text-muted">
        <span>{title}</span>
        <Icon className="shrink-0 text-base" />
      </div>
      <strong className="mt-3.5 block text-[25px] font-mediumish tracking-[-0.7px] tabular-nums nav:text-[28px]">
        {count.toLocaleString()}
      </strong>
    </div>
  );
}
