import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { loadGroupsFull, loadTeachers, loadStudents, loadRatings, loadDisciplinesByGroup } from '../data/loadData'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import '../styles/style.css'
import '../styles/reports.css'

function ReportsPage() {
    const [groups, setGroups] = useState([])
    const [teachers, setTeachers] = useState([])
    const [students, setStudents] = useState([])
    const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
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

    useEffect(() => {
        const savedGroup = localStorage.getItem('reportsGroup')
        const savedType = localStorage.getItem('reportsType')

        if (savedGroup) {
            setSelectedGroup(savedGroup)
            localStorage.removeItem('reportsGroup')
        }
        if (savedType) {
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
        ? sortedStudents.filter(s => s.group === selectedGroup)
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

    // ========== ЭКСПОРТ В WORD ==========
    const exportToWord = () => {
        const element = document.querySelector('.document-sheet')
        if (!element) {
            alert('Сначала сформируйте ведомость!')
            return
        }

        const clone = element.cloneNode(true)

        clone.style.width = '100%'
        clone.style.maxWidth = '100%'
        clone.style.padding = '10mm 15mm'
        clone.style.boxShadow = 'none'
        clone.style.background = 'white'
        clone.style.margin = '0 auto'

        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office'
                  xmlns:w='urn:schemas-microsoft-com:office:word'
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset="utf-8">
                <title>Ведомость</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    body { font-family: Arial, sans-serif; font-size: 14px; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #000; padding: 4px 8px; text-align: center; vertical-align: middle; }
                    th { background: #f8f8f8; font-weight: bold; }
                    .college-name { font-size: 14px; text-align: center; font-weight: bold; margin-bottom: 4px; }
                    .document-header { text-align: center; margin-bottom: 10px; }
                    .document-info p { margin: 2px 0; font-size: 14px; }
                    .report-signatures { margin-top: 16px; }
                    .report-signatures p { margin: 2px 0; font-size: 14px; }
                </style>
            </head>
            <body>
                ${clone.innerHTML}
            </body>
            </html>
        `

        const blob = new Blob([htmlContent], { type: 'application/msword' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `ведомость_${selectedGroup || 'без_группы'}.doc`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
    }

    // ========== ЭКСПОРТ В РЕДАКТИРУЕМЫЙ HTML (ВСЁ МОЖНО ПРАВИТЬ) ==========
    const exportToEditableHtml = () => {
        const printArea = document.querySelector('.print-area')
        if (!printArea) {
            alert('Сначала сформируйте ведомость!')
            return
        }

        const clone = printArea.cloneNode(true)

        // Делаем редактируемыми ВСЕ элементы с текстом
        const allElements = clone.querySelectorAll('*')
        allElements.forEach(el => {
            // Проверяем, есть ли у элемента текстовое содержимое (не пустое и не только пробелы)
            const hasText = el.textContent && el.textContent.trim().length > 0

            // Исключаем контейнеры, которые не должны быть редактируемыми (чтобы не сломать вёрстку)
            const isContainer = ['DIV', 'SECTION', 'TBODY', 'THEAD', 'TR', 'BODY', 'HTML', 'HEAD', 'STYLE', 'SCRIPT'].includes(el.tagName)

            if (hasText && !isContainer) {
                el.setAttribute('contenteditable', 'true')
            }
        })

        // Отдельно обрабатываем пустые ячейки таблицы (чтобы в них можно было вписать оценки)
        const allCells = clone.querySelectorAll('td, th')
        allCells.forEach(cell => {
            cell.setAttribute('contenteditable', 'true')
            cell.style.outline = 'none'
            // Если ячейка пустая — ставим неразрывный пробел, чтобы она была видна и кликабельна
            if (cell.textContent.trim() === '') {
                cell.innerHTML = '&nbsp;'
            }
        })

        // Убираем outline у всех редактируемых элементов
        const editableElements = clone.querySelectorAll('[contenteditable="true"]')
        editableElements.forEach(el => {
            el.style.outline = 'none'
        })

        const sheets = clone.querySelectorAll('.document-sheet')
        sheets.forEach(sheet => {
            sheet.style.boxShadow = 'none'
            sheet.style.margin = '0 auto'
            sheet.style.background = 'white'
            sheet.style.width = '210mm'
            sheet.style.minHeight = '297mm'
            sheet.style.padding = '15mm'
        })

        const allPElements = clone.querySelectorAll('p')
        allPElements.forEach(p => {
            if (p.style.margin === '0px 0') {
                p.style.margin = '0'
            }
        })

        const styles = `
            * { box-sizing: border-box; }
            body { 
                margin: 0; 
                padding: 20px; 
                background: #e8e8e8;
                font-family: 'Times New Roman', Times, serif;
            }
            .print-area {
                background: white;
                max-width: 210mm;
                margin: 0 auto;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .document-sheet {
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
                background: white;
                padding: 15mm;
                color: black;
            }
            .document-header {
                text-align: center;
                margin-bottom: 13px;
                font-family: 'Times New Roman', Times, serif;
            }
            .document-header h2 {
                font-size: 16px;
                margin-bottom: 0;
                text-align: center;
                color: black;
            }
            .college-name {
                font-size: 15px;
                line-height: 1.4;
                font-weight: bold;
                margin-bottom: 16px;
            }
            .document-info {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .document-info p,
            .report-signatures p {
                font-size: 15px;
                line-height: 1.4;
                font-family: 'Times New Roman', Times, serif;
                margin: 0;
                padding: 0;
            }
            .report-table {
                width: 100%;
                margin-top: 25px;
                border-collapse: collapse;
                min-width: unset;
            }
            .report-table th,
            .report-table td {
                border: 1px solid black;
                padding: 4px;
                font-family: 'Times New Roman', Times, serif;
                text-align: center;
                font-size: 14px;
            }
            .report-table th:nth-child(1), .report-table td:nth-child(1) { width: 5%; }
            .report-table th:nth-child(2), .report-table td:nth-child(2) { width: 45%; }
            .report-table th:nth-child(3), .report-table td:nth-child(3) { width: 20%; }
            .report-table th:nth-child(4), .report-table td:nth-child(4) { width: 10%; }
            .report-table th:nth-child(5), .report-table td:nth-child(5) { width: 10%; }
            .report-table th:nth-child(6), .report-table td:nth-child(6) { width: 10%; }
            .document-sheet .table-wrapper { overflow-x: hidden; }
            
            .editable-hint {
                text-align: center;
                font-size: 12px;
                color: #999;
                padding: 8px;
                background: #f5f5f5;
                border-bottom: 1px solid #ddd;
                user-select: none;
            }
            .editable-hint span {
                background: #ffeb3b;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: bold;
                color: #333;
            }
            [contenteditable="true"]:hover {
                background: #f0f7ff !important;
                cursor: text;
            }
            [contenteditable="true"]:focus {
                background: #e3f0ff !important;
                outline: 2px solid #4a90d9 !important;
            }

            @media print {
                body { padding: 0; background: white; }
                .editable-hint { display: none; }
                .document-sheet { 
                    padding: 0 !important; 
                    margin: 0 !important;
                    width: 100% !important;
                    min-height: auto !important;
                }
                .document-back { page-break-before: always; }
                [contenteditable="true"]:hover,
                [contenteditable="true"]:focus {
                    background: transparent !important;
                    outline: none !important;
                }
            }
        `

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Ведомость ${selectedGroup || ''}</title>
                <style>${styles}</style>
            </head>
            <body>
                <div class="editable-hint">
                    📝 <span>КЛИКНИ ПО ЛЮБОМУ ТЕКСТУ</span> — И РЕДАКТИРУЙ!
                    (Изменения сохранятся при печати или через Ctrl+S)
                </div>
                <div class="print-area">
                    ${clone.innerHTML}
                </div>
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        const cells = document.querySelectorAll('[contenteditable="true"]');
                        cells.forEach(cell => {
                            cell.addEventListener('blur', function() {
                                if (this.textContent.trim() === '') {
                                    this.innerHTML = '&nbsp;';
                                }
                            });
                        });
                    });
                </script>
            </body>
            </html>
        `

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `Ведомость_${selectedGroup || 'без_группы'}_редактируемая.html`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
    }

    const exportToPDF = () => {
        const sheets = document.querySelectorAll('.document-sheet')
        if (!sheets || sheets.length === 0) {
            alert('Сначала сформируйте ведомость!')
            return
        }

        const pdf = new jsPDF('p', 'mm', 'a4')
        let isFirstPage = true

        // Сохраняем оригинальные стили
        const originalStyles = []
        sheets.forEach((sheet, index) => {
            originalStyles[index] = {
                width: sheet.style.width,
                overflow: sheet.style.overflow
            }
        })

        // Рендерим каждый лист по отдельности
        const renderSheet = (index) => {
            const sheet = sheets[index]
            if (!sheet) {
                pdf.save(`ведомость_${selectedGroup || 'без_группы'}.pdf`)
                return
            }

            // Временно растягиваем для рендера
            sheet.style.width = '210mm'
            sheet.style.overflow = 'visible'

            html2canvas(sheet, {
                scale: 2,
                useCORS: true,
                logging: false,
                width: 800,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('.document-sheet')
                    if (clonedElement) {
                        clonedElement.style.width = '210mm'
                        clonedElement.style.overflow = 'visible'
                    }
                }
            }).then(canvas => {
                // Возвращаем стили
                sheet.style.width = originalStyles[index]?.width || ''
                sheet.style.overflow = originalStyles[index]?.overflow || ''

                const imgData = canvas.toDataURL('image/png')
                const pdfWidth = 210
                const pdfHeight = 297
                const imgWidth = pdfWidth
                const imgHeight = (canvas.height * pdfWidth) / canvas.width

                // Если это не первая страница — добавляем новую
                if (!isFirstPage) {
                    pdf.addPage()
                }
                isFirstPage = false

                // Центрируем изображение на странице
                const xOffset = (pdfWidth - imgWidth) / 2
                const yOffset = (pdfHeight - imgHeight) / 2
                pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight)

                // Рендерим следующий лист
                renderSheet(index + 1)
            }).catch(err => {
                console.error('Ошибка при рендере листа:', err)
                alert('Ошибка при создании PDF. Попробуйте использовать печать.')
            })
        }

        // Начинаем с первого листа
        renderSheet(0)
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
                            <button className="save-btn" onClick={exportToWord} style={{ background: '#2b5797' }}>Word</button>
                            <button className="save-btn" onClick={exportToEditableHtml} style={{ background: '#ff6b6b' }}>📝 Редактировать</button>
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
                            {/* ===== ЛИЦЕВАЯ СТОРОНА ===== */}
                            <section className="document-sheet">
                                <div className="document-header">
                                    <p className="college-name" style={{ fontSize: '14px', marginBottom: '4px' }}>
                                        АВТОНОМНАЯ НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ ПРОФЕССИОНАЛЬНАЯ<br />
                                        ОБРАЗОВАТЕЛЬНАЯ ОРГАНИЗАЦИЯ МОСКОВСКИЙ МЕЖДУНАРОДНЫЙ<br />
                                        КОЛЛЕДЖ ЦИФРОВЫХ ТЕХНОЛОГИЙ "АКАДЕМИЯ ТОП"
                                    </p>
                                    <p style={{ marginTop: '14px', marginBottom: '14px', fontSize: '16px' }}><span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Очная</span>(заочная) форма обучения.</p>
                                    <h2 style={{ marginTop: '0', marginBottom: '22px' }}>ЗАЧЕТНО-ЭКЗАМЕНАЦИОННАЯ ВЕДОМОСТЬ</h2>
                                </div>

                                <div className="document-info" style={{ display: 'flex', flexDirection: 'column', marginBottom: '6px', gap: '1mm' }}>
                                    <p style={{ margin: 0, padding: 0, fontSize: '15px', lineHeight: '1.2' }}>Учебный год: __________ / семестр: ___</p>
                                    <p style={{ margin: 0, padding: 0, fontSize: '15px', lineHeight: '1.2' }}>Форма промежуточной аттестации: {attestationType || '___________'}</p>
                                    <p style={{ margin: 0, padding: 0, fontSize: '15px', lineHeight: '1.2' }}>Группа: {includeGroup ? selectedGroup : '___________'}</p>
                                    <p style={{ margin: '0px 0', fontSize: '15px', lineHeight: '1.2' }}>Профессия/специальность: {includeGroup ? speciality : '___________'}</p>
                                    <p style={{ margin: '0px 0', fontSize: '15px', lineHeight: '1.2' }}>Учебный предмет, курс, дисциплина образовательной программы: {selectedDiscipline || '___________'}</p>
                                    <p style={{ margin: '0px 0', fontSize: '15px', lineHeight: '1.2' }}>Общая трудоемкость по учебному плану (час): {selectedGroup && selectedDiscipline ? (hours || '___________') : '___________'}</p>
                                    <p style={{ margin: '0px 0', fontSize: '15px', lineHeight: '1.2' }}>Фамилия, Имя, Отчество преподавателя: {selectedTeacher || '___________'}</p>
                                    <p style={{ margin: '0px 0', fontSize: '15px', lineHeight: '1.2' }}>Дата проведения: {examDate || '___________'}</p>
                                </div>

                                <div className="table-wrapper">
                                    <table className="report-table" style={{ fontSize: '14px', borderCollapse: 'collapse', width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th rowSpan="2" style={{ padding: '4px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'center' }}>№ п/п</th>
                                                <th rowSpan="2" style={{ padding: '4px 8px', border: '1px solid #000', fontSize: '14px', verticalAlign: 'bottom', textAlign: 'center' }}>ФИО обучающегося</th>
                                                <th rowSpan="2" style={{ padding: '0px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'left', verticalAlign: 'top' }}>Номер зачетной книжки</th>
                                                <th colSpan="2" style={{ padding: '0px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'center', verticalAlign: 'bottom' }}>Оценка</th>
                                                <th rowSpan="2" style={{ padding: '4px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'center', verticalAlign: 'bottom' }}>Подпись преподавателя</th>
                                            </tr>
                                            <tr>
                                                <th style={{ padding: '4px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'center' }}>Цифрой</th>
                                                <th style={{ padding: '0px 0px', border: '1px solid #000', fontSize: '14px', textAlign: 'center', verticalAlign: 'top' }}>Прописью</th>
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
                                                        <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'right', fontSize: '14px' }}>{idx + 1}</td>
                                                        <td style={{ padding: '3px 8px', border: '1px solid #000', fontSize: '14px', textAlign: 'left' }}>{student.name}</td>
                                                        <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'right', fontSize: '14px' }}>{student.recordBook || ''}</td>
                                                        <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'center', fontSize: '14px' }}></td>
                                                        <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'center', fontSize: '14px' }}></td>
                                                        <td style={{ padding: '3px 8px', border: '1px solid #000', textAlign: 'center', fontSize: '14px' }}></td>
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
                                    <p style={{ margin: '15px 0', fontSize: '14px', paddingRight: '20px', fontFamily: 'Times New Roman' }}>
                                        Дата «___»____________________ 202___ г.
                                    </p>
                                </div>
                            </section>

                            {/* ===== ОБОРОТ (ТАБЛИЦА КРИТЕРИЕВ) ===== */}
                            <div style={{ pageBreakBefore: 'always', height: '1px' }}></div>

                            <section className="document-sheet document-back" style={{ marginTop: '0px', paddingTop: '2mm' }}>
                                <div className="table-wrapper" style={{ marginTop: '0px' }}>
                                    <table className="report-table" style={{ fontSize: '12px', borderCollapse: 'collapse', width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th colSpan="2" style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                                                    Критерии
                                                </th>
                                                <th style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                                                    Показатели
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td colSpan="2" style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'left' }}>
                                                    Количество обучающихся, присутствовавших на аттестации
                                                </td>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'center' }}></td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'left', paddingLeft: '15px' }}>
                                                    Из них, получивших
                                                </td>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'center' }}>
                                                    «Отлично»
                                                </td>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'center' }}></td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'left' }}></td>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'center' }}>
                                                    «Хорошо»
                                                </td>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'center' }}></td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'left' }}></td>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'center' }}>
                                                    «Удовлетворительно»
                                                </td>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'center' }}></td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'left' }}></td>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'center' }}>
                                                    «Неудовлетворительно»
                                                </td>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'center' }}></td>
                                            </tr>
                                            <tr>
                                                <td colSpan="2" style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'left' }}>
                                                    Количество неявившихся студентов
                                                </td>
                                                <td style={{ padding: '3px 6px', border: '1px solid #000', fontSize: '12px', textAlign: 'center' }}></td>
                                            </tr>
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
                        padding: 5mm 8mm !important;
                        width: 100% !important;
                        max-width: 210mm !important;
                        box-shadow: none !important;
                        background: white !important;
                    }
                    
                    .document-back {
                        page-break-before: auto !important;
                    }
                    
                    .report-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    
                    .report-table th, .report-table td {
                        padding: 2px 4px !important;
                        font-size: 11px !important;
                        line-height: 1.2 !important;
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
                        font-size: 14px !important;
                        line-height: 1.2 !important;
                    }
                    
                    .document-sheet .college-name {
                        font-size: 12px !important;
                        margin-bottom: 2px !important;
                    }
                    
                    .document-sheet h2 {
                        font-size: 16px !important;
                        margin-top: 0 !important;
                        margin-bottom: 6px !important;
                    }
                    
                    .document-sheet .document-header p {
                        font-size: 13px !important;
                        margin-bottom: 8px !important;
                    }
                    
                    .document-sheet .report-signatures p {
                        margin: 2px 0 !important;
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

export default ReportsPage