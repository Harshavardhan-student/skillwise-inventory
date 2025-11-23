export default function AddProductModal({ onClose, onSave }) {

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">

      <div className="bg-white p-6 rounded shadow-xl w-[420px]">

        <h2 className="text-xl font-bold mb-4">Add Product</h2>

        <form 
          onSubmit={(e) => {
            e.preventDefault();

            const data = Object.fromEntries(new FormData(e.target));

            onSave(data);
          }}
          className="space-y-3"
        >

          <input name="name" placeholder="Name" className="border p-2 rounded w-full"/>

          <input name="unit" placeholder="Unit" className="border p-2 rounded w-full"/>

          <input name="category" placeholder="Category" className="border p-2 rounded w-full"/>

          <input name="brand" placeholder="Brand" className="border p-2 rounded w-full"/>

          <input name="stock" type="number" placeholder="Stock" className="border p-2 rounded w-full"/>

          <input name="status" placeholder="Status" className="border p-2 rounded w-full"/>

          
          <button className="px-4 py-2 bg-green-600 text-white rounded w-full mt-2">
            Save
          </button>

        </form>

        <button 
          className="px-4 py-2 bg-gray-800 text-white rounded w-full mt-3"
          onClick={onClose}
        >
          Close
        </button>

      </div>

    </div>
  );
}
