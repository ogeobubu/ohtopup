export default function Status({ status }: { status: string }) {
  const value = (status || "unknown").toLowerCase();
  const tone = ["delivered", "completed", "successful", "approved", "active"].includes(value)
    ? "text-success dark:text-success-dark"
    : ["failed", "rejected", "cancelled", "inactive"].includes(value)
      ? "text-danger dark:text-danger-dark"
      : "text-warning dark:text-warning-dark";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] before:h-[5px] before:w-[5px] before:rounded-full before:bg-current ${tone}`}
    >
      {value.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase())}
    </span>
  );
}
