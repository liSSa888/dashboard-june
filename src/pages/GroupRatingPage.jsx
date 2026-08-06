import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { loadStudents, loadTeachers, loadRatings, loadDisciplinesByGroup } from '../data/loadData'
import '../styles/style.css'

function GroupRatingPage() {
    const { "*": groupPath } = useParams()
    const groupName = decodeURIComponent(groupPath || '')

    const [students, setStudents] = useState([])
    const [selectedDiscipline, setSelectedDiscipline] = useState('')
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [teachers, setTeachers] = useState([])
    const [teachersForGroup, setTeachersForGroup] = useState([])  // ← НОВОЕ
    const [ratings, setRatings] = useState({})
    const [disciplinesByGroupAll, setDisciplinesByGroupAll] = useState({})
    const [disciplinesForGroup, setDisciplinesForGroup] = useState([])
    const [loading, setLoading] = useState(true)

    // ========== СТУДЕНТ-ПРОВЕРКА ==========
    const [isStudent, setIsStudent] = useState(false)
    const [studentId, setStudentId] = useState(null)

    useEffect(() => {
        const auth = localStorage.getItem('studentAuth')
        if (auth) {
            try {
                const { studentId } = JSON.parse(auth)
                setStudentId(studentId)
                setIsStudent(true)
            } catch (e) {
                setIsStudent(false)
            }
        }
    }, [])

    useEffect(() => {
        const loadData = async () => {
            try {
                const allStudents = await loadStudents()
                const filtered = allStudents.filter(s => s.group === groupName)
                setStudents(filtered)
                const teachersData = await loadTeachers()
                setTeachers(teachersData)
                setRatings(await loadRatings())
                const disciplinesData = await loadDisciplinesByGroup()
                setDisciplinesByGroupAll(disciplinesData)
                if (disciplinesData[groupName]) {
                    const disciplines = disciplinesData[groupName]
                    setDisciplinesForGroup(disciplines)
                    // ===== НАХОДИМ ПРЕПОДОВАТЕЛЕЙ ДЛЯ ГРУППЫ =====
                    const teacherNames = disciplines
                        .map(d => d.teacher)
                        .filter(t => t && t.trim() !== '')
                    const uniqueTeacherNames = [...new Set(teacherNames)]
                    // Фильтруем только тех преподавателей, которые есть в общем списке
                    const foundTeachers = teachersData.filter(t =>
                        uniqueTeacherNames.some(name => t.name === name)
                    )
                    setTeachersForGroup(foundTeachers.length > 0 ? foundTeachers : uniqueTeacherNames.map(name => ({ name })))
                } else {
                    setDisciplinesForGroup([])
                    setTeachersForGroup([])
                }
            } catch (err) {
                console.error('Ошибка загрузки:', err)
            } finally {
                setLoading(false)
            }
        }
        if (groupName) {
            loadData()
        }
    }, [groupName])

    useEffect(() => {
        if (selectedDiscipline) {
            setSelectedDiscipline('')
        }
        if (disciplinesByGroupAll[groupName]) {
            setDisciplinesForGroup(disciplinesByGroupAll[groupName])
        } else {
            setDisciplinesForGroup([])
        }
    }, [groupName, disciplinesByGroupAll])

    const getStudentRatings = (studentId) => {
        const key = `${studentId}_${selectedDiscipline}`
        const existing = ratings[key]
        if (existing) return existing
        return {
            attendance1: 0, homework1: 0, current1: 0, exam1: 0,
            attendance2: 0, homework2: 0, current2: 0, exam2: 0
        }
    }

    const getFirstSum = (sRatings) => {
        const a = Number(sRatings.attendance1) || 0
        const h = Number(sRatings.homework1) || 0
        const c = Number(sRatings.current1) || 0
        const e = Number(sRatings.exam1) || 0
        return a + h + c + e
    }

    const getSecondSum = (sRatings) => {
        const a = Number(sRatings.attendance2) || 0
        const h = Number(sRatings.homework2) || 0
        const c = Number(sRatings.current2) || 0
        const e = Number(sRatings.exam2) || 0
        return a + h + c + e
    }

    const getTotal = (sRatings) => getFirstSum(sRatings) + getSecondSum(sRatings)

    const getGrade = (total) => {
        if (total >= 61) return '5 (Отлично)'
        if (total >= 51) return '4 (Хорошо)'
        if (total >= 36) return '3 (Удовлетворительно)'
        return '2 (Пересдача)'
    }

    const getGradeColor = (total) => {
        if (total >= 61) return '#2e7d32'
        if (total >= 51) return '#1976d2'
        if (total >= 36) return '#ed6c02'
        return '#d32f2f'
    }

    const filteredStudents = groupName
        ? students.filter(s => {
            if (s.group !== groupName) return false
            if (isStudent && s.id !== studentId) return false
            return true
        })
        : []

    if (loading) return <div style={{ padding: '20px' }}>Загрузка...</div>

    if (!groupName) {
        return <div style={{ padding: '20px' }}>Группа не указана</div>
    }

    if (students.length === 0) {
        return <div style={{ padding: '20px' }}>В группе "{groupName}" пока нет студентов.</div>
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>Рейтинг группы: {groupName}</h2>
            <div className="card filter-card" style={{ marginBottom: '20px' }}>
                <select value={selectedDiscipline} onChange={(e) => setSelectedDiscipline(e.target.value)}>
                    <option value="">Выберите дисциплину</option>
                    {disciplinesForGroup.map(d => <option key={d.name}>{d.name}</option>)}
                </select>
                <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                    <option value="">Выберите преподавателя</option>
                    {teachersForGroup.map((t, index) => {
                        const name = typeof t === 'string' ? t : t.name
                        return <option key={index} value={name}>{name}</option>
                    })}
                </select>
            </div>

            {selectedDiscipline && selectedTeacher ? (
                <div className="card table-card">
                    <div className="table-wrapper">
                        <table className="rating-table">
                            <thead>
                                <tr>
                                    <th>№</th><th>ФИО</th>
                                    <th className="color-1">Посещ.(5)</th><th className="color-1">ДЗ(10)</th>
                                    <th className="color-1">Тек.контр.(10)</th><th className="color-1">КР(10)</th>
                                    <th className="color-2">Посещ.(5)</th><th className="color-2">ДЗ(10)</th>
                                    <th className="color-2">Тек.контр.(10)</th><th className="color-2">КР(10)</th>
                                    <th className="color-3">Общая сумма</th><th className="color-3">Оценка</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student, idx) => {
                                    const sRatings = getStudentRatings(student.id)
                                    const total = getTotal(sRatings)
                                    return (
                                        <tr key={student.id}>
                                            <td>{idx + 1}</td>
                                            <td>{student.name}</td>
                                            <td>{sRatings.attendance1 || 0}</td>
                                            <td>{sRatings.homework1 || 0}</td>
                                            <td>{sRatings.current1 || 0}</td>
                                            <td>{sRatings.exam1 || 0}</td>
                                            <td>{sRatings.attendance2 || 0}</td>
                                            <td>{sRatings.homework2 || 0}</td>
                                            <td>{sRatings.current2 || 0}</td>
                                            <td>{sRatings.exam2 || 0}</td>
                                            <td style={{ fontWeight: 'bold', color: getGradeColor(total) }}>{total}</td>
                                            <td style={{ fontWeight: 'bold', color: getGradeColor(total) }}>{getGrade(total)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card empty-table">Выберите дисциплину и преподавателя для просмотра рейтинга</div>
            )}
        </div>
    )
}

export default GroupRatingPage