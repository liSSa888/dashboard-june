import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStudents } from '../data/loadData'
import '../styles/login.css'

function StudentLoginPage() {
    const [login, setLogin] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        const students = await loadStudents()
        // Ищем студента по ФИО (логин) и номеру зачётной книжки (пароль)
        const student = students.find(s =>
            s.name.toLowerCase() === login.toLowerCase() &&
            s.recordBook === password
        )
        if (!student) {
            setError('Неверное ФИО или номер зачётной книжки')
            return
        }
        // Сохраняем ID студента
        localStorage.setItem('studentAuth', JSON.stringify({ studentId: student.id }))
        navigate('/group/' + encodeURIComponent(student.group))
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <h1>Студентам</h1>
                    <p>Вход по ФИО и номеру зачётной книжки</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label>ФИО (логин)</label>
                        <input
                            type="text"
                            placeholder="Иванов Иван Иванович"
                            value={login}
                            onChange={e => setLogin(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Номер зачётной книжки (пароль)</label>
                        <input
                            type="password"
                            placeholder="123456"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p style={{ color: 'red', fontSize: '13px', textAlign: 'center' }}>{error}</p>}
                    <button type="submit" className="login-btn">Войти</button>
                </form>

                <p className="login-info" style={{ fontSize: '12px', color: '#999' }}>
                    Если у вас нет данных для входа — обратитесь к завучу.
                </p>
            </div>
        </div>
    )
}

export default StudentLoginPage