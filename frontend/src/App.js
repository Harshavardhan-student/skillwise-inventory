import React, { useState } from 'react';
import ProductTable from "./components/ProductTable";
import Login from './components/Login';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (t) => {
    setToken(t || localStorage.getItem('token'));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <Toaster />
      <header className="p-4 bg-gray-100 flex justify-end">
        <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={logout}>Logout</button>
      </header>
      <ProductTable />
    </div>
  );
}
