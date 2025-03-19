import React, { useState } from 'react';
import { Send, ArrowLeftRight, Type, Database } from 'lucide-react';

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8000/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.result);
      }
    } catch (error) {
      setError('Failed to connect to the backend server. Please make sure it is running.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const ResultDisplay = ({ result }: { result: string }) => {
    try {
      // Try to parse the result as JSON
      const jsonData = JSON.parse(result);

      // Check if it's an array of objects
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        const columns = Object.keys(jsonData[0]);

        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jsonData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {columns.map((column) => (
                      <td key={`${rowIndex}-${column}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {JSON.stringify(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      // If it's JSON but not an array of objects, display formatted JSON
      return (
        <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      );
    } catch {
      // If it's not JSON, display as plain text
      return (
        <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
          {result}
        </pre>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Type className="w-8 h-8 text-green-600" />
            <ArrowLeftRight className="w-6 h-6 text-gray-400" />
            <Database className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Text to SQL Converter</h1>
          <p className="text-gray-600">Convert natural language into SQL queries and execute them</p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="mb-6">
              <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                Describe your query in natural language
              </label>
              <textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-32 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Show me all employees who are female"
              />
            </div>

            <button
              onClick={handleConvert}
              disabled={loading || !text.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Convert & Execute
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && !error && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Query Result</h2>
              <ResultDisplay result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;