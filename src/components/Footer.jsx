import { useState, useEffect } from 'react'
import { loadGroups, loadStudents } from '../data/loadData'

function Footer() {
  const [groupsCount, setGroupsCount] = useState(0)
  const [studentsCount, setStudentsCount] = useState(0)
  const [lastBackup, setLastBackup] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const groups = await loadGroups()
      setGroupsCount(groups.length)

      const students = await loadStudents()
      setStudentsCount(students.length)

      const saved = localStorage.getItem('lastBackup')
      if (saved) {
        setLastBackup(saved)
      } else {
        const now = new Date().toLocaleString()
        localStorage.setItem('lastBackup', now)
        setLastBackup(now)
      }
    }
    loadData()
  }, [])

  return (
    <footer className="footer">
      <p>Групп в системе: {groupsCount}</p>
      <p>Студентов в системе: {studentsCount}</p>
      <p>Последний бэкап: {lastBackup}</p>
    </footer>
  )
}

export default Footer