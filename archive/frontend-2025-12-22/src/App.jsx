import ChatWidget from './ChatWidget';
import AdminPanel from './AdminPanel';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center py-12">
      <header className="w-full max-w-4xl px-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">Kenmark <span className="text-purple-600">ITan</span> Solutions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300">AI-driven support, grounded in your company's knowledge</p>
          </div>
          <div className="hidden md:block">
            <button className="bg-purple-600 text-white px-3 py-1 rounded">Get Started</button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-4xl px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2">
          <div className="card">
            <h2 className="text-2xl font-semibold mb-3">Website & Content</h2>
            <p className="text-gray-700 dark:text-gray-200">This is a demo site showing how the Kenmark chatbot integrates with Excel knowledge sources and website content to provide accurate answers.</p>
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <h3 className="font-semibold mb-2">Chatbot User Interface</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-200">
                <li>Floating or embedded chatbot on the website</li>
                <li>Text-based user input</li>
                <li>AI-generated responses</li>
                <li>Chat history persists during the session</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 card">
            <h3 className="text-lg font-semibold">RAG & Knowledge</h3>
            <p className="text-gray-700 dark:text-gray-200">The system performs lightweight retrieval from uploaded Excel files and website content and sends only the retrieved context to the LLM. The LLM is instructed NOT to hallucinate—if no matching information is found, it returns a polite fallback.</p>
          </div>
        </section>

        <aside>
          <AdminPanel />
        </aside>
      </main>

      {/* Floating Chatbot */}
      <ChatWidget />
    </div>
  );
}

export default App;