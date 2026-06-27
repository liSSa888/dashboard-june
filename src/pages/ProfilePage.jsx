import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import '../styles/style.css'
import '../styles/profile.css'

function ProfilePage() {
    const [user, setUser] = useState({ login: '', email: '' })
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    })
    const [message, setMessage] = useState({ text: '', type: '' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const savedUser = localStorage.getItem('userData')
        if (savedUser) {
            setUser(JSON.parse(savedUser))
        } else {
            setUser({ login: 'admin', email: 'admin@college.ru' })
        }
    }, [])

    const handleUserUpdate = () => {
        localStorage.setItem('userData', JSON.stringify(user))
        setMessage({ text: 'Данные обновлены!', type: 'success' })
        setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    }

    const handlePasswordChange = () => {
        if (passwordData.new !== passwordData.confirm) {
            setMessage({ text: 'Новые пароли не совпадают!', type: 'error' })
            return
        }

        if (passwordData.new.length < 3) {
            setMessage({ text: 'Пароль должен быть не менее 3 символов', type: 'error' })
            return
        }

        const savedPassword = localStorage.getItem('userPassword') || 'admin'

        if (passwordData.current !== savedPassword) {
            setMessage({ text: 'Неверный текущий пароль!', type: 'error' })
            return
        }

        setLoading(true)
        setTimeout(() => {
            localStorage.setItem('userPassword', passwordData.new)
            localStorage.setItem('savedLogin', user.login)
            setMessage({ text: 'Пароль успешно изменён!', type: 'success' })
            setPasswordData({ current: '', new: '', confirm: '' })
            setLoading(false)
            setTimeout(() => setMessage({ text: '', type: '' }), 3000)
        }, 500)
    }

    const handleLogout = () => {
        localStorage.removeItem('isAuth')
        localStorage.removeItem('username')
        window.location.href = '/login'
    }

    return (
        <Layout>
            <main className="main">
                <div className="main-content">
                    <div className="top-panel">
                        <h1>Профиль заместителя</h1>
                    </div>

                    <p className="page-description">
                        Управление аккаунтом и безопасностью системы
                    </p>

                    {message.text && (
                        <div className="card" style={{
                            background: message.type === 'success' ? '#d4edda' : '#f8d7da',
                            color: message.type === 'success' ? '#155724' : '#721c24',
                            padding: '12px',
                            marginBottom: '20px',
                            borderRadius: '8px'
                        }}>
                            {message.text}
                        </div>
                    )}

                    <section className="card profile-card">
                        <div className="profile-header">
                            <div className="profile-avatar">
                                {user.login ? user.login[0].toUpperCase() : 'А'}
                            </div>
                            <div className="profile-info">
                                <h2>{user.login || 'Администратор'}</h2>
                                <p>Заместитель учебной части</p>
                            </div>
                        </div>
                    </section>

                    <section className="card account-card">
                        <h2>Настройки аккаунта</h2>
                        <div className="profile-form">
                            <div className="form-group">
                                <label>Логин</label>
                                <input
                                    type="text"
                                    value={user.login}
                                    onChange={(e) => setUser({ ...user, login: e.target.value })}
                                    placeholder="Логин"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                                    placeholder="Email"
                                />
                            </div>
                            <button className="save-btn" onClick={handleUserUpdate}>
                                Сохранить изменения
                            </button>
                        </div>
                    </section>

                    <section className="card password-card">
                        <h2>Смена пароля</h2>
                        <div className="profile-form">
                            <div className="form-group">
                                <label>Текущий пароль</label>
                                <input
                                    type="password"
                                    value={passwordData.current}
                                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                    placeholder="Введите текущий пароль"
                                />
                            </div>
                            <div className="form-group">
                                <label>Новый пароль</label>
                                <input
                                    type="password"
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                    placeholder="Введите новый пароль"
                                />
                            </div>
                            <div className="form-group">
                                <label>Повторите пароль</label>
                                <input
                                    type="password"
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                    placeholder="Повторите новый пароль"
                                />
                            </div>
                            <button className="save-btn" onClick={handlePasswordChange} disabled={loading}>
                                {loading ? 'Сохранение...' : 'Обновить пароль'}
                            </button>
                        </div>
                    </section>

                    <section className="card logout-card">
                        <h2>Выход из системы</h2>
                        <p className="logout-text">
                            После выхода потребуется повторная авторизация
                        </p>
                        <button className="logout-btn" onClick={handleLogout}>
                            Выйти из аккаунта
                        </button>
                    </section>
                </div>
            </main>
        </Layout>
    )
}

export default ProfilePage