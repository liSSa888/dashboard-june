import { NavLink } from 'react-router-dom'

function Sidebar() {
    return (
        <aside className="aside">
            <nav>
                <ul className="aside-menu">
                    <li><NavLink className="aside-link-1" to="/"><span style={{ paddingRight: '3px' }}>✔</span>Рейтинг</NavLink></li>
                    <li><NavLink className="aside-link-2" to="/reports"><span style={{ paddingRight: '2px' }}>📄</span>Ведомости</NavLink></li>
                    <li><NavLink className="aside-link-3" to="/retakes"><span style={{ paddingRight: '3px' }}>⏲</span>Пересдачи</NavLink></li>
                    <li><NavLink className="aside-link-4" to="/settings"><span style={{ paddingRight: '3px' }}>🖋</span>Справочники</NavLink></li>
                    <li><NavLink className="aside-link-5" to="/schedule"><span style={{ paddingRight: '3px' }}>📖</span>Расписание</NavLink></li>
                </ul>
            </nav>
        </aside>
    )
}
// 📈
export default Sidebar