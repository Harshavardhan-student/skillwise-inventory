const API_BASE = "http://localhost:5000/api/products";

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getProducts = async ({ page = 1, limit = 10, sort = 'id', order = 'ASC' } = {}) => {
  const params = new URLSearchParams({ page, limit, sort, order });
  const res = await fetch(`${API_BASE}?${params.toString()}`, { headers: { ...getAuthHeaders() } });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Failed to fetch products');
  }
  // normalize backend responses: some backends return an array, others return
  // an object { products, page, pages, total, limit }
  if (Array.isArray(body)) {
    return { products: body, page: page, pages: 1, total: body.length, limit };
  }
  return body;
};

export const searchProducts = async (name) => {
  const res = await fetch(`${API_BASE}/search?name=${encodeURIComponent(name)}`, { headers: { ...getAuthHeaders() } });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Search failed');
  return body;
};

export const updateProduct = async (id, data) => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Update failed');
  return body;
};

export const importCSV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/import`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Import failed');
  return body;
};

export const downloadCSV = async () => {
  // use fetch so we can include Authorization header, then download blob
  const res = await fetch(`${API_BASE}/export`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) {
    let body;
    try { body = await res.json(); } catch(e) { body = null; }
    throw new Error((body && body.error) || 'Failed to download');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const getHistory = async (id) => {
  const res = await fetch(`${API_BASE}/${id}/history`, { headers: { ...getAuthHeaders() } });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Failed to get history');
  return body;
};


export const deleteProduct = async (id) => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) {
    let body;
    try { body = await res.json(); } catch(e) { body = null; }
    throw new Error((body && body.error) || 'Delete failed');
  }
};
