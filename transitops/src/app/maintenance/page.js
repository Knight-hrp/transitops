const maintenanceData = [
  {
    id: 1,
    vehicle: "Truck-01",
    type: "Oil Change",
    date: "12 Jul 2026",
    cost: "₹2,500",
    status: "Completed",
  },
  {
    id: 2,
    vehicle: "Van-03",
    type: "Tyre Replacement",
    date: "15 Jul 2026",
    cost: "₹6,000",
    status: "Pending",
  },
  {
    id: 3,
    vehicle: "Truck-05",
    type: "Brake Repair",
    date: "18 Jul 2026",
    cost: "₹8,200",
    status: "Urgent",
  },
];

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* Header */}

        <div className="flex items-center justify-between mb-8">

          <div>
            <h1 className="text-4xl font-bold text-slate-800">
              Maintenance
            </h1>

            <p className="mt-2 text-slate-500">
              Monitor and manage all vehicle maintenance activities.
            </p>
          </div>

          <button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl">
            + Add Maintenance
          </button>

        </div>

        {/* Stats */}

        <div className="grid gap-6 md:grid-cols-3 mb-8">

          <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
            <p className="text-slate-500 text-sm">
              Total Jobs
            </p>

            <h2 className="mt-3 text-4xl font-bold text-slate-800">
              18
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
            <p className="text-slate-500 text-sm">
              Completed
            </p>

            <h2 className="mt-3 text-4xl font-bold text-green-600">
              12
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-200">
            <p className="text-slate-500 text-sm">
              Pending
            </p>

            <h2 className="mt-3 text-4xl font-bold text-yellow-500">
              6
            </h2>
          </div>

        </div>

        {/* Search */}

        <div className="mb-6 flex flex-wrap gap-4">

          <input
            placeholder="Search vehicle..."
            className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-500"
          />

          <select className="rounded-xl border border-slate-300 bg-white px-5 py-3">
            <option>All Status</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Urgent</option>
          </select>

        </div>

        {/* Table */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">

          <table className="w-full">

            <thead className="bg-slate-100">

              <tr className="text-left text-slate-600">

                <th className="px-6 py-5">Vehicle</th>
                <th className="px-6 py-5">Maintenance</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Cost</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Action</th>

              </tr>

            </thead>

            <tbody>

              {maintenanceData.map((item) => (

                <tr
                  key={item.id}
                  className="border-t transition hover:bg-slate-50"
                >

                  <td className="px-6 py-5 font-medium text-slate-700">
                    🚚 {item.vehicle}
                  </td>

                  <td className="px-6 py-5 text-slate-600">
                    {item.type}
                  </td>

                  <td className="px-6 py-5 text-slate-600">
                    {item.date}
                  </td>

                  <td className="px-6 py-5 font-semibold text-slate-700">
                    {item.cost}
                  </td>

                  <td className="px-6 py-5">

                    {item.status === "Completed" && (
                      <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                        ● Completed
                      </span>
                    )}

                    {item.status === "Pending" && (
                      <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
                        ● Pending
                      </span>
                    )}

                    {item.status === "Urgent" && (
                      <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
                        ● Urgent
                      </span>
                    )}

                  </td>

                  <td className="px-6 py-5">

                    <div className="flex gap-3">

                      <button className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-blue-100">
                        ✏️
                      </button>

                      <button className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-red-100">
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