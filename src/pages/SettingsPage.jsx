import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import {
    loadGroupsFull, loadTeachers, loadStudents, saveGroups, saveTeachers, saveStudents,
    loadDisciplinesByGroup, saveDisciplinesByGroup
} from '../data/loadData'
import '../styles/style.css'
import '../styles/settings.css'

function SettingsPage() {
    const [groups, setGroups] = useState([])
    const [teachers, setTeachers] = useState([])
    const [students, setStudents] = useState([])
    const [disciplinesByGroup, setDisciplinesByGroup] = useState({})
    const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name, 'ru'))

    // ========== ГРУППЫ ==========
    const [newGroup, setNewGroup] = useState({ name: '', speciality: '', course: '' })
    const [editingGroup, setEditingGroup] = useState(null)

    // ========== ПРЕПОДАВАТЕЛИ ==========
    const [newTeacher, setNewTeacher] = useState({ name: '', directions: [], notes: '' })
    const [editingTeacher, setEditingTeacher] = useState(null)

    // ========== ДИСЦИПЛИНЫ ==========
    const [selectedGroupForDiscipline, setSelectedGroupForDiscipline] = useState('')
    const [newDiscipline, setNewDiscipline] = useState({
        name: '',
        hours: '',
        type: 'лекция',
        teacher: ''
    })
    const [editingDiscipline, setEditingDiscipline] = useState(null)

    // ========== СТУДЕНТЫ ==========
    const [newStudent, setNewStudent] = useState({ name: '', group: '', recordBook: '' })
    const [editingStudent, setEditingStudent] = useState(null)

    // ========== СОСТОЯНИЯ ДЛЯ СВОРАЧИВАНИЯ (ПО УМОЛЧАНИЮ ВСЁ СКРЫТО) ==========
    const [expandedGroups, setExpandedGroups] = useState({})
    const [expandedTeachers, setExpandedTeachers] = useState({})
    const [expandedDisciplines, setExpandedDisciplines] = useState({})

    const [message, setMessage] = useState({ text: '', type: '' })

    // ========== НАПРАВЛЕНИЯ (С РАСШИФРОВКОЙ) ==========
    const directions = [
        { value: 'РПО', label: '09.02.07 Информационные системы и программирование' },
        { value: 'КГИД', label: '54.01.20 Компьютерная графика и дизайн' },
        { value: 'РУПО', label: '09.02.11 Разработка и управление программным обеспечением' }
    ]

    const handleKeyDown = (e, callback) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            callback()
        }
    }

    useEffect(() => {
        const loadData = async () => {
            setGroups(await loadGroupsFull())
            const teachersData = await loadTeachers()
            const teachersWithFields = teachersData.map(t => ({
                ...t,
                directions: t.directions || (t.direction ? [t.direction] : []),
                availability: t.availability || {},
                preferences: t.preferences || {}
            }))
            setTeachers(teachersWithFields)
            setStudents(await loadStudents())
            setDisciplinesByGroup(await loadDisciplinesByGroup())
        }
        loadData()
    }, [])

    const saveAll = async () => {
        await saveGroups(groups)
        await saveTeachers(teachers)
        await saveStudents(students)
        await saveDisciplinesByGroup(disciplinesByGroup)
        setMessage({ text: 'Все данные сохранены!', type: 'success' })
        setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    }

    // ========== ГРУППЫ ==========
    const addGroup = () => {
        if (newGroup.name.trim() && newGroup.speciality && newGroup.course) {
            setGroups([...groups, {
                name: newGroup.name,
                speciality: newGroup.speciality,
                course: parseInt(newGroup.course)
            }])
            setNewGroup({ name: '', speciality: '', course: '' })
        } else {
            alert('Заполните название группы, выберите специальность и курс!')
        }
    }

    const deleteGroup = (index) => {
        const newGroups = [...groups]
        newGroups.splice(index, 1)
        setGroups(newGroups)
    }

    const saveGroupEdit = () => {
        if (!editingGroup) return
        const { index, name, speciality, course } = editingGroup
        if (!name.trim() || !speciality || !course) {
            alert('Заполните все поля!')
            return
        }
        const newGroups = [...groups]
        newGroups[index] = { name: name.trim(), speciality, course: parseInt(course) }
        setGroups(newGroups)
        setEditingGroup(null)
    }

    // ========== ПРЕПОДАВАТЕЛИ ==========
    const addTeacher = () => {
        if (newTeacher.name.trim()) {
            if (newTeacher.directions.length === 0) {
                alert('Выберите хотя бы одну специальность!')
                return
            }
            setTeachers([...teachers, {
                name: newTeacher.name,
                directions: newTeacher.directions, // Сохраняем массив
                notes: newTeacher.notes || '',
                availability: {},
                preferences: {}
            }])
            setNewTeacher({ name: '', directions: [], notes: '' })
        } else {
            alert('Введите ФИО преподавателя!')
        }
    }

    const deleteTeacher = (index) => {
        const newTeachers = [...teachers]
        newTeachers.splice(index, 1)
        setTeachers(newTeachers)
    }

    const saveTeacherEdit = () => {
        if (!editingTeacher) return
        const { index, name, directions, notes } = editingTeacher
        if (!name.trim()) {
            alert('Введите ФИО!')
            return
        }
        if (!directions || directions.length === 0) {
            alert('Выберите хотя бы одну специальность!')
            return
        }
        const newTeachers = [...teachers]
        newTeachers[index] = {
            ...newTeachers[index],
            name: name.trim(),
            directions: directions, // Сохраняем массив
            notes: notes || ''
        }
        setTeachers(newTeachers)
        setEditingTeacher(null)
    }

    // ========== ДИСЦИПЛИНЫ ==========
    const addDisciplineToGroupHandler = () => {
        if (!selectedGroupForDiscipline) {
            alert('Выберите группу!')
            return
        }
        if (!newDiscipline.name.trim() || !newDiscipline.hours) {
            alert('Заполните название дисциплины и часы!')
            return
        }

        const newDisciplines = { ...disciplinesByGroup }
        if (!newDisciplines[selectedGroupForDiscipline]) {
            newDisciplines[selectedGroupForDiscipline] = []
        }
        newDisciplines[selectedGroupForDiscipline].push({
            name: newDiscipline.name,
            hours: parseInt(newDiscipline.hours),
            type: newDiscipline.type || 'лекция',
            teacher: newDiscipline.teacher || ''
        })
        setDisciplinesByGroup(newDisciplines)
        setNewDiscipline({ name: '', hours: '', type: 'лекция', teacher: '' })
    }

    const deleteDisciplineFromGroupHandler = (groupName, disciplineName) => {
        const newDisciplines = { ...disciplinesByGroup }
        if (newDisciplines[groupName]) {
            newDisciplines[groupName] = newDisciplines[groupName].filter(d => d.name !== disciplineName)
            setDisciplinesByGroup(newDisciplines)
        }
    }

    const saveDisciplineEdit = () => {
        if (!editingDiscipline) return
        const { groupName, index, name, hours, type, teacher } = editingDiscipline
        if (!name.trim() || !hours) {
            alert('Заполните название и часы!')
            return
        }
        const newDisciplines = { ...disciplinesByGroup }
        if (!newDisciplines[groupName]) newDisciplines[groupName] = []
        newDisciplines[groupName][index] = {
            name: name.trim(),
            hours: parseInt(hours),
            type: type || 'лекция',
            teacher: teacher || ''
        }
        setDisciplinesByGroup(newDisciplines)
        setEditingDiscipline(null)
    }

    // ========== СТУДЕНТЫ ==========
    const addStudent = () => {
        if (newStudent.name.trim() && newStudent.group && newStudent.recordBook.trim()) {
            let newId = 1
            if (students.length > 0) {
                const maxId = Math.max(...students.map(s => Number(s.id) || 0))
                newId = maxId + 1
            }
            setStudents([...students, {
                id: newId,
                name: newStudent.name,
                group: newStudent.group,
                recordBook: newStudent.recordBook.trim(),
                attendance1: 0, homework1: 0, current1: 0, exam1: 0,
                attendance2: 0, homework2: 0, current2: 0, exam2: 0
            }])
            setNewStudent({ name: '', group: '', recordBook: '' })
        } else {
            alert('Заполните ФИО, группу и номер зачётной книжки!')
        }
    }

    const deleteStudent = (id) => {
        setStudents(students.filter(s => s.id !== id))
    }

    const saveStudentEdit = () => {
        if (!editingStudent) return
        const { id, name, group, recordBook } = editingStudent
        if (!name.trim() || !group || !recordBook.trim()) {
            alert('Заполните все поля!')
            return
        }
        const newStudents = students.map(s =>
            s.id === id ? { ...s, name: name.trim(), group, recordBook: recordBook.trim() } : s
        )
        setStudents(newStudents)
        setEditingStudent(null)
    }

    // ========== ДОСТУПНОСТЬ/ПРЕДПОЧТЕНИЯ ==========
    const toggleAvailability = (teacherIndex, day, slot) => {
        setTeachers(prev => {
            const newTeachers = prev.map((teacher, index) => {
                if (index !== teacherIndex) return teacher
                const newTeacher = { ...teacher }
                if (!newTeacher.availability) newTeacher.availability = {}
                const key = `${day}_${slot}`
                const current = newTeacher.availability[key]
                if (current === undefined) {
                    newTeacher.availability[key] = false
                } else {
                    newTeacher.availability[key] = !current
                }
                return newTeacher
            })
            return newTeachers
        })
    }

    const togglePreference = (teacherIndex, day, slot) => {
        setTeachers(prev => {
            const newTeachers = prev.map((teacher, index) => {
                if (index !== teacherIndex) return teacher
                const newTeacher = { ...teacher }
                if (!newTeacher.preferences) newTeacher.preferences = {}
                const key = `${day}_${slot}`
                newTeacher.preferences[key] = !newTeacher.preferences[key]
                return newTeacher
            })
            return newTeachers
        })
    }

    const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ']

    // ========== ФУНКЦИИ ДЛЯ СВОРАЧИВАНИЯ ==========
    const toggleGroup = (idx) => {
        setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }))
    }

    const toggleTeacher = (idx) => {
        setExpandedTeachers(prev => ({ ...prev, [idx]: !prev[idx] }))
    }

    const toggleDiscipline = (groupName) => {
        setExpandedDisciplines(prev => ({ ...prev, [groupName]: !prev[groupName] }))
    }

    return (
        <Layout>
            <main className="main">
                <div className="main-content">
                    <div className="top-panel">
                        <h1>Справочники</h1>
                        <button className="save-btn" onClick={saveAll}>Сохранить все</button>
                    </div>

                    <p className="page-description">Управление группами, преподавателями и дисциплинами</p>

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

                    <div className="settings-grid">

                        {/* ===== ГРУППЫ (С ВЫПАДАЮЩИМ СПИСКОМ СПЕЦИАЛЬНОСТЕЙ) ===== */}
                        <section className="card groups">
                            <h2>Группы</h2>
                            <div className="settings-form">
                                <input
                                    type="text"
                                    placeholder="Название группы (ИС-21)"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, addGroup)}
                                />
                                <select
                                    value={newGroup.speciality}
                                    onChange={(e) => setNewGroup({ ...newGroup, speciality: e.target.value })}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                >
                                    <option value="">Выберите специальность</option>
                                    {directions.map(d => (
                                        <option key={d.value} value={d.label}>{d.label}</option>
                                    ))}
                                </select>
                                <select
                                    value={newGroup.course}
                                    onChange={(e) => setNewGroup({ ...newGroup, course: e.target.value })}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                >
                                    <option value="">Курс</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                </select>
                                <button onClick={addGroup}>Добавить</button>
                            </div>
                            <ul>
                                {groups.length === 0 && <p className="empty-text">Пока нет групп</p>}
                                {groups.map((group, idx) => {
                                    const groupStudents = sortedStudents.filter(s => s.group === group.name)
                                    const isExpanded = expandedGroups[idx] || false
                                    return (
                                        <li key={idx} className="list-items" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong>{group.name}</strong>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                        {group.speciality} • {group.course || '?'} курс
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                    <button
                                                        onClick={() => toggleGroup(idx)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#666', padding: '2px 4px' }}
                                                        title={isExpanded ? 'Свернуть' : 'Развернуть'}
                                                    >
                                                        {isExpanded ? '▲' : '▼'}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingGroup({ index: idx, name: group.name, speciality: group.speciality, course: group.course || 1 })}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#666', padding: '2px 4px' }}
                                                        title="Редактировать"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => deleteGroup(idx)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#999', padding: '2px 4px' }}
                                                        title="Удалить"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>

                                            {editingGroup && editingGroup.index === idx && (
                                                <div style={{ width: '100%', marginTop: '8px', padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <input
                                                            type="text"
                                                            value={editingGroup.name}
                                                            onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                                            placeholder="Название"
                                                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', flex: 1 }}
                                                            onKeyDown={(e) => handleKeyDown(e, saveGroupEdit)}
                                                        />
                                                        <select
                                                            value={editingGroup.speciality}
                                                            onChange={(e) => setEditingGroup({ ...editingGroup, speciality: e.target.value })}
                                                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                                        >
                                                            {directions.map(d => (
                                                                <option key={d.value} value={d.label}>{d.label}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={editingGroup.course}
                                                            onChange={(e) => setEditingGroup({ ...editingGroup, course: e.target.value })}
                                                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                                        >
                                                            <option value="1">1</option>
                                                            <option value="2">2</option>
                                                            <option value="3">3</option>
                                                            <option value="4">4</option>
                                                        </select>
                                                        <button onClick={saveGroupEdit} style={{ padding: '6px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Сохранить</button>
                                                        <button onClick={() => setEditingGroup(null)} style={{ padding: '6px 14px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
                                                    </div>
                                                </div>
                                            )}

                                            {isExpanded && (
                                                <>
                                                    <div style={{ width: '100%', marginTop: '8px', padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="ФИО студента"
                                                                value={newStudent.name}
                                                                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value, group: group.name })}
                                                                style={{ flex: '1', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault()
                                                                        if (newStudent.name.trim() && newStudent.recordBook.trim()) {
                                                                            addStudent()
                                                                        } else {
                                                                            alert('Введите ФИО и номер зачётной книжки!')
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Номер зачётной книжки"
                                                                value={newStudent.recordBook}
                                                                onChange={(e) => setNewStudent({ ...newStudent, recordBook: e.target.value })}
                                                                style={{ flex: '1', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault()
                                                                        if (newStudent.name.trim() && newStudent.recordBook.trim()) {
                                                                            addStudent()
                                                                        } else {
                                                                            alert('Введите ФИО и номер зачётной книжки!')
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    if (newStudent.name.trim() && newStudent.recordBook.trim()) {
                                                                        addStudent()
                                                                    } else {
                                                                        alert('Введите ФИО и номер зачётной книжки!')
                                                                    }
                                                                }}
                                                                style={{ padding: '6px 14px', background: '#7c73f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                                            >
                                                                Добавить студента
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {groupStudents.length > 0 && (
                                                        <div style={{ width: '100%', marginTop: '8px' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '4px' }}>
                                                                Студенты:
                                                            </div>
                                                            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', paddingLeft: '0', listStyle: 'none' }}>
                                                                {groupStudents.map((student, sidx) => (
                                                                    <li key={sidx} style={{ fontSize: '13px', color: '#475569', background: '#f1f5f9', padding: '2px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        {student.name} (зач. №{student.recordBook})
                                                                        <button
                                                                            onClick={() => setEditingStudent({ id: student.id, name: student.name, group: student.group, recordBook: student.recordBook || '' })}
                                                                            style={{ background: 'none', border: 'none', color: '#17a2b8', cursor: 'pointer', fontSize: '12px' }}
                                                                        >
                                                                            ✏️
                                                                        </button>
                                                                        <button
                                                                            onClick={() => deleteStudent(student.id)}
                                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {groupStudents.length === 0 && (
                                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                                                            Нет студентов в группе
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>

                            {editingStudent && (
                                <div className="card" style={{ marginTop: '20px', border: '2px solid #7c73f6' }}>
                                    <h3>Редактирование студента</h3>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                                        <input
                                            type="text"
                                            value={editingStudent.name}
                                            onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                            placeholder="ФИО"
                                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', flex: 1 }}
                                        />
                                        <select
                                            value={editingStudent.group}
                                            onChange={(e) => setEditingStudent({ ...editingStudent, group: e.target.value })}
                                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                        >
                                            {groups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                                        </select>
                                        <input
                                            type="text"
                                            value={editingStudent.recordBook || ''}
                                            onChange={(e) => setEditingStudent({ ...editingStudent, recordBook: e.target.value })}
                                            placeholder="Номер зачётной книжки"
                                            style={{ flex: '1', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                        />
                                        <button onClick={saveStudentEdit} style={{ padding: '6px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Сохранить</button>
                                        <button onClick={() => setEditingStudent(null)} style={{ padding: '6px 14px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* ===== ПРЕПОДАВАТЕЛИ ===== */}
                        <section className="card teachers">
                            <h2>Преподаватели</h2>
                            <div className="settings-form">
                                <input
                                    type="text"
                                    placeholder="ФИО преподавателя"
                                    value={newTeacher.name}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, addTeacher)}
                                />

                                <details style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                                    <summary style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '42px', boxSizing: 'border-box' }}>
                                        <span style={{ color: newTeacher.directions.length ? '#333' : '#999', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {newTeacher.directions.length > 0 ? newTeacher.directions.map(val => directions.find(d => d.value === val)?.value).join(', ') : 'Выберите специальности'}
                                        </span>
                                        <span style={{ fontSize: '10px', color: '#666' }}>▼</span>
                                    </summary>
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: '8px', marginTop: '4px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '8px' }}>
                                        {directions.map(d => (
                                            <label key={d.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', fontSize: '13px', color: '#333' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={newTeacher.directions.includes(d.value)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked
                                                        setNewTeacher(prev => ({
                                                            ...prev,
                                                            directions: checked ? [...prev.directions, d.value] : prev.directions.filter(val => val !== d.value)
                                                        }))
                                                    }}
                                                />
                                                <span style={{ whiteSpace: 'normal', lineHeight: '1.2' }}>{d.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </details>

                                <input
                                    type="text"
                                    placeholder="Примечания (окна доступности)"
                                    value={newTeacher.notes}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, notes: e.target.value })}
                                    style={{ minWidth: '150px' }}
                                    onKeyDown={(e) => handleKeyDown(e, addTeacher)}
                                />
                                <button onClick={addTeacher}>Добавить</button>
                            </div>

                            <ul>
                                {teachers.length === 0 && <p className="empty-text">Пока нет преподавателей</p>}
                                {teachers.map((teacher, idx) => {
                                    const availability = teacher.availability || {}
                                    const preferences = teacher.preferences || {}
                                    const isExpanded = expandedTeachers[idx] || false

                                    const dirLabels = (teacher.directions || [])
                                        .map(val => directions.find(d => d.value === val)?.value || val)
                                        .join(', ')

                                    return (
                                        <li key={idx} className="list-items" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong>{teacher.name}</strong>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                        {dirLabels || 'Не указана'}
                                                        {teacher.notes && ` • ${teacher.notes}`}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                    <button
                                                        onClick={() => toggleTeacher(idx)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#666', padding: '2px 4px' }}
                                                        title={isExpanded ? 'Свернуть' : 'Развернуть'}
                                                    >
                                                        {isExpanded ? '▲' : '▼'}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingTeacher({ index: idx, name: teacher.name, directions: teacher.directions || [], notes: teacher.notes || '' })}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#666', padding: '2px 4px' }}
                                                        title="Редактировать"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTeacher(idx)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#999', padding: '2px 4px' }}
                                                        title="Удалить"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>

                                            {editingTeacher && editingTeacher.index === idx && (
                                                <div style={{ width: '100%', marginTop: '8px', padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <input
                                                            type="text"
                                                            value={editingTeacher.name}
                                                            onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                                                            placeholder="ФИО"
                                                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', flex: 1, minWidth: '150px' }}
                                                            onKeyDown={(e) => handleKeyDown(e, saveTeacherEdit)}
                                                        />

                                                        <details style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                                            <summary style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '32px', boxSizing: 'border-box' }}>
                                                                <span style={{ color: editingTeacher.directions?.length ? '#333' : '#999', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {editingTeacher.directions?.length > 0 ? editingTeacher.directions.map(val => directions.find(d => d.value === val)?.value).join(', ') : 'Выберите специальности'}
                                                                </span>
                                                                <span style={{ fontSize: '10px', color: '#666' }}>▼</span>
                                                            </summary>
                                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: '6px', marginTop: '4px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '8px' }}>
                                                                {directions.map(d => (
                                                                    <label key={d.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer', fontSize: '13px', color: '#333' }}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={(editingTeacher.directions || []).includes(d.value)}
                                                                            onChange={(e) => {
                                                                                const checked = e.target.checked
                                                                                setEditingTeacher(prev => ({
                                                                                    ...prev,
                                                                                    directions: checked ? [...(prev.directions || []), d.value] : (prev.directions || []).filter(val => val !== d.value)
                                                                                }))
                                                                            }}
                                                                        />
                                                                        <span style={{ whiteSpace: 'normal', lineHeight: '1.2' }}>{d.label}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </details>

                                                        <input
                                                            type="text"
                                                            value={editingTeacher.notes}
                                                            onChange={(e) => setEditingTeacher({ ...editingTeacher, notes: e.target.value })}
                                                            placeholder="Примечания"
                                                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', flex: 1, minWidth: '100px' }}
                                                            onKeyDown={(e) => handleKeyDown(e, saveTeacherEdit)}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                        <button onClick={saveTeacherEdit} style={{ padding: '6px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Сохранить</button>
                                                        <button onClick={() => setEditingTeacher(null)} style={{ padding: '6px 14px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
                                                    </div>
                                                </div>
                                            )}

                                            {isExpanded && (
                                                <>
                                                    <div style={{ width: '100%' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}>
                                                            Жёсткие ограничения (занятые слоты):
                                                            <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
                                                                🟢 доступно — 🟥 занято (кликните для переключения)
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 32px)', gap: '4px' }}>
                                                            {days.map(day => (
                                                                <div key={day} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#555' }}>
                                                                    {day}
                                                                </div>
                                                            ))}
                                                            {[1, 2, 3, 4].map(slot => (
                                                                days.map(day => {
                                                                    const key = `${day}_${slot}`
                                                                    const isAvailable = availability[key] !== false
                                                                    return (
                                                                        <button
                                                                            key={`${teacher.name}_${day}_${slot}`}
                                                                            onClick={() => {
                                                                                const newTeachers = [...teachers]
                                                                                const teacherCopy = { ...newTeachers[idx] }
                                                                                if (!teacherCopy.availability) teacherCopy.availability = {}
                                                                                teacherCopy.availability[key] = !isAvailable
                                                                                newTeachers[idx] = teacherCopy
                                                                                setTeachers(newTeachers)
                                                                            }}
                                                                            style={{
                                                                                width: '32px',
                                                                                height: '32px',
                                                                                background: isAvailable ? '#a5d6a7' : '#ef9a9a',
                                                                                border: '1px solid #ccc',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '11px',
                                                                                color: '#333',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                            }}
                                                                            title={`${day} ${slot} пара — ${isAvailable ? 'доступно' : 'занято'}`}
                                                                        >
                                                                            {slot}
                                                                        </button>
                                                                    )
                                                                })
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div style={{ width: '100%', marginTop: '12px' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#334155' }}>
                                                            Мягкие ограничения (предпочтительные слоты):
                                                            <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
                                                                🟦 предпочтительно (кликните для переключения)
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 32px)', gap: '4px' }}>
                                                            {days.map(day => (
                                                                <div key={day} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#555' }}>
                                                                    {day}
                                                                </div>
                                                            ))}
                                                            {[1, 2, 3, 4].map(slot => (
                                                                days.map(day => {
                                                                    const key = `${day}_${slot}`
                                                                    const isPreferred = preferences[key] === true
                                                                    return (
                                                                        <button
                                                                            key={`${teacher.name}_${day}_${slot}_pref`}
                                                                            onClick={() => {
                                                                                const newTeachers = [...teachers]
                                                                                const teacherCopy = { ...newTeachers[idx] }
                                                                                if (!teacherCopy.preferences) teacherCopy.preferences = {}
                                                                                teacherCopy.preferences[key] = !isPreferred
                                                                                newTeachers[idx] = teacherCopy
                                                                                setTeachers(newTeachers)
                                                                            }}
                                                                            style={{
                                                                                width: '32px',
                                                                                height: '32px',
                                                                                background: isPreferred ? '#64b5f6' : '#f5f5f5',
                                                                                border: '1px solid #ccc',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '11px',
                                                                                color: '#333',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                            }}
                                                                            title={`${day} ${slot} пара — ${isPreferred ? 'предпочтительно' : 'нейтрально'}`}
                                                                        >
                                                                            {slot}
                                                                        </button>
                                                                    )
                                                                })
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        </section>

                        {/* ===== ДИСЦИПЛИНЫ ===== */}
                        <section className="card disciplines">
                            <h2>Дисциплины по группам</h2>
                            <div className="settings-form">
                                <select
                                    value={selectedGroupForDiscipline}
                                    onChange={(e) => setSelectedGroupForDiscipline(e.target.value)}
                                >
                                    <option value="">Выберите группу</option>
                                    {groups.map(g => <option key={g.name}>{g.name}</option>)}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Название дисциплины"
                                    value={newDiscipline.name}
                                    onChange={(e) => setNewDiscipline({ ...newDiscipline, name: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, addDisciplineToGroupHandler)}
                                />
                                <select
                                    value={newDiscipline.type}
                                    onChange={(e) => setNewDiscipline({ ...newDiscipline, type: e.target.value })}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                >
                                    <option value="лекция">Лекция</option>
                                    <option value="практика">Практика</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="Часы"
                                    value={newDiscipline.hours}
                                    onChange={(e) => setNewDiscipline({ ...newDiscipline, hours: e.target.value })}
                                    style={{ width: '80px' }}
                                    onKeyDown={(e) => handleKeyDown(e, addDisciplineToGroupHandler)}
                                />
                                <select
                                    value={newDiscipline.teacher}
                                    onChange={(e) => setNewDiscipline({ ...newDiscipline, teacher: e.target.value })}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                >
                                    <option value="">Преподаватель</option>
                                    {teachers.map(t => <option key={t.name}>{t.name}</option>)}
                                </select>
                                <button onClick={addDisciplineToGroupHandler}>Добавить</button>
                            </div>

                            <ul style={{ marginTop: '16px' }}>
                                {groups.length === 0 && <p className="empty-text">Сначала создайте группы</p>}
                                {groups.map(group => {
                                    const groupDisciplines = disciplinesByGroup[group.name] || []
                                    const isExpanded = expandedDisciplines[group.name] || false
                                    if (groupDisciplines.length === 0) return null
                                    return (
                                        <div key={group.name} style={{ marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                                                    {group.name} ({groupDisciplines.length} дисциплин)
                                                </span>
                                                <button
                                                    onClick={() => toggleDiscipline(group.name)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#666', padding: '2px 4px' }}
                                                    title={isExpanded ? 'Свернуть' : 'Развернуть'}
                                                >
                                                    {isExpanded ? '▲' : '▼'}
                                                </button>
                                            </div>
                                            {isExpanded && groupDisciplines.map((discipline, idx) => (
                                                <li key={idx} className="list-items" style={{ marginBottom: '8px' }}>
                                                    <div>
                                                        <strong>{discipline.name}</strong>
                                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                                            {discipline.type || 'лекция'} • {discipline.hours} часов
                                                            {discipline.teacher && ` • Преп.: ${discipline.teacher}`}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <button
                                                            onClick={() => setEditingDiscipline({
                                                                groupName: group.name,
                                                                index: idx,
                                                                name: discipline.name,
                                                                hours: discipline.hours || '',
                                                                type: discipline.type || 'лекция',
                                                                teacher: discipline.teacher || ''
                                                            })}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#666', padding: '2px 4px' }}
                                                            title="Редактировать"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => deleteDisciplineFromGroupHandler(group.name, discipline.name)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#999', padding: '2px 4px' }}
                                                            title="Удалить"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                            {editingDiscipline && editingDiscipline.groupName === group.name && (
                                                <div style={{ marginTop: '8px', padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <input
                                                            type="text"
                                                            value={editingDiscipline.name}
                                                            onChange={(e) => setEditingDiscipline({ ...editingDiscipline, name: e.target.value })}
                                                            placeholder="Название"
                                                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', flex: 1 }}
                                                            onKeyDown={(e) => handleKeyDown(e, saveDisciplineEdit)}
                                                        />
                                                        <input
                                                            type="number"
                                                            value={editingDiscipline.hours}
                                                            onChange={(e) => setEditingDiscipline({ ...editingDiscipline, hours: e.target.value })}
                                                            placeholder="Часы"
                                                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', width: '80px' }}
                                                            onKeyDown={(e) => handleKeyDown(e, saveDisciplineEdit)}
                                                        />
                                                        <select
                                                            value={editingDiscipline.type}
                                                            onChange={(e) => setEditingDiscipline({ ...editingDiscipline, type: e.target.value })}
                                                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                                        >
                                                            <option value="лекция">Лекция</option>
                                                            <option value="практика">Практика</option>
                                                        </select>
                                                        <input
                                                            type="text"
                                                            value={editingDiscipline.teacher}
                                                            onChange={(e) => setEditingDiscipline({ ...editingDiscipline, teacher: e.target.value })}
                                                            placeholder="Преподаватель"
                                                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', flex: 1 }}
                                                            onKeyDown={(e) => handleKeyDown(e, saveDisciplineEdit)}
                                                        />
                                                        <button onClick={saveDisciplineEdit} style={{ padding: '6px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Сохранить</button>
                                                        <button onClick={() => setEditingDiscipline(null)} style={{ padding: '6px 14px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </ul>

                            {groups.length > 0 && Object.values(disciplinesByGroup).every(arr => arr.length === 0) && (
                                <p className="empty-text">Нет добавленных дисциплин. Выберите группу и добавьте дисциплину.</p>
                            )}
                        </section>

                    </div>
                </div>
            </main >
        </Layout >
    )
}

export default SettingsPage