const STATUS_STYLES = {
  Draft: "bg-zinc-100 text-zinc-700",
  Dispatched: "bg-blue-100 text-blue-800",
  "In Progress": "bg-indigo-100 text-indigo-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-red-100 text-red-800",
  Available: "bg-emerald-100 text-emerald-800",
  "On Trip": "bg-amber-100 text-amber-800",
  "In Shop": "bg-orange-100 text-orange-800",
  Suspended: "bg-red-100 text-red-800",
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
