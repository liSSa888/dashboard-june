import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/style.css'
import '../styles/login.css'

function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()

  
    if (login === 'admin' && password === 'admin') {
      localStorage.setItem('isAuth', 'true')
      localStorage.setItem('username', login)
      navigate('/dashboard')
    } else {
      setError('Неверный логин или пароль')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/images/icon-icons.png" alt="" className="login-icon" />
          <h1>Dashboard</h1>
          <p>Система управления рейтингом студентов</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Логин</label>
            <input
              type="text"
              placeholder="Введите логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p style={{ color: 'red', fontSize: '13px', textAlign: 'center' }}>{error}</p>}
          <button type="submit" className="login-btn">Войти в систему</button>
        </form>

        <p className="login-info">
          Доступ разрешен только сотрудникам учебной части
        </p>
        <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '10px', color: '#999' }}>
          Тестовый доступ: admin / admin
        </p>
      </div>
    </div>
  )
}

export default LoginPage