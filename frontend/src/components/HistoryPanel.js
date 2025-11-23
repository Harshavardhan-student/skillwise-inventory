export default function HistoryPanel({ history, onClose }) {
  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l p-6 overflow-y-auto z-50">

      <h2 className="text-xl font-bold mb-4">Inventory History</h2>

      <button
        className="px-3 py-1 bg-red-500 text-white rounded mb-4"
        onClick={onClose}
      >
        Close
      </button>

      {history.length === 0 && (
        <p className="text-gray-500 mt-6">No history yet.</p>
      )}

      {history.map(h => (
        <div key={h.id} className="border-b py-3">
          <p><b>Old:</b> {h.old_quantity}</p>
          <p><b>New:</b> {h.new_quantity}</p>
          <p><b>By:</b> {h.changed_by}</p>
          <p><b>Date:</b> {new Date(h.timestamp).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
