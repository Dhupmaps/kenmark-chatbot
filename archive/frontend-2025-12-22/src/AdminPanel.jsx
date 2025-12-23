import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = ({ apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000') }) => {
  const [file, setFile] = useState(null);
  const [topQuestions, setTopQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) return alert('Choose a file first');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await axios.post(`${apiBase}/admin/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data', 'x-admin-key': process.env.REACT_APP_ADMIN_KEY }
      });
      alert(res.data.message || 'Uploaded');
      fetchTopQuestions();
    } catch (e) {
      console.error(e);
      alert('Upload failed. Check console.');
    }
  };

  const fetchTopQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/analytics/top-questions`);
      setTopQuestions(res.data.top || []);
    } catch (e) {
      console.error(e);
      setTopQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTopQuestions(); }, []);

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded shadow card">
      <h2 className="text-xl font-semibold mb-2">Admin</h2>
      <div className="mb-4">
        <label className="block text-sm text-gray-600 dark:text-gray-300">Upload knowledge (.xlsx)</label>
        <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files[0])} className="mt-2" />
        <div className="mt-2">
          <button onClick={upload} className="bg-purple-600 text-white px-3 py-1 rounded">Upload</button>
        </div>
      </div>

      <div>
        <h3 className="font-medium">Top Questions</h3>
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : (
          <ol className="mt-2 text-sm list-decimal list-inside text-gray-700 dark:text-gray-200">
            {topQuestions.length ? topQuestions.map((q, i) => (
              <li key={i}>{q.message} <span className="text-xs text-gray-400">({q.count})</span></li>
            )) : <li className="text-gray-500">No data yet</li>}
          </ol>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
