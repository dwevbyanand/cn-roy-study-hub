import { useMemo, useState } from 'react'
import { managementGrades } from '../features/grades/management-grades'

export function Calculators() {
  const [rows,setRows] = useState([{id:1,credits:'4',points:'10'}])
  const [next,setNext] = useState(2)
  const result = useMemo(() => {
    const valid = rows.map(r=>({credits:Number(r.credits),points:Number(r.points)})).filter(r=>r.credits>0 && r.points>=0 && r.points<=10)
    const credits = valid.reduce((s,r)=>s+r.credits,0)
    const weighted = valid.reduce((s,r)=>s+r.credits*r.points,0)
    return credits ? {cgpa:(weighted/credits).toFixed(2),credits} : null
  },[rows])
  return <><div className="page-heading"><h1>Calculators</h1><p>Calculate a weighted CGPA from course credits and grade points.</p></div>
    <section className="panel"><h2>CGPA Calculator</h2><p className="muted">Enter each completed course once. Use the grade points shown on your academic transcript.</p>
      {rows.map((row,i)=><div className="score-row" key={row.id}>
        <label>Course {i+1}<input value={row.credits} type="number" min="0.01" step="any" aria-label={`Course ${i+1} credits`} onChange={e=>setRows(old=>old.map(r=>r.id===row.id?{...r,credits:e.target.value}:r))}/></label>
        <label>Grade points<input value={row.points} type="number" min="0" max="10" step="any" onChange={e=>setRows(old=>old.map(r=>r.id===row.id?{...r,points:e.target.value}:r))}/></label>
        <button className="outline remove" onClick={()=>setRows(old=>old.length>1?old.filter(r=>r.id!==row.id):old)} aria-label="Remove course">×</button>
      </div>)}
      <div className="actions"><button className="outline" onClick={()=>{setRows(old=>[...old,{id:next,credits:'4',points:'10'}]);setNext(n=>n+1)}}>+ Add course</button></div>
      <output className="result">{result?`${result.cgpa} / 10 CGPA · ${result.credits} credits`:'Enter valid credits and grade points.'}</output>
      <details><summary>Grade scale</summary><p className="muted">Grade point reference included in the original project:</p><ul>{managementGrades.map(g=><li key={g.letter}>{g.letter}: {g.points} points (minimum score {g.minimum})</li>)}</ul></details>
    </section>
  </>
}
