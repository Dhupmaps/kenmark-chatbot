'use client'
import React, { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle(){
  const [dark, setDark] = useState(false)
  useEffect(()=>{
    try{
      const stored = localStorage.getItem('kenmark_theme')
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const useDark = stored ? stored === 'dark' : prefersDark
      setDark(useDark)
    }catch(e){}
  },[])

  useEffect(()=>{
    try{
      const el = document.documentElement
      if(dark){ el.classList.add('dark'); localStorage.setItem('kenmark_theme','dark') }
      else { el.classList.remove('dark'); localStorage.setItem('kenmark_theme','light') }
    }catch(e){}
  },[dark])

  return (
    <button
      onClick={()=>setDark(v=>!v)}
      aria-label="Toggle theme"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`h-10 w-10 rounded-full shadow-lg transition-colors flex items-center justify-center border ${dark ? 'bg-gray-900 text-white border-gray-700 hover:bg-gray-800' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-100'}`}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}