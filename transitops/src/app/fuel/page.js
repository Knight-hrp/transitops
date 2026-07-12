const fuelLogs = [
  {
    id: 1,
    vehicle: "Truck-01",
    driver: "John Doe",
    litres: 120,
    amount: "₹8,400",
    date: "12 Jul 2026",
  },
  {
    id: 2,
    vehicle: "Van-03",
    driver: "Alex Smith",
    litres: 60,
    amount: "₹4,200",
    date: "14 Jul 2026",
  },
  {
    id: 3,
    vehicle: "Truck-05",
    driver: "David Lee",
    litres: 150,
    amount: "₹10,500",
    date: "16 Jul 2026",
  },
];

export default function FuelLogs() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              Fleet Fuel
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">
              Fuel Logs
            </h1>
            <p className="mt-2 text-slate-600">
              Monitor vehicle fuel consumption and expenses.
            </p>
          </div>

          <button className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md">
            + Add Fuel Log
          </button>
        </div>

        <div className="mb-8 flex flex-wrap gap-6">
          <div className="min-w-[220px] flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Fuel</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">330 L</h2>
            <p className="mt-2 text-sm text-emerald-600">+8% from last month</p>
          </div>

          <div className="min-w-[220px] flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Cost</p>
            <h2 className="mt-3 text-3xl font-semibold text-emerald-600">
              ₹23,100
            </h2>
            <p className="mt-2 text-sm text-slate-500">Across 3 vehicles</p>
          </div>

          <div className="min-w-[220px] flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Avg/Litre</p>
            <h2 className="mt-3 text-3xl font-semibold text-blue-600">₹70</h2>
            <p className="mt-2 text-sm text-slate-500">Stable this week</p>
          </div>
        </div>

        <div className="mb-6">
          <input
            placeholder="Search vehicle..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm font-semibold text-slate-600">
                <th className="px-6 py-5">Vehicle</th>
                <th className="px-6 py-5">Driver</th>
                <th className="px-6 py-5">Fuel</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Action</th>
              </tr>
            </thead>

            <tbody>
              {fuelLogs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                  <td className="px-6 py-5 font-semibold text-slate-800">
                    <span className="mr-2 text-indigo-600">⛽</span>
                    {log.vehicle}
                  </td>

                  <td className="px-6 py-5 text-slate-600">{log.driver}</td>
                  <td className="px-6 py-5 text-slate-600">{log.litres} L</td>
                  <td className="px-6 py-5 font-semibold text-emerald-600">
                    {log.amount}
                  </td>
                  <td className="px-6 py-5 text-slate-600">{log.date}</td>

                  <td className="px-6 py-5">
                    <div className="flex gap-3">
                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
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