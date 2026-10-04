import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { loadGroups, loadTeachers, loadStudents, loadRatings, loadDisciplinesByGroup } from '../data/loadData'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import '../styles/style.css'
import '../styles/retakes.css'




function RetakesPage() {
    const [groups, setGroups] = useState([])
    const [teachers, setTeachers] = useState([])
    const [students, setStudents] = useState([])
    const [ratings, setRatings] = useState({})
    const [disciplinesByGroupAll, setDisciplinesByGroupAll] = useState({})
    const [disciplinesForGroup, setDisciplinesForGroup] = useState([])
    const [teachersForGroup, setTeachersForGroup] = useState([])

    const [selectedGroup, setSelectedGroup] = useState('')
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [selectedDiscipline, setSelectedDiscipline] = useState('')
    const [threshold, setThreshold] = useState(36)
    const [mainExamDate, setMainExamDate] = useState('')
    const [retakeDate, setRetakeDate] = useState('')
    const [showVedomost, setShowVedomost] = useState(false)

    const [includeGroup, setIncludeGroup] = useState(false)
    const [includeDiscipline, setIncludeDiscipline] = useState(false)

    useEffect(() => {
        const savedGroup = localStorage.getItem('retakesGroup')
        const savedDiscipline = localStorage.getItem('retakesDiscipline')

        if (savedGroup) {
            setSelectedGroup(savedGroup)
            localStorage.removeItem('retakesGroup')
        }
        if (savedDiscipline) {
            setSelectedDiscipline(savedDiscipline)
            localStorage.removeItem('retakesDiscipline')
        }
    }, [])

    useEffect(() => {
        const loadData = async () => {
            setGroups(await loadGroups())
            setTeachers(await loadTeachers())
            setStudents(await loadStudents())
            setRatings(await loadRatings())
            setDisciplinesByGroupAll(await loadDisciplinesByGroup())
        }
        loadData()
    }, [])

    useEffect(() => {
        if (selectedGroup && disciplinesByGroupAll[selectedGroup]) {
            const disciplines = disciplinesByGroupAll[selectedGroup]
            setDisciplinesForGroup(disciplines)
            const teacherNames = disciplines
                .map(d => d.teacher)
                .filter(t => t && t.trim() !== '')
            const uniqueTeachers = [...new Set(teacherNames)]
            setTeachersForGroup(uniqueTeachers)
        } else {
            setDisciplinesForGroup([])
            setTeachersForGroup([])
        }
    }, [selectedGroup, disciplinesByGroupAll])

    const getStudentRatings = (studentId, disciplineName) => {
        const key = `${studentId}_${disciplineName}`
        return ratings[key] || { attendance1: 0, homework1: 0, current1: 0, exam1: 0, attendance2: 0, homework2: 0, current2: 0, exam2: 0 }
    }

    const getTotal = (sRatings) => {
        const first = sRatings.attendance1 + sRatings.homework1 + sRatings.current1 + sRatings.exam1
        const second = sRatings.attendance2 + sRatings.homework2 + sRatings.current2 + sRatings.exam2
        return first + second
    }

    const filteredStudents = selectedGroup && selectedDiscipline
        ? students
            .filter(s => {
                if (s.group !== selectedGroup) return false
                const sRatings = getStudentRatings(s.id, selectedDiscipline)
                return getTotal(sRatings) < threshold
            })
            .sort((a, b) => a.name.localeCompare(b.name))
        : []

    const handleShow = () => {
        if (!selectedGroup) {
            alert('Выберите группу!')
            return
        }
        if (!selectedDiscipline) {
            alert('Выберите дисциплину!')
            return
        }
        if (filteredStudents.length === 0) {
            alert('Нет студентов с баллами ниже ' + threshold)
            return
        }
        setShowVedomost(true)
    }

    const handlePrint = () => window.print()

    // ========== ЭКСПОРТ В PDF ==========
    const exportToPDF = () => {
        const element = document.querySelector('.document-sheet')
        if (!element) {
            alert('Сначала сформируйте ведомость!')
            return
        }

        const originalWidth = element.style.width
        const originalOverflow = element.style.overflow
        element.style.width = '210mm'
        element.style.overflow = 'visible'

        html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            width: 800,
            height: element.scrollHeight,
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.querySelector('.document-sheet')
                if (clonedElement) {
                    clonedElement.style.width = '210mm'
                    clonedElement.style.overflow = 'visible'
                }
            }
        }).then(canvas => {
            element.style.width = originalWidth || ''
            element.style.overflow = originalOverflow || ''

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = 210
            const pdfHeight = 297

            let imgWidth = pdfWidth
            let imgHeight = (canvas.height * pdfWidth) / canvas.width

            if (imgHeight > pdfHeight) {
                const scale = pdfHeight / imgHeight
                imgWidth = pdfWidth * scale
                imgHeight = pdfHeight
            }

            const xOffset = (pdfWidth - imgWidth) / 2
            pdf.addImage(imgData, 'PNG', xOffset, 0, imgWidth, imgHeight)
            pdf.save(`Ведомость_пересдач_${selectedGroup || 'без_группы'}.pdf`)
        }).catch(err => {
            console.error('Ошибка при создании PDF:', err)
            alert('Ошибка при создании PDF. Попробуйте использовать печать.')
        })
    }



    return (
        <Layout>
            <main className="main">
                <div className="main-content">
                    <div className="top-panel">
                        <h1>Реестр пересдач</h1>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="save-btn" onClick={handlePrint}>Печать ведомости</button>
                            <button className="save-btn" onClick={exportToPDF} style={{ background: '#dc3545' }}>PDF</button>
                        </div>
                    </div>

                    <section className="card filter-card">
                        <select
                            value={selectedGroup}
                            onChange={(e) => {
                                setSelectedGroup(e.target.value)
                                setShowVedomost(false)
                            }}
                        >
                            <option value="">Выберите группу (обязательно)</option>
                            {groups.map((g, index) => {
                                const value = typeof g === 'string' ? g : g.name
                                return <option key={index} value={value}>{value}</option>
                            })}
                        </select>
                        <select
                            value={selectedDiscipline}
                            onChange={(e) => {
                                setSelectedDiscipline(e.target.value)
                                setShowVedomost(false)
                            }}
                        >
                            <option value="">Выберите дисциплину (обязательно)</option>
                            {disciplinesForGroup.map((d, index) => {
                                const value = typeof d === 'string' ? d : d.name
                                return <option key={index} value={value}>{value}</option>
                            })}
                        </select>
                        <select
                            value={selectedTeacher}
                            onChange={(e) => {
                                setSelectedTeacher(e.target.value)
                                setShowVedomost(false)
                            }}
                        >
                            <option value="">Преподаватель</option>
                            {teachersForGroup.map((t, index) => {
                                const value = typeof t === 'string' ? t : t.name
                                return <option key={index} value={value}>{value}</option>
                            })}
                        </select>
                        <input
                            type="number"
                            value={threshold}
                            onChange={(e) => {
                                setThreshold(Number(e.target.value))
                                setShowVedomost(false)
                            }}
                            placeholder="Баллы меньше"
                            style={{ width: '120px' }}
                        />
                        <button className="filter-btn" onClick={handleShow}>Показать должников</button>
                    </section>

                    <div className="card filter-card" style={{ justifyContent: 'flex-start', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                            <input type="checkbox" checked={includeGroup} onChange={(e) => setIncludeGroup(e.target.checked)} />
                            Подставить группу в ведомость
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                            <input type="checkbox" checked={includeDiscipline} onChange={(e) => setIncludeDiscipline(e.target.checked)} />
                            Подставить дисциплину в ведомость
                        </label>
                    </div>

                    {showVedomost && selectedGroup && selectedDiscipline && (
                        <div className="print-area">
                            <section className="document-sheet retake-sheet">
                                <div className="document-header">
                                    <p className="college-name">
                                        АВТОНОМНАЯ НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ ПРОФЕССИОНАЛЬНАЯ<br />
                                        ОБРАЗОВАТЕЛЬНАЯ ОРГАНИЗАЦИЯ МОСКОВСКИЙ МЕЖДУНАРОДНЫЙ<br />
                                        КОЛЛЕДЖ ЦИФРОВЫХ ТЕХНОЛОГИЙ "АКАДЕМИЯ ТОП"
                                    </p>
                                    <h2>ВЕДОМОСТЬ</h2>
                                </div>


                                <div className="document-info" style={{ display: 'flex', flexDirection: 'column', gap: '1mm' }}>
                                    <p style={{ padding: 0, fontFamily: 'Times New Roman' }}>
                                        пересдачи экзамена по курсу <span>«{includeDiscipline ? selectedDiscipline : '______________________'}»</span>
                                    </p>
                                    <p style={{ margin: 0, padding: 0 }}>Дата проведения основного экзамена: {mainExamDate || '______________________'}</p>
                                    <p style={{ margin: 0, padding: 0 }}>Дата проведения пересдачи: {retakeDate || '______________________'}</p>
                                    <p style={{ margin: 0, padding: 0 }}>Преподаватель: {selectedTeacher || '______________________'}</p>
                                    <p style={{ margin: 0, padding: 0 }}>Группы: {includeGroup ? selectedGroup : '______________________'}</p>
                                </div>

                                <div className="table-wrapper">
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th style={{ fontWeight: 'normal' }}>№</th>
                                                <th style={{ fontWeight: 'normal' }}>ФИО студента</th>
                                                <th style={{ fontWeight: 'normal' }}>Основной экзамен</th>
                                                <th style={{ fontWeight: 'normal' }}>Примечание</th>
                                                <th style={{ fontWeight: 'normal' }}>Вторая пересдача</th>
                                                <th style={{ fontWeight: 'normal' }}>Примечание</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.length === 0 ? (
                                                <tr><td colSpan="6" className="empty-table">Нет студентов с задолженностями</td></tr>
                                            ) : (
                                                filteredStudents.map((student, idx) => (
                                                    <tr key={student.id}>
                                                        <td style={{ textAlign: 'left', verticalAlign: 'top', padding: '1px 4px' }}>{idx + 1 + '.'}</td>
                                                        <td>{student.name}</td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ marginTop: '8px', textAlign: 'right' }}>
                                    <p style={{ margin: '20px 0 1px 0', fontSize: '14px', fontFamily: 'Times New Roman' }}>
                                        Преподаватель ____________________ / ________________________
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '10px' }}>
                                        <span style={{ fontSize: '10.3px', marginRight: '80px', fontStyle: 'italic', fontFamily: 'Times New Roman' }}>(Подпись)</span>
                                        <span style={{ fontSize: '10.3px', marginRight: "40px", fontStyle: 'italic', fontFamily: 'Times New Roman' }}>(Расшифровка подписи)</span>
                                    </div>
                                    <p style={{ margin: '15px 0', fontSize: '14px', fontFamily: 'Times New Roman' }}>
                                        Дата «___»____________________ 202___ г.
                                    </p>
                                    <p style={{ margin: '15px 0', fontSize: '14px', fontFamily: 'Times New Roman' }}>
                                        Руководитель учебной части___________________
                                    </p>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>

            <style>{`
                @media print {
                    .header, .aside, .top-panel, .filter-card, .footer, .save-btn, .filter-btn {
                        display: none !important;
                    }
                    .print-area { margin: 0; padding: 0; }
                    .document-sheet { 
                        margin: 0 auto !important; 
                        padding: 10mm 12mm !important; 
                        width: 100% !important;
                        max-width: 210mm !important;
                        box-shadow: none !important;
                        background: white !important;
                    }
                    
                    .report-table {
                        width: 100% !important;
                        font-size: 12px !important;
                        border-collapse: collapse !important;
                    }
                    
                    .report-table th, .report-table td {
                        padding: 6px 8px !important;
                        font-size: 12px !important;
                        line-height: 1.4 !important;
                        border: 1px solid #000 !important;
                        text-align: center !important;
                        vertical-align: middle !important;
                    }
                    
                    .report-table th {
                        background: #f8f8f8 !important;
                        font-weight: bold !important;
                    }
                    
                    .report-table tr {
                        page-break-inside: avoid !important;
                    }
                    
                    .document-sheet .document-info p {
                        margin: 3px 0 !important;
                        font-size: 12px !important;
                    }
                    
                    .document-sheet .college-name {
                        font-size: 12px !important;
                        margin-bottom: 4px !important;
                    }
                    
                    .document-sheet h2 {
                        font-size: 16px !important;
                        margin: 4px 0 !important;
                    }
                    
                    .document-sheet .report-signatures p {
                        margin: 4px 0 !important;
                        font-size: 12px !important;
                    }
                    
                    .document-sheet .document-header p {
                        font-size: 12px !important;
                    }
                    
                    @page {
                        margin: 0;
                        size: A4;
                    }
                    
                    html, body {
                        margin: 0;
                        padding: 0;
                    }
                }
            `}</style>
        </Layout>
    )
}

export default RetakesPage