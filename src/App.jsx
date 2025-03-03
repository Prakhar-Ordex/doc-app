import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
// Remove App.css import as we'll use Tailwind CSS

// Main App Component
function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/method/:id" element={<MethodDetail />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

// Navigation Bar Component
function NavBar() {
  return (
    <nav className="flex justify-between items-center py-4 px-8 bg-gray-100 border-b border-gray-300">
      <div className="logo">
        <Link to="/" className="text-2xl font-bold text-gray-800 no-underline">JavaScript Docs</Link>
      </div>
      <div className="nav-links">
        <Link to="/" className="ml-6 text-gray-800 no-underline hover:text-blue-700">Home</Link>
        <Link to="/admin" className="ml-6 text-gray-800 no-underline hover:text-blue-700">Admin</Link>
      </div>
    </nav>
  );
}

// Sidebar Component for Method Navigation
function Sidebar() {
  const [methods, setMethods] = useState([]);
  const [categories, setCategories] = useState({});

  useEffect(() => {
    fetch('http://localhost:5000/api/methods')
      .then(res => res.json())
      .then(data => {
        setMethods(data);
        
        // Group methods by category
        const groupedMethods = data.reduce((acc, method) => {
          if (!acc[method.category]) {
            acc[method.category] = [];
          }
          acc[method.category].push(method);
          return acc;
        }, {});
        
        setCategories(groupedMethods);
      })
      .catch(err => console.error("Failed to fetch methods:", err));
  }, []);

  return (
    <div className="w-64 bg-gray-100 p-6 border-r border-gray-300 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">Method Categories</h3>
      {Object.keys(categories).map(category => (
        <div key={category} className="mb-6">
          <h4 className="text-gray-700 my-4">{category}</h4>
          <ul className="list-none">
            {categories[category].map(method => (
              <li key={method._id} className="my-2">
                <Link to={`/method/${method._id}`} className="text-blue-700 hover:underline block py-1">
                  {method.name}() Method
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// Home Page Component
function Home() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">JavaScript Methods Documentation</h1>
      <p className="text-lg">
        Welcome to our comprehensive guide to JavaScript methods. 
        Browse through the sidebar to find detailed documentation on various JavaScript methods.
      </p>
    </div>
  );
}

// Method Detail Component
function MethodDetail() {
  const { id } = useParams();
  const [method, setMethod] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/methods/${id}`)
      .then(res => res.json())
      .then(data => {
        setMethod(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch method details:", err);
        setLoading(false);
      });
  }, [id]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Code copied to clipboard!');
  };

  if (loading) return <div className="p-8 text-center text-lg">Loading...</div>;
  if (!method) return <div className="p-8 text-center text-lg text-red-500">Method not found</div>;

  const lastUpdated = new Date(method.updatedAt).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-4xl font-bold">{method.name}() Method</h1>
        <div className="flex items-center">
          <span className="text-gray-500 mr-4">Last Updated: {lastUpdated}</span>
        </div>
      </div>

      <div className="text-lg leading-relaxed mb-8">
        <p>The <strong>{method.name}()</strong> method {method.description}</p>
      </div>

      <div>
      <ReactMarkdown>{method.description  }</ReactMarkdown>
      </div>

      {method.examples.map((example, index) => (
        <div key={index} className="mb-8 border border-gray-300 rounded-md overflow-hidden">
          <div className="relative bg-gray-50">
            <button 
              className="absolute top-2 right-2 z-10 bg-blue-700 text-white py-1 px-2 rounded-md border-none cursor-pointer"
              onClick={() => copyToClipboard(example.code)}
            >
              Copy
            </button>
            <SyntaxHighlighter 
              language="javascript" 
              style={materialLight}
              className="mt-0 rounded-none"
            >
              {example.code}
            </SyntaxHighlighter>
          </div>
          
          <div className="p-4 bg-gray-100">
            <h3 className="text-lg font-semibold mb-2">Output</h3>
            <div className="p-4 bg-gray-200 rounded-md font-mono">
              {example.output}
            </div>
          </div>
        </div>
      ))}

    </div>
  );
}

// Admin Component for Adding/Editing Methods
function Admin() {
  const [methods, setMethods] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Array',
    description: '',
    syntax: '',
    returnValue: '',
    examples: [{ code: '', output: '' }],
    parameters: [{ name: '', description: '' }]
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = () => {
    fetch('http://localhost:5000/api/methods')
      .then(res => res.json())
      .then(data => setMethods(data))
      .catch(err => console.error("Failed to fetch methods:", err));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExampleChange = (index, field, value) => {
    const newExamples = [...formData.examples];
    newExamples[index][field] = value;
    setFormData(prev => ({ ...prev, examples: newExamples }));
  };

  const handleParameterChange = (index, field, value) => {
    const newParams = [...formData.parameters];
    newParams[index][field] = value;
    setFormData(prev => ({ ...prev, parameters: newParams }));
  };

  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, { code: '', output: '' }]
    }));
  };

  const addParameter = () => {
    setFormData(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: '', description: '' }]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const url = editingId 
      ? `http://localhost:5000/api/methods/${editingId}`
      : 'http://localhost:5000/api/methods';
    
    const method = editingId ? 'PUT' : 'POST';
    
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(() => {
        alert(`Method ${editingId ? 'updated' : 'added'} successfully!`);
        resetForm();
        fetchMethods();
      })
      .catch(err => console.error(`Failed to ${editingId ? 'update' : 'add'} method:`, err));
  };

  const editMethod = (method) => {
    setFormData(method);
    setEditingId(method._id);
  };

  const deleteMethod = (id) => {
    if (window.confirm('Are you sure you want to delete this method?')) {
      fetch(`http://localhost:5000/api/methods/${id}`, {
        method: 'DELETE',
      })
        .then(() => {
          alert('Method deleted successfully!');
          fetchMethods();
        })
        .catch(err => console.error("Failed to delete method:", err));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Array',
      description: '',
      syntax: '',
      returnValue: '',
      examples: [{ code: '', output: '' }],
      parameters: [{ name: '', description: '' }]
    });
    setEditingId(null);
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit' : 'Add'} JavaScript Method</h2>
      <form onSubmit={handleSubmit} className="mb-12">
        <div className="mb-6">
          <label className="block font-bold mb-2">Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md font-inherit text-base"
          />
        </div>

        <div className="mb-6">
          <label className="block font-bold mb-2">Category:</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md font-inherit text-base"
          >
            <option value="Array">Array</option>
            <option value="String">String</option>
            <option value="Object">Object</option>
            <option value="Number">Number</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block font-bold mb-2">Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md font-inherit text-base min-h-32"
          />
        </div>

        <div className="mb-6">
          <label className="block font-bold mb-2">Syntax:</label>
          <input
            type="text"
            name="syntax"
            value={formData.syntax}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md font-inherit text-base"
          />
        </div>

        <div className="mb-6">
          <label className="block font-bold mb-2">Return Value:</label>
          <textarea
            name="returnValue"
            value={formData.returnValue}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md font-inherit text-base min-h-32"
          />
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Parameters</h3>
          {formData.parameters.map((param, idx) => (
            <div key={idx} className="mb-4 p-4 border border-gray-300 rounded-md flex flex-col gap-2">
              <input
                type="text"
                placeholder="Parameter Name"
                value={param.name}
                onChange={e => handleParameterChange(idx, 'name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md font-inherit text-base"
              />
              <textarea
                placeholder="Parameter Description"
                value={param.description}
                onChange={e => handleParameterChange(idx, 'description', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md font-inherit text-base"
              />
            </div>
          ))}
          <button 
            type="button" 
            onClick={addParameter} 
            className="bg-blue-700 text-white py-2 px-4 rounded-md border-none cursor-pointer"
          >
            Add Parameter
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Examples</h3>
          {formData.examples.map((example, idx) => (
            <div key={idx} className="mb-4 p-4 border border-gray-300 rounded-md flex flex-col gap-2">
              <textarea
                placeholder="Code Example"
                value={example.code}
                onChange={e => handleExampleChange(idx, 'code', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md font-inherit text-base"
              />
              <textarea
                placeholder="Output"
                value={example.output}
                onChange={e => handleExampleChange(idx, 'output', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md font-inherit text-base"
              />
            </div>
          ))}
          <button 
            type="button" 
            onClick={addExample} 
            className="bg-blue-700 text-white py-2 px-4 rounded-md border-none cursor-pointer"
          >
            Add Example
          </button>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            type="submit" 
            className="bg-green-600 text-white font-bold py-3 px-6 rounded-md border-none cursor-pointer"
          >
            {editingId ? 'Update Method' : 'Add Method'}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={resetForm} 
              className="bg-red-600 text-white font-bold py-3 px-6 rounded-md border-none cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Existing Methods</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left border-b border-gray-300">Name</th>
              <th className="p-3 text-left border-b border-gray-300">Category</th>
              <th className="p-3 text-left border-b border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {methods.map(method => (
              <tr key={method._id}>
                <td className="p-3 border-b border-gray-300">{method.name}</td>
                <td className="p-3 border-b border-gray-300">{method.category}</td>
                <td className="p-3 border-b border-gray-300">
                  <button 
                    onClick={() => editMethod(method)} 
                    className="bg-blue-600 text-white py-1 px-3 rounded-md border-none cursor-pointer mr-2"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => deleteMethod(method._id)} 
                    className="bg-red-600 text-white py-1 px-3 rounded-md border-none cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;