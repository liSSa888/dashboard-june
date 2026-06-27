import { NavLink } from 'react-router-dom'

function Sidebar() {
    return (
        <aside className="aside">
            <nav>
                <ul className="aside-menu">
                    <li><NavLink className="aside-link-1" to="/">Рейтинг</NavLink></li>
                    <li><NavLink className="aside-link-2" to="/reports">Ведомости</NavLink></li>
                    <li><NavLink className="aside-link-3" to="/retakes">Пересдачи</NavLink></li>
                    <li><NavLink className="aside-link-4" to="/settings">Справочники</NavLink></li>
                    <li><NavLink className="aside-link-5" to="/schedule">Расписание</NavLink></li>
                </ul>
            </nav>
        </aside>
    )
}

export default Sidebar