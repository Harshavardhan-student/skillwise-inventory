import React, { useEffect, useState, useMemo } from "react";
import { 
  getProducts, 
  updateProduct, 
  downloadCSV, 
  importCSV,
  getHistory,
  deleteProduct
} from "../api/products";
import toast from 'react-hot-toast';


import HistoryPanel from "./HistoryPanel";
import AddProductModal from "./AddProductModal";

export default function ProductTable() {

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  

  // pagination / sorting state
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState('ASC');

  const fetchData = async (opts = {}) => {
    const p = opts.page || page;
    const l = opts.limit || limit;
    const s = opts.sort || sort;
    const o = opts.order || order;
    try {
      const data = await getProducts({ page: p, limit: l, sort: s, order: o });

      // backend returns { products, page, pages, total, limit }
      setProducts(data.products || []);
      setPage(data.page || p);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      setLimit(data.limit || l);

      const uniqueCategories = [...new Set((data.products || []).map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching products', err);
      toast.error(err.message || 'Failed to load products');
    }
  };

  useEffect(() => {
    fetchData({ page, limit, sort, order });
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  const handleSearch = (value) => {
    setSearch(value);
  };

  const startEditing = (id) => {
    setProducts(products.map(p => p.id === id ? { ...p, editing: true } : p));
  };

  const cancelEdit = (id) => {
    setProducts(products.map(p => p.id === id ? { ...p, editing: false } : p));
  };

  const updateField = (id, field, value) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const saveRow = async (id) => {
    const item = products.find(p => p.id === id);
    try {
      await updateProduct(id, item);
      toast.success('Save successful');
      fetchData({ page, limit, sort, order });
    } catch (err) {
      console.error('Save error', err);
      toast.error(err.message || 'Save failed');
    }
  };

  const openHistory = async (id) => {
    const data = await getHistory(id);
    setHistory(data);
    setShowHistory(true);
  };

  const saveNew = async (data) => {
    try {
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
        body: JSON.stringify(data)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Add failed');
      toast.success('Add successful');
      setShowAdd(false);
      fetchData({ page: 1, limit, sort, order });
    } catch (err) {
      console.error('Add error', err);
      toast.error(err.message || 'Add failed');
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete product?")) return;
    try {
      await deleteProduct(id);
      toast.success('Delete successful');
      fetchData({ page, limit, sort, order });
    } catch (err) {
      console.error('Delete error', err);
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleSort = (col) => {
    if (sort === col) {
      // toggle order
      const newOrder = order === 'ASC' ? 'DESC' : 'ASC';
      setOrder(newOrder);
      setSort(col);
      fetchData({ page: 1, limit, sort: col, order: newOrder });
      setPage(1);
    } else {
      setSort(col);
      setOrder('ASC');
      fetchData({ page: 1, limit, sort: col, order: 'ASC' });
      setPage(1);
    }
  };

  const goPrev = () => {
    if (page <= 1) return;
    const np = page - 1;
    setPage(np);
    fetchData({ page: np, limit, sort, order });
  };

  const goNext = () => {
    if (page >= pages) return;
    const np = page + 1;
    setPage(np);
    fetchData({ page: np, limit, sort, order });
  };


  return (
    <div className="p-8">

      <h2 className="text-3xl font-bold mb-6">Products</h2>


      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 w-full max-w-full">

        <input
          className="border border-gray-400 rounded px-4 py-2 w-full md:w-80"
          placeholder="Search products..."
          value={search}
          onChange={(e)=> handleSearch(e.target.value)}
        />

        <div className="flex flex-col md:flex-row items-center gap-3">
        
          <select
            className="border border-gray-400 rounded px-3 py-2 w-full md:w-auto"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button 
            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => setShowAdd(true)}
          >
            Add Product
          </button>

          <button 
            onClick={async ()=>{
              try {
                await downloadCSV();
                toast.success('CSV exported');
              } catch (err) {
                console.error('Export error', err);
                toast.error(err.message || 'Export failed');
              }
            }}
            className="w-full md:w-auto px-4 py-2 bg-gray-900 text-white rounded"
          >
            Export CSV
          </button>

          <input
            type="file"
            className="border border-gray-400 px-3 py-2 rounded w-full md:w-auto"
            onChange={ async(e)=>{
              try {
                const res = await importCSV(e.target.files[0]);
                toast.success(`CSV imported (${res.added || 0} added, ${res.skipped || 0} skipped)`);
                fetchData();
              } catch (err) {
                console.error('Import error', err);
                toast.error(err.message || 'Import failed');
              }
            }}
          />
        </div>
      </div>


      <div className="w-full max-w-full overflow-x-auto">
      <table className="min-w-full w-full border border-gray-300 rounded-lg overflow-hidden shadow-md">
        <thead className="bg-gray-200 text-gray-700 uppercase text-sm">
          <tr>
            <th className="p-3 cursor-pointer" onClick={() => handleSort('name')}>Name {sort === 'name' && (order==='ASC' ? '▲' : '▼')}</th>
            <th className="p-3 cursor-pointer" onClick={() => handleSort('unit')}>Unit {sort === 'unit' && (order==='ASC' ? '▲' : '▼')}</th>
            <th className="p-3 cursor-pointer" onClick={() => handleSort('category')}>Category {sort === 'category' && (order==='ASC' ? '▲' : '▼')}</th>
            <th className="p-3 cursor-pointer" onClick={() => handleSort('brand')}>Brand {sort === 'brand' && (order==='ASC' ? '▲' : '▼')}</th>
            <th className="p-3 cursor-pointer" onClick={() => handleSort('stock')}>Stock {sort === 'stock' && (order==='ASC' ? '▲' : '▼')}</th>
            <th className="p-3 cursor-pointer" onClick={() => handleSort('status')}>Status {sort === 'status' && (order==='ASC' ? '▲' : '▼')}</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredProducts.map(p => (
            <tr 
              key={p.id} 
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => openHistory(p.id)}
            >

              <td className="p-3">
                {p.editing ?
                  <input className="border rounded px-2" value={p.name} onChange={(e)=>updateField(p.id,"name",e.target.value)} />
                  : p.name}
              </td>

              <td className="p-3">
                {p.editing ?
                  <input className="border rounded px-2" value={p.unit} onChange={(e)=>updateField(p.id,"unit",e.target.value)} />
                  : p.unit}
              </td>

              <td className="p-3">
                {p.editing ?
                  <input className="border rounded px-2" value={p.category} onChange={(e)=>updateField(p.id,"category",e.target.value)} />
                  : p.category}
              </td>

              <td className="p-3">
                {p.editing ?
                  <input className="border rounded px-2" value={p.brand} onChange={(e)=>updateField(p.id,"brand",e.target.value)} />
                  : p.brand}
              </td>

              <td className="p-3">
                {p.editing ?
                  <input className="border rounded px-2" value={p.stock} onChange={(e)=>updateField(p.id,"stock",e.target.value)} />
                  : p.stock}
              </td>

              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  p.status === "In Stock"
                  ? "bg-green-200 text-green-800"
                  : "bg-red-200 text-red-800"
                }`}>
                  {p.status}
                </span>
              </td>

              <td className="p-3" onClick={(e)=>e.stopPropagation()}>

                {!p.editing && (
                  <div className="flex flex-col md:flex-row gap-2">

                    <button 
                      className="w-full md:w-auto px-3 py-1 bg-blue-600 text-white rounded"
                      onClick={() => startEditing(p.id)}
                    >
                      Edit
                    </button>

                    <button 
                      className="w-full md:w-auto px-3 py-1 bg-red-600 text-white rounded"
                      onClick={() => remove(p.id)}
                    >
                      Delete
                    </button>

                  </div>
                )}

                {p.editing && (
                  <div className="flex flex-col md:flex-row gap-2">
                    <button 
                      className="w-full md:w-auto px-3 py-1 bg-green-600 text-white rounded"
                      onClick={() => saveRow(p.id)}
                    >
                      Save
                    </button>

                    <button 
                      className="w-full md:w-auto px-3 py-1 bg-gray-500 text-white rounded"
                      onClick={() => cancelEdit(p.id)}
                    >
                      Cancel
                    </button>
                  </div>
                )}

              </td>

            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Page {page} of {pages} — {total} items</div>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} disabled={page<=1} className={`px-3 py-1 rounded border ${page<=1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
            Prev
          </button>
          <button onClick={goNext} disabled={page>=pages} className={`px-3 py-1 rounded border ${page>=pages ? 'opacity-50 cursor-not-allowed' : ''}`}>
            Next
          </button>
        </div>
      </div>


      {showHistory && (
        <HistoryPanel 
          history={history}
          onClose={()=> setShowHistory(false)}
        />
      )}

      {showAdd && (
        <AddProductModal 
          onClose={() => setShowAdd(false)}
          onSave={saveNew}
        />
      )}

    </div>
  );
}
