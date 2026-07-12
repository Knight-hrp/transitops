export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-slate-800">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Smart Transport Operations Platform
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl bg-white shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl mb-3">🚚</div>
            <p className="text-gray-500 text-sm">Vehicles</p>
            <h2 className="text-4xl font-bold text-slate-800 mt-2">12</h2>
          </div>

          <div className="rounded-2xl bg-white shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl mb-3">🛣️</div>
            <p className="text-gray-500 text-sm">Trips</p>
            <h2 className="text-4xl font-bold text-blue-600 mt-2">25</h2>
          </div>

          <div className="rounded-2xl bg-white shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl mb-3">⛽</div>
            <p className="text-gray-500 text-sm">Fuel Cost</p>
            <h2 className="text-4xl font-bold text-emerald-600 mt-2">
              ₹45K
            </h2>
          </div>

          <div className="rounded-2xl bg-white shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl mb-3">🛠️</div>
            <p className="text-gray-500 text-sm">Maintenance</p>
            <h2 className="text-4xl font-bold text-red-500 mt-2">4</h2>
          </div>

        </div>

      </div>
    </div>
  );
}