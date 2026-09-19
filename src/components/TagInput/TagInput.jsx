import { useEffect, useState } from 'react'
import { getLookups } from '../../lib/api.js'
import './TagInput.css'

export default function TagInput({ label, kind, values, onChange, placeholder }) {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState([])
  useEffect(() => { getLookups(input).then((data) => setOptions(data[kind] || [])).catch(() => {}) }, [input, kind])
  function add(value) { const clean = value.trim(); if (clean && !values.includes(clean)) onChange([...values, clean]); setInput('') }
  return <label className="tag-input"><span>{label}</span><div className="tag-input__box">{values.map((value) => <button type="button" key={value} onClick={() => onChange(values.filter((item) => item !== value))}>{value} x</button>)}<input value={input} placeholder={placeholder} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(input) } }} /></div>{input && <div className="tag-input__suggestions">{options.filter((option) => !values.includes(option.name)).map((option) => <button type="button" key={option.id} onClick={() => add(option.name)}>{option.name}</button>)}<button type="button" onClick={() => add(input)}>Add "{input}" as new</button></div>}</label>
}
