import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      onLogin && onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h3 className="text-xl font-semibold mb-4">Login</h3>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <label className="block mb-2">
          <div className="text-sm mb-1">Username</div>
          <input className="w-full border px-3 py-2 rounded" value={username} onChange={e=>setUsername(e.target.value)} />
        </label>
        <label className="block mb-4">
          <div className="text-sm mb-1">Password</div>
          <input type="password" className="w-full border px-3 py-2 rounded" value={password} onChange={e=>setPassword(e.target.value)} />
        </label>
        <div className="flex justify-end">
          <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
}
