import ChatWidget from '../components/ChatWidget.client'
import AdminPanel from '../components/AdminPanel.client'
import ThemeToggle from '../components/ThemeToggle.client'

export default function Page(){
  return (
    <main className="min-h-screen p-8 hero">
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold">Learn. Create.<span className="gradient-text">Impress.</span></h1>
          <p className="text-gray-700 dark:text-gray-300 mt-2">One Stop Shop for all your IT Solutions</p>
        </div>
        <ThemeToggle />
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="md:col-span-2">
          <div className="p-6 rounded-2xl bg-white text-gray-900 dark:bg-slate-800 dark:text-white shadow-xl ring-1 ring-black/5 dark:ring-white/10">
            <h3 className="font-semibold mb-2">Our Solutions</h3>
            <ul className="list-disc list-inside">
              {/* Item 1 */}
      <li className="flex items-center gap-4">
        <img 
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJrPYCaKX2rBLNV10BOEmf_lrzbxbudvIpaA&s" 
          alt="Web Dev" 
          className="w-12 h-12 rounded-lg object-cover bg-gray-100" 
        />
        <span><strong>Web Development:</strong> Custom websites tailored to your needs</span>
      </li>

      {/* Item 2 */}
      <li className="flex items-center gap-4">
        <img 
          src="data:image/png;base64,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"
          alt="Ads" 
          className="w-12 h-12 rounded-lg object-cover bg-gray-100" 
        />
        <span><strong>Online Advertisement:</strong> Boost your online presence and reach</span>
      </li>

      {/* Item 3 */}
      <li className="flex items-center gap-4">
        <img 
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAgVBMVEX///8AAAD4+Pi9vb25ubn19fXBwcH8/Pzx8fH39/eHh4dqamrExMTMzMyioqKysrLh4eGamprT09Ompqbb29tbW1usrKwyMjImJibn5+dlZWUdHR1ZWVl9fX2Pj49KSkpDQ0N4eHgPDw88PDyVlZVxcXEXFxcgICBNTU0tLS04ODglZ2q0AAADvElEQVR4nO3ba3eiMBCAYe/gBRTFW0Xbam21//8HbpNQu60iPWHAuPs+H/bsQeDMQBKSgdZqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIC74jXavt/1bh1GWUaT/a6uvE57QfvW0Yhrzx7rf1ut41uHJGuyqJ/pj24dlZzR03l+SnTrwKQMPzOa92aDIGhF088Nyb/RHSOTzSJafm0bpEkultnH3Y00wejHM2J80Jvf/NtEJcg00cOFUcWk/tSoPiZRsRk2L6Yx0L89Vx2SAC8edAZjk5QeRR8ydgx0is3qIhOxDHfpQLnYjGoT9Z9d5s4t9fOxW2F4hS2fvz/UV+rfK+PlWv0eVhdfYbNLz/VrCXS36mbfz1R8fSnB640wVLt0qgqwqL1JaReNfd+PZ8lvpmae2mVfUYBF9XRC78FpwyjJ6YWK7rglRyakqRPsfdv20S+nOYfph+JdrDLaen308mPruD7LOc5Xh7XKikpSeLlDLfPmnd4it6864lVlaDPsJ2dt2016AjaxOfLhTuamG5Wh1TJBrRTX0uGUQM2w+zYHeurIjXQ4Jch/tmfwrJt3leJQdab60ObYpTpyIB2RqMZpuWS10JtYd+CqhF9zbKt7qAvFL+6uLuL5L5dJWZZFrk4FTuvBx14rCGzKZtHnGfpOFt1eTHDz0L7q2Qh6x/QsDpZO0+s/KVhnaQ9NjlvnVhi6jFR/Erj0nllaulYdHpnuIzMKmtLpQeRcUjxdlbeaqF0Sq5KUW7M3Xa0XLMmb6rBDr00bc+mA9OQmqzp+A035RpW4dRMT2yV9Nv0Sx5mVYve8rlbc1KXCYrOMFqUfGUH+fpVQRYs36QWBd6keeSsHyWfhiVpHJ+JntbMo5fGsWsZK/Kx2bJeD100cGmrKKR8NHctQ/h66lGE5/TB0KMOklLFULROP4me1o0a9rfhZ1XXLe99YlY5qT2Phk7bL6d12GioY6TdGwzIumzVdxhf+dvKxlKZvayC/1BmXsV6x5+3Em5Q+o0NFUz3WHAXbqS4vO/Vlje6JB7FSlL5iLt3CWm2pv01IhKq4pmDqyqMiZYKai/RF84rHoUqbkX6Dvyl8G2PzXfu7e1/upy/XXtdBgYKG30q/21859tpCMw1VV7/X4bD1XTND58sw2h9PZ3AxwY8bcPrjkKJ6zr7obr1L5Dd1Zjp6gdfpb4ulN3f/79j8INof3mySWyTrSXwv3+p7XuNXuu2Truds5wMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/9Af3LQiMRoaUbUAAAAASUVORK5CYII=" 
          alt="Cloud" 
          className="w-12 h-12 rounded-lg object-cover bg-gray-100" 
        />
        <span><strong>Cloud Solutions:</strong> Scalable and secure cloud infrastructure</span>
      </li>

            </ul>
          </div>
        </section>
        <aside className="md:col-span-1">
          <AdminPanel />
        </aside>
      </div>

      <ChatWidget />
    </main>
  )
}
