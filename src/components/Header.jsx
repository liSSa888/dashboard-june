import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { loadGroups, loadStudents } from '../data/loadData'

function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [groups, setGroups] = useState([])
  const [students, setStudents] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const loadData = async () => {
      setGroups(await loadGroups())
      setStudents(await loadStudents())
    }
    loadData()
  }, [])

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const lowerQuery = query.toLowerCase()

    const matchedStudents = students.filter(s =>
      s.name.toLowerCase().includes(lowerQuery)
    ).map(s => ({ type: 'student', name: s.name, group: s.group, id: s.id }))

    const matchedGroups = groups.filter(g =>
      g.toLowerCase().includes(lowerQuery)
    ).map(g => ({ type: 'group', name: g }))

    setSearchResults([...matchedStudents, ...matchedGroups].slice(0, 8))
    setShowResults(true)
  }

  const handleResultClick = (result) => {
    setShowResults(false)
    setSearchQuery('')

    if (result.type === 'student') {
      localStorage.setItem('searchGroup', result.group)
    } else if (result.type === 'group') {
      localStorage.setItem('searchGroup', result.name)
    }

    navigate('/dashboard')
    setTimeout(() => {
      window.location.reload()
    }, 50)
  }

  return (
    <header className="header">
      <div className="header-row">
        <div className="logo">
          <Link to="/dashboard">
            <img className="img-logo" src="/images/icon-icons.png" alt="Logo" />
          </Link>
          <Link to="/dashboard" className="logo-name">
            <b>Dashboard</b>
          </Link>
        </div>

        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <input
            type="search"
            placeholder="Поиск студента или группы..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            onFocus={() => searchQuery && setShowResults(true)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '20px', border: '1px solid #ddd' }}
          />

          {showResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              maxHeight: '250px',
              overflowY: 'auto'
            }}>
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleResultClick(result)
                  }}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ fontWeight: 'bold' }}>{result.name}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    {result.type === 'student' ? 'Студент' : 'Группа'}
                    {result.type === 'student' && ` • ${result.group}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <nav>
          <ul className="header-menu">
            <li><Link className="header-link" to="/dashboard">База рейтинга</Link></li>
            <li><Link className="header-link" to="/reports">Генератор ведомостей</Link></li>
            <li><Link className="header-link" to="/retakes">Реестр пересдач</Link></li>
            <li><Link className="header-link" to="/settings">Справочники</Link></li>
          </ul>
        </nav>

        <Link to="/profile" className="setting-link">
          <img className="icon-setting" src="/images/icon2.png" alt="Профиль" />
        </Link>
      </div>
    </header>
  )
}

export default Header