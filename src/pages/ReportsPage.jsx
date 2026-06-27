import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { loadGroupsFull, loadTeachers, loadStudents, loadRatings, loadDisciplinesByGroup } from '../data/loadData'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import '../styles/style.css'
import '../styles/reports.css'

function ReportsPage() {
    const [groups, setGroups] = useState([])
    const [teachers, setTeachers] = useState([])
    const [students, setStudents] = useState([])
    const [ratings, setRatings] = useState({})

    const [selectedGroup, setSelectedGroup] = useState('')
    const [selectedDiscipline, setSelectedDiscipline] = useState('')
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [attestationType, setAttestationType] = useState('')
    const [examDate, setExamDate] = useState('')
    const [showDocument, setShowDocument] = useState(false)

    const [includeGroup, setIncludeGroup] = useState(false)

    const [disciplinesByGroupAll, setDisciplinesByGroupAll] = useState({})
    const [disciplinesForGroup, setDisciplinesForGroup] = useState([])
    const [teachersForGroup, setTeachersForGroup] = useState([])

    const attestationTypes = ["Экзамен", "Дифференцированный зачет", "Защита проектов"]

    // ========== ЗАГРУЗКА ДАННЫХ ИЗ LOCALSTORAGE (С ДАШБОРДА) ==========
    useEffect(() => {
        const savedGroup = localStorage.getItem('reportsGroup')
        const savedType = localStorage.getItem('reportsType')

        if (savedGroup) {
            setSelectedGroup(savedGroup)
            localStorage.removeItem('reportsGroup')
        }
        if (savedType) {
            // Преобразуем тип из кнопок в полноценное название
            if (savedType === 'exam') setAttestationType('Экзамен')
            else if (savedType === 'credit') setAttestationType('Дифференцированный зачет')
            localStorage.removeItem('reportsType')
        }
    }, [])

    useEffect(() => {
        const loadData = async () => {
            setGroups(await loadGroupsFull())
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

    const filteredStudents = selectedGroup
        ? students.filter(s => s.group === selectedGroup)
        : []

    const getSpecialityByGroup = (groupName) => {
        const group = groups.find(g => g.name === groupName)
        return group ? group.speciality : ''
    }

    const speciality = getSpecialityByGroup(selectedGroup)
    const disciplineObj = disciplinesForGroup.find(d => d.name === selectedDiscipline)
    const hours = disciplineObj ? disciplineObj.hours : ''

    const generateDocument = () => {
        if (!selectedGroup) {
            alert('Выберите группу!')
            return
        }
        setShowDocument(true)
    }

    const handlePrint = () => window.print()

    const exportToExcel = () => {
        const wsData = [
            ['№ п/п', 'ФИО обучающегося', 'Номер зачетной книжки', 'Оценка (цифрой)', 'Прописью', 'Подпись преподавателя']
        ]
        if (filteredStudents.length === 0) {
            wsData.push(['', '', '', '', '', ''])
        } else {
            filteredStudents.forEach((s, idx) => {
                wsData.push([idx + 1, s.name, s.recordBook || '', '', '', ''])
            })
        }
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Ведомость')
        XLSX.writeFile(wb, `ведомость_${selectedGroup || 'без_группы'}.xlsx`)
    }

    const exportToPDF = () => {
        const element = document.querySelector('.document-sheet')
        if (!element) return

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
            pdf.save(`ведомость_${selectedGroup || 'без_группы'}.pdf`)
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
                        <h1>Генератор ведомостей</h1>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="save-btn" onClick={generateDocument}>Сформировать</button>
                            <button className="save-btn" onClick={handlePrint} style={{ background: '#17a2b8' }}>Печать</button>
                            <button className="save-btn" onClick={exportToExcel} style={{ background: '#28a745' }}>Excel</button>
                            <button className="save-btn" onClick={exportToPDF} style={{ background: '#dc3545' }}>PDF</button>
                        </div>
                    </div>

                    <div className="card filter-card document-card">
                        <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                            <option value="">Выберите группу (обязательно)</option>
                            {groups.map((g, index) => {
                                const value = typeof g === 'string' ? g : g.name
                                return <option key={index} value={value}>{value}</option>
                            })}
                        </select>
                        <select value={selectedDiscipline} onChange={(e) => setSelectedDiscipline(e.target.value)}>
                            <option value="">Дисциплина</option>
                            {disciplinesForGroup.map((d, index) => {
                                const value = typeof d === 'string' ? d : d.name
                                return <option key={index} value={value}>{value}</option>
                            })}
                        </select>
                        <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                            <option value="">Преподаватель</option>
                            {teachersForGroup.map((t, index) => {
                                const value = typeof t === 'string' ? t : t.name
                                return <option key={index} value={value}>{value}</option>
                            })}
                        </select>
                        <select value={attestationType} onChange={(e) => setAttestationType(e.target.value)}>
                            <option value="">Тип аттестации</option>
                            {attestationTypes.map((a, index) => <option key={index}>{a}</option>)}
                        </select>
                        <div className="fake-input">
                            <span>Дата проведения: </span>
                            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="card filter-card" style={{ justifyContent: 'flex-start', gap: '15px', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                            <input type="checkbox" checked={includeGroup} onChange={(e) => setIncludeGroup(e.target.checked)} />
                            Подставить группу в ведомость
                        </label>
                    </div>

                    {showDocument && (
                        <div className="print-area">
                            <section className="document-sheet">
                                <div className="document-header">
                                    <p className="college-name" style={{ fontSize: '14px', marginBottom: '4px' }}>
                                        АВТОНОМНАЯ НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ ПРОФЕССИОНАЛЬНАЯ<br />
                                        ОБРАЗОВАТЕЛЬНАЯ ОРГАНИЗАЦИЯ МОСКОВСКИЙ МЕЖДУНАРОДНЫЙ<br />
                                        КОЛЛЕДЖ ЦИФРОВЫХ ТЕХНОЛОГИЙ "АКАДЕМИЯ ТОП"
                                    </p>
                                    <p style={{ fontWeight: 'bold', marginBottom: '14px', fontSize: '15px' }}>Очная (заочная) форма обучения.</p>
                                    <h2 style={{ fontSize: '18px', marginTop: '0', marginBottom: '10px' }}>ЗАЧЕТНО-ЭКЗАМЕНАЦИОННАЯ ВЕДОМОСТЬ</h2>
                                </div>

                                <div className="document-info" style={{ marginBottom: '6px' }}>
                                    <p style={{ margin: '0px 0', fontSize: '16px', lineHeight: '1.2' }}><strong>Учебный год:</strong> ___________________ / семестр: ___</p>
                                    <p style={{ margin: '0px 0', fontSize: '16px', lineHeight: '1.2' }}><strong>Форма промежуточной аттестации:</strong> {attestationType || '___________'}</p>
                                    <p style={{ margin: '0px 0', fontSize: '16px', lineHeight: '1.2' }}><strong>Группа:</strong> {includeGroup ? selectedGroup : '___________'}</p>
                                    <p style={{ margin: '0px 0', fontSize: '16px', lineHeight: '1.2' }}><strong>Профессия/специальность:</strong> {includeGroup ? speciality : '___________'}</p>
                                    <p style={{ margin: '0px 0', fontSize: '16px', lineHeight: '1.2' }}><strong>Учебный предмет, курс, дисциплина образовательной программы:</strong> {selectedDiscipline || '___________'}</p>
                                    <p style={{ margin: '0px 0', fontSize: '16px', lineHeight: '1.2' }}><strong>Общая трудоемкость по учебному плану (час):</strong> {selectedGroup && selectedDiscipline ? (hours || '___________') : '___________'}</p>
                                    <p style={{ margin: '0px 0', fontSize: '16px', lineHeight: '1.2' }}><strong>Фамилия, Имя, Отчество преподавателя:</strong> {selectedTeacher || '___________'}</p>
                                    <p style={{ margin: '0px 0', fontSize: '16px', lineHeight: '1.2' }}><strong>Дата проведения:</strong> {examDate || '___________'}</p>
                                </div>

                                <div className="table-wrapper">
                                    <table className="report-table" style={{ fontSize: '14px', borderCollapse: 'collapse', width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th rowSpan="2" style={{ padding: '4px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'center' }}>№ п/п</th>
                                                <th rowSpan="2" style={{ padding: '4px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'center' }}>ФИО обучающегося</th>
                                                <th rowSpan="2" style={{ padding: '4px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'center' }}>Номер зачетной книжки</th>
                                                <th colSpan="2" style={{ padding: '4px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'center' }}>Оценка</th>
                                                <th rowSpan="2" style={{ padding: '4px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'center' }}>Подпись преподавателя</th>
                                            </tr>
                                            <tr>
                                                <th style={{ padding: '4px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'center' }}>Цифрой</th>
                                                <th style={{ padding: '4px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'center' }}>Прописью</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: 'center', padding: '10px', fontSize: '14px' }}>
                                                        Нет студентов для отображения
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredStudents.map((student, idx) => (
                                                    <tr key={student.id}>
                                                        <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'center', fontSize: '14px' }}>{idx + 1}</td>
                                                        <td style={{ padding: '3px 8px', border: '1px solid #000', fontSize: '14px' }}>{student.name}</td>
                                                        <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'center', fontSize: '14px' }}>{student.recordBook || ''}</td>
                                                        <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'center', fontSize: '14px' }}></td>
                                                        <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'center', fontSize: '14px' }}></td>
                                                        <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'center', fontSize: '14px' }}></td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="report-signatures" style={{ marginTop: '16px' }}>
                                    <p style={{ margin: '2px 0', fontSize: '14px' }}>Преподаватель: __________________</p>
                                    <p style={{ margin: '2px 0', fontSize: '14px' }}>Руководитель учебной части: __________________</p>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>

            <style>{`
                @media print {
                    .header, .aside, .top-panel, .filter-card, .footer, .save-btn { display: none !important; }
                    .print-area { margin: 0; padding: 0; }
                    .document-sheet { 
                        margin: 0 auto !important; 
                        padding: 7mm 9mm !important; 
                        width: 100% !important;
                        max-width: 210mm !important;
                        box-shadow: none !important;
                        background: white !important;
                    }
                    
                    .report-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    
                    .report-table th, .report-table td {
                        padding: 3px 8px !important;
                        font-size: 14px !important;
                        line-height: 1.3 !important;
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
                        margin: 0px 0 !important;
                        font-size: 16px !important;
                        line-height: 1.2 !important;
                    }
                    
                    .document-sheet .college-name {
                        font-size: 14px !important;
                        margin-bottom: 4px !important;
                    }
                    
                    .document-sheet h2 {
                        font-size: 18px !important;
                        margin-top: 0 !important;
                        margin-bottom: 10px !important;
                    }
                    
                    .document-sheet .document-header p {
                        font-size: 15px !important;
                        margin-bottom: 14px !important;
                    }
                    
                    .document-sheet .report-signatures p {
                        margin: 2px 0 !important;
                        font-size: 14px !important;
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

export default ReportsPage