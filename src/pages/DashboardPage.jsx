import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { loadGroups, loadTeachers, loadStudents, loadRatings, saveRatings, loadDisciplinesByGroup, loadAcademicYear, saveAcademicYear, loadVedomostDates, saveVedomostDates } from '../data/loadData'
import '../styles/style.css'

function DashboardPage() {
    const navigate = useNavigate()
    const [selectedGroup, setSelectedGroup] = useState('')
    const [selectedDiscipline, setSelectedDiscipline] = useState('')
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [academicYear, setAcademicYear] = useState('')
    const [datesByVedomost, setDatesByVedomost] = useState({})
    const [teachersList, setTeachersList] = useState([])
    const [teachersForGroup, setTeachersForGroup] = useState([])
    const [students, setStudents] = useState([])
    const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    const [ratings, setRatings] = useState({})
    const [history, setHistory] = useState([])
    const [showHistory, setShowHistory] = useState(false)
    const [disciplinesByGroupAll, setDisciplinesByGroupAll] = useState({})
    const [disciplinesForGroup, setDisciplinesForGroup] = useState([])
    const [groupsList, setGroupsList] = useState([])

    const inputRefs = useRef({})

    useEffect(() => {
        const loadData = async () => {
            setGroupsList(await loadGroups())
            setTeachersList(await loadTeachers())
            setStudents(await loadStudents())
            setRatings(await loadRatings())
            setDisciplinesByGroupAll(await loadDisciplinesByGroup())

            const year = await loadAcademicYear()
            if (year) setAcademicYear(year)

            const dates = await loadVedomostDates()
            setDatesByVedomost(dates)

        }
        loadData()
    }, [])

    useEffect(() => {
        const savedGroup = localStorage.getItem('searchGroup')
        if (savedGroup && savedGroup !== selectedGroup) {
            setSelectedGroup(savedGroup)
            localStorage.removeItem('searchGroup')
        }
    }, [selectedGroup])

    useEffect(() => {
        if (selectedGroup && disciplinesByGroupAll[selectedGroup]) {
            const disciplines = disciplinesByGroupAll[selectedGroup]
            setDisciplinesForGroup(disciplines)
            const disciplineTeacherNames = disciplines
                .map(d => d.teacher)
                .filter(t => t && t.trim() !== '')
            const foundTeachers = teachersList.filter(t =>
                disciplineTeacherNames.some(name => t.name === name)
            )
            if (foundTeachers.length > 0) {
                setTeachersForGroup(foundTeachers.map(t => t.name))
            } else {
                setTeachersForGroup(disciplineTeacherNames)
            }
        } else {
            setDisciplinesForGroup([])
            setTeachersForGroup([])
        }
    }, [selectedGroup, disciplinesByGroupAll, teachersList])

    const goToReports = (type) => {
        if (!selectedGroup) {
            alert('Сначала выберите группу!')
            return
        }
        localStorage.setItem('reportsGroup', selectedGroup)
        localStorage.setItem('reportsType', type)
        navigate('/reports')
    }

    const goToRetakes = () => {
        if (!selectedGroup) {
            alert('Сначала выберите группу!')
            return
        }
        if (!selectedDiscipline) {
            alert('Сначала выберите дисциплину!')
            return
        }
        localStorage.setItem('retakesGroup', selectedGroup)
        localStorage.setItem('retakesDiscipline', selectedDiscipline)
        navigate('/retakes')
    }

    const filteredStudents = selectedGroup
        ? sortedStudents.filter(s => s.group === selectedGroup)
        : []

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

    const updateScore = async (studentId, field, value) => {
        let numValue = parseInt(value, 10)
        if (isNaN(numValue)) numValue = 0
        const key = `${studentId}_${selectedDiscipline}`
        const oldRatings = getStudentRatings(studentId)
        const oldValue = oldRatings[field] || 0

        const newRatingsForStudent = { ...oldRatings, [field]: numValue }
        const newRatingsAll = { ...ratings, [key]: newRatingsForStudent }
        setRatings(newRatingsAll)
        await saveRatings(newRatingsAll)

        const student = students.find(s => s.id === studentId)
        setHistory(prev => [{
            student: student?.name || 'Неизвестно',
            discipline: selectedDiscipline,
            field,
            oldValue,
            newValue: numValue,
            date: new Date().toLocaleString(),
            user: localStorage.getItem('username') || 'admin'
        }, ...prev])
    }

    const handleSave = async () => {
        await saveRatings(ratings)
        alert('Данные сохранены! История изменений записана.')
    }

    const handleYearChange = async (e) => {
        const value = e.target.value
        setAcademicYear(value)
        await saveAcademicYear(value) // Сохраняем через loadData
    }

    const handleDateChange = async (e) => {
        if (!vedomostKey) return
        const value = e.target.value
        const updatedDates = { ...datesByVedomost, [vedomostKey]: value }
        setDatesByVedomost(updatedDates)
        await saveVedomostDates(updatedDates) // Сохраняем через loadData
    }

    const academicYears = Array.from({ length: 12 }, (_, i) => {
        const start = 2026 + i
        return `${start}/${start + 1}`
    })

    const getAvg = (getter) => {
        if (filteredStudents.length === 0) return 0
        let sum = 0
        filteredStudents.forEach(s => {
            const sRatings = getStudentRatings(s.id)
            sum += getter(sRatings)
        })
        return (sum / filteredStudents.length).toFixed(1)
    }

    const vedomostKey = selectedGroup && selectedDiscipline
        ? `${selectedGroup}_${selectedDiscipline}`
        : ''

    const currentDate = datesByVedomost[vedomostKey] || ''

    const avgFirst = getAvg(getFirstSum)
    const avgSecond = getAvg(getSecondSum)
    const avgTotal = getAvg(getTotal)

    const handleKeyDown = (e, studentIdx, fieldIndex, fieldName) => {
        const key = e.key
        const fields = ['attendance1', 'homework1', 'current1', 'exam1', 'attendance2', 'homework2', 'current2', 'exam2']
        const cols = 8

        const currentFieldIndex = fields.indexOf(fieldName)
        let newStudentIdx = studentIdx
        let newFieldIndex = currentFieldIndex

        if (key === 'ArrowRight') {
            e.preventDefault()
            if (currentFieldIndex < cols - 1) {
                newFieldIndex = currentFieldIndex + 1
            } else if (studentIdx < filteredStudents.length - 1) {
                newStudentIdx = studentIdx + 1
                newFieldIndex = 0
            }
        } else if (key === 'ArrowLeft') {
            e.preventDefault()
            if (currentFieldIndex > 0) {
                newFieldIndex = currentFieldIndex - 1
            } else if (studentIdx > 0) {
                newStudentIdx = studentIdx - 1
                newFieldIndex = cols - 1
            }
        } else if (key === 'ArrowDown') {
            e.preventDefault()
            if (studentIdx < filteredStudents.length - 1) {
                newStudentIdx = studentIdx + 1
                newFieldIndex = currentFieldIndex
            }
        } else if (key === 'ArrowUp') {
            e.preventDefault()
            if (studentIdx > 0) {
                newStudentIdx = studentIdx - 1
                newFieldIndex = currentFieldIndex
            }
        } else {
            return
        }

        const newFieldName = fields[newFieldIndex]
        const refKey = `${newStudentIdx}_${newFieldName}`
        if (inputRefs.current[refKey]) {
            inputRefs.current[refKey].focus()
            inputRefs.current[refKey].select()
        }
    }

    return (
        <Layout>
            <main className="main">
                <div className="main-content">
                    <div className="top-panel">
                        <h1>Управление рейтингом</h1>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button className="save-btn" onClick={handleSave}>Сохранить</button>
                            <button
                                className="save-btn"
                                onClick={() => goToReports('exam')}
                                style={{ background: '#d75562' }}
                            >
                                📄 Экзаменационная ведомость
                            </button>
                            <button
                                className="save-btn"
                                onClick={() => goToReports('credit')}
                                style={{ background: '#78c289' }}
                            >
                                📄 Зачётная ведомость
                            </button>
                            <button
                                className="save-btn"
                                onClick={goToRetakes}
                                style={{ background: '#f6a35e' }}
                            >
                                🔄 Пересдачи
                            </button>
                        </div>
                    </div>

                    <div className="card filter-card">
                        <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                            <option value="">Выберите группу</option>
                            {groupsList.map((g, index) => <option key={index}>{g}</option>)}
                        </select>
                        <select value={selectedDiscipline} onChange={(e) => setSelectedDiscipline(e.target.value)}>
                            <option value="">Выберите дисциплину</option>
                            {disciplinesForGroup.map((d, index) => <option key={index}>{d.name}</option>)}
                        </select>
                        <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                            <option value="">Выберите преподавателя</option>
                            {teachersForGroup.map((t, index) => <option key={index}>{t}</option>)}
                        </select>
                    </div>

                    {selectedGroup && selectedDiscipline && selectedTeacher && filteredStudents.length > 0 && (
                        <section className="card info-block">
                            <h2 className="vedomost-info">Информация о ведомости</h2>
                            <div className="info-grid">
                                <p>
                                    <strong>Учебный год:</strong>{' '}
                                    <select className="year-select" value={academicYear} onChange={handleYearChange}>
                                        <option value="">Выберите год</option>
                                        {academicYears.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </p>
                                <p><strong>Группа:</strong> {selectedGroup}</p>
                                <p><strong>Дисциплина:</strong> {selectedDiscipline}</p>
                                <p><strong>Преподаватель:</strong> {selectedTeacher}</p>
                                <p>
                                    <strong>Дата:</strong>{' '}
                                    <input
                                        className="date-input"
                                        type="date"
                                        value={currentDate}
                                        onChange={handleDateChange}
                                    />
                                </p>
                            </div>
                        </section>
                    )}

                    {selectedGroup && selectedDiscipline && selectedTeacher && filteredStudents.length > 0 ? (
                        <div className="card table-card">
                            <div className="table-wrapper">
                                <table className="rating-table">
                                    <thead>
                                        <tr>
                                            <th rowSpan="2">№</th>
                                            <th rowSpan="2">ФИО</th>
                                            <th colSpan="4" className="color-1">1 рейтинговая (макс.35)</th>
                                            <th className="color-1">Сумма</th>
                                            <th colSpan="4" className="color-2">2 рейтинговая (макс.35)</th>
                                            <th className="color-2">Сумма</th>
                                            <th rowSpan="2" className="color-3">Общая сумма</th>
                                            <th rowSpan="2" className="color-3">Оценка</th>
                                        </tr>
                                        <tr>
                                            <th className="color-1">Посещ.(5)</th>
                                            <th className="color-1">ДЗ(10)</th>
                                            <th className="color-1">Тек.контр.(10)</th>
                                            <th className="color-1">КР(10)</th>
                                            <th className="color-1">Сумма</th>
                                            <th className="color-2">Посещ.(5)</th>
                                            <th className="color-2">ДЗ(10)</th>
                                            <th className="color-2">Тек.контр.(10)</th>
                                            <th className="color-2">КР(10)</th>
                                            <th className="color-2">Сумма</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((student, idx) => {
                                            const sRatings = getStudentRatings(student.id)
                                            const firstSum = getFirstSum(sRatings)
                                            const secondSum = getSecondSum(sRatings)
                                            const total = getTotal(sRatings)
                                            return (
                                                <tr key={student.id}>
                                                    <td>{idx + 1}</td>
                                                    <td>{student.name}</td>
                                                    <td>
                                                        <input
                                                            ref={el => inputRefs.current[`${idx}_attendance1`] = el}
                                                            type="number"
                                                            value={sRatings.attendance1 || 0}
                                                            onChange={(e) => updateScore(student.id, 'attendance1', e.target.value)}
                                                            min="0" max="5"
                                                            style={{ width: 55 }}
                                                            onKeyDown={(e) => handleKeyDown(e, idx, 0, 'attendance1')}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            ref={el => inputRefs.current[`${idx}_homework1`] = el}
                                                            type="number"
                                                            value={sRatings.homework1 || 0}
                                                            onChange={(e) => updateScore(student.id, 'homework1', e.target.value)}
                                                            min="0" max="10"
                                                            style={{ width: 55 }}
                                                            onKeyDown={(e) => handleKeyDown(e, idx, 1, 'homework1')}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            ref={el => inputRefs.current[`${idx}_current1`] = el}
                                                            type="number"
                                                            value={sRatings.current1 || 0}
                                                            onChange={(e) => updateScore(student.id, 'current1', e.target.value)}
                                                            min="0" max="10"
                                                            style={{ width: 55 }}
                                                            onKeyDown={(e) => handleKeyDown(e, idx, 2, 'current1')}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            ref={el => inputRefs.current[`${idx}_exam1`] = el}
                                                            type="number"
                                                            value={sRatings.exam1 || 0}
                                                            onChange={(e) => updateScore(student.id, 'exam1', e.target.value)}
                                                            min="0" max="10"
                                                            style={{ width: 55 }}
                                                            onKeyDown={(e) => handleKeyDown(e, idx, 3, 'exam1')}
                                                        />
                                                    </td>
                                                    <td className="sum-cell">{firstSum}</td>
                                                    <td>
                                                        <input
                                                            ref={el => inputRefs.current[`${idx}_attendance2`] = el}
                                                            type="number"
                                                            value={sRatings.attendance2 || 0}
                                                            onChange={(e) => updateScore(student.id, 'attendance2', e.target.value)}
                                                            min="0" max="5"
                                                            style={{ width: 55 }}
                                                            onKeyDown={(e) => handleKeyDown(e, idx, 4, 'attendance2')}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            ref={el => inputRefs.current[`${idx}_homework2`] = el}
                                                            type="number"
                                                            value={sRatings.homework2 || 0}
                                                            onChange={(e) => updateScore(student.id, 'homework2', e.target.value)}
                                                            min="0" max="10"
                                                            style={{ width: 55 }}
                                                            onKeyDown={(e) => handleKeyDown(e, idx, 5, 'homework2')}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            ref={el => inputRefs.current[`${idx}_current2`] = el}
                                                            type="number"
                                                            value={sRatings.current2 || 0}
                                                            onChange={(e) => updateScore(student.id, 'current2', e.target.value)}
                                                            min="0" max="10"
                                                            style={{ width: 55 }}
                                                            onKeyDown={(e) => handleKeyDown(e, idx, 6, 'current2')}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            ref={el => inputRefs.current[`${idx}_exam2`] = el}
                                                            type="number"
                                                            value={sRatings.exam2 || 0}
                                                            onChange={(e) => updateScore(student.id, 'exam2', e.target.value)}
                                                            min="0" max="10"
                                                            style={{ width: 55 }}
                                                            onKeyDown={(e) => handleKeyDown(e, idx, 7, 'exam2')}
                                                        />
                                                    </td>
                                                    <td className="sum-cell">{secondSum}</td>
                                                    <td className="total-cell" style={{ fontWeight: 'bold', color: getGradeColor(total) }}>{total}</td>
                                                    <td className="total-cell" style={{ color: getGradeColor(total) }}>{getGrade(total)}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="2"><strong>Средний балл:</strong></td>
                                            <td colSpan="4"></td>
                                            <td><strong>{avgFirst}</strong></td>
                                            <td colSpan="4"></td>
                                            <td><strong>{avgSecond}</strong></td>
                                            <td><strong>{avgTotal}</strong></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                                <button onClick={() => setShowHistory(!showHistory)} className="save-btn" style={{ background: '#6c757d' }}>
                                    {showHistory ? 'Скрыть историю правок' : 'Показать историю правок'}
                                </button>
                                {showHistory && (
                                    <div style={{ marginTop: '15px', maxHeight: '300px', overflowY: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#f1f1f1' }}>
                                                    <th>Дата</th><th>Пользователь</th><th>Студент</th><th>Дисциплина</th><th>Поле</th><th>Было</th><th>Стало</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history.map((item, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                                        <td>{item.date}</td>
                                                        <td>{item.user}</td>
                                                        <td>{item.student}</td>
                                                        <td>{item.discipline}</td>
                                                        <td>{item.field}</td>
                                                        <td>{item.oldValue}</td>
                                                        <td>{item.newValue}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="card empty-table">Выберите группу, дисциплину и преподавателя для отображения рейтинга</div>
                    )}
                </div>
            </main>
        </Layout>
    )
}

export default DashboardPage