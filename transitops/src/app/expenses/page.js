const expenses = [
  {
    id: 1,
    vehicle: "Truck-01",
    type: "Insurance",
    amount: "₹18,000",
    date: "10 Jul 2026",
    status: "Paid",
  },
  {
    id: 2,
    vehicle: "Van-03",
    type: "Repair",
    amount: "₹6,500",
    date: "12 Jul 2026",
    status: "Pending",
  },
  {
    id: 3,
    vehicle: "Truck-05",
    type: "Tyres",
    amount: "₹28,000",
    date: "15 Jul 2026",
    status: "Paid",
  },
];

export default function Expenses() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700">
              Fleet Expenses
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">
              Expenses
            </h1>
            <p className="mt-2 text-slate-600">
              Track operational expenses across your fleet.
            </p>
          </div>

          <button className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-rose-700 hover:shadow-md">
            + Add Expense
          </button>
        </div>

        <div className="mb-8 flex flex-wrap gap-6">
          <div className="min-w-[220px] flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Expenses</p>
            <h2 className="mt-3 text-3xl font-semibold text-rose-600">₹52,500</h2>
            <p className="mt-2 text-sm text-slate-500">Fleet-wide spend</p>
          </div>

          <div className="min-w-[220px] flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Paid</p>
            <h2 className="mt-3 text-3xl font-semibold text-emerald-600">₹46,000</h2>
            <p className="mt-2 text-sm text-slate-500">Completed payments</p>
          </div>

          <div className="min-w-[220px] flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Pending</p>
            <h2 className="mt-3 text-3xl font-semibold text-amber-500">₹6,500</h2>
            <p className="mt-2 text-sm text-slate-500">Awaiting review</p>
          </div>
        </div>

        <div className="mb-6">
          <input
            placeholder="Search vehicle or expense..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-slate-700 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm font-semibold text-slate-600">
                <th className="px-6 py-5">Vehicle</th>
                <th className="px-6 py-5">Expense Type</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Action</th>
              </tr>
            </thead>

            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                  <td className="px-6 py-5 font-semibold text-slate-800">
                    <span className="mr-2 text-rose-600">🚚</span>
                    {expense.vehicle}
                  </td>

                  <td className="px-6 py-5 text-slate-600">{expense.type}</td>
                  <td className="px-6 py-5 font-semibold text-rose-600">
                    {expense.amount}
                  </td>
                  <td className="px-6 py-5 text-slate-600">{expense.date}</td>

                  <td className="px-6 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        expense.status === "Paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {expense.status}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex gap-3">
                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700">
                        ✏️
                      </button>

                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}