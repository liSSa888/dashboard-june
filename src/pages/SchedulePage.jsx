import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { loadGroups, loadTeachers, loadDisciplinesByGroup } from '../data/loadData'

function SchedulePage() {
    const [groups, setGroups] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [disciplinesByGroup, setDisciplinesByGroup] = useState({});

    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [selectedWeek, setSelectedWeek] = useState(1);

    const [schedule, setSchedule] = useState([]);
    const [collisions, setCollisions] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const [availability, setAvailability] = useState({});
    const [preferences, setPreferences] = useState({});
    const [teachersForGroup, setTeachersForGroup] = useState([]);


    const [weeksSchedule, setWeeksSchedule] = useState({});
    const [totalWeeks, setTotalWeeks] = useState(1);
    const [currentWeek, setCurrentWeek] = useState(1);

    useEffect(() => {
        const load = async () => {
            const g = await loadGroups();
            setGroups(g);
            const t = await loadTeachers();
            setTeachers(t);
            const allAvailability = {};
            const allPreferences = {};
            t.forEach(teacher => {
                if (teacher.availability) {
                    Object.keys(teacher.availability).forEach(key => {
                        allAvailability[`${teacher.name}_${key}`] = teacher.availability[key];
                    });
                }
                if (teacher.preferences) {
                    Object.keys(teacher.preferences).forEach(key => {
                        allPreferences[`${teacher.name}_${key}`] = teacher.preferences[key];
                    });
                }
            });
            setAvailability(allAvailability);
            setPreferences(allPreferences);
            const d = await loadDisciplinesByGroup();
            setDisciplinesByGroup(d);
        };
        load();
    }, []);


    useEffect(() => {
        let weeks = 1;
        if (selectedPeriod === 'week') weeks = 1;
        else if (selectedPeriod === 'module') weeks = 8;
        else if (selectedPeriod === 'semester') weeks = 17;
        setTotalWeeks(weeks);

        if (selectedGroup) {
            const saved = localStorage.getItem(`schedule_${selectedGroup}_${selectedPeriod}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setWeeksSchedule(parsed);
                    const weekToShow = selectedPeriod === 'week' ? selectedWeek : 1;
                    setSchedule(parsed[weekToShow] || []);
                    checkCollisions(parsed[weekToShow] || []);
                } catch (e) {
                    setWeeksSchedule({});
                    setSchedule([]);
                    setCollisions([]);
                }
            } else {
                setWeeksSchedule({});
                setSchedule([]);
                setCollisions([]);
            }
        }
        setCurrentWeek(1);
    }, [selectedPeriod, selectedGroup, selectedWeek]);

    useEffect(() => {
        if (selectedGroup && disciplinesByGroup[selectedGroup]) {
            const disciplines = disciplinesByGroup[selectedGroup];
            const teacherNames = disciplines
                .map(d => d.teacher)
                .filter(t => t && t.trim() !== '');
            const uniqueTeachers = [...new Set(teacherNames)];
            setTeachersForGroup(uniqueTeachers);
        } else {
            setTeachersForGroup([]);
        }
    }, [selectedGroup, disciplinesByGroup]);


    const generateSchedule = () => {
        if (!selectedGroup) return alert('Выберите группу');
        const disciplines = disciplinesByGroup[selectedGroup] || [];
        if (!disciplines.length) return alert('Нет дисциплин у группы');

        setIsGenerating(true);
        setTimeout(() => {
            const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'];
            const maxSlots = 4;
            const totalSlots = days.length * maxSlots;


            let pairsMap = {};
            disciplines.forEach(d => {
                pairsMap[d.name] = 1;
            });


            const remainingSlots = totalSlots - disciplines.length;
            if (remainingSlots > 0) {
                const totalHours = disciplines.reduce((sum, d) => sum + (d.hours || 0), 0);
                if (totalHours > 0) {

                    const sorted = [...disciplines].sort((a, b) => (b.hours || 0) - (a.hours || 0));
                    let allocated = 0;
                    sorted.forEach(d => {
                        const extra = Math.round((d.hours / totalHours) * remainingSlots);
                        pairsMap[d.name] += extra;
                        allocated += extra;
                    });

                    if (allocated > remainingSlots) {
                        const diff = allocated - remainingSlots;
                        const lastDisc = sorted[sorted.length - 1];
                        pairsMap[lastDisc.name] = Math.max(1, pairsMap[lastDisc.name] - diff);
                    }
                }
            }

            // МАССИВ ЗАНЯТИЙ
            let lessons = [];
            Object.keys(pairsMap).forEach(discName => {
                const disc = disciplines.find(d => d.name === discName);
                if (disc) {
                    for (let i = 0; i < pairsMap[discName]; i++) {
                        lessons.push({
                            discipline: disc.name,
                            teacher: disc.teacher,
                            type: disc.type || 'лекция',
                        });
                    }
                }
            });


            lessons.sort(() => Math.random() - 0.5);

            // РАСПРЕДЕЛение ПО ДНЯМ
            const totalLessons = lessons.length;
            let perDay = Math.floor(totalLessons / days.length);
            let remainder = totalLessons % days.length;
            let dayLoad = days.map((day, idx) => {
                let count = perDay + (idx < remainder ? 1 : 0);
                return { day, count };
            });

            const baseSchedule = days.map((day, dayIdx) => {
                const slots = [];
                const dayLessons = [];
                for (let i = 0; i < dayLoad[dayIdx].count; i++) {
                    if (lessons.length > 0) {
                        dayLessons.push(lessons.pop());
                    }
                }


                dayLessons.sort((a, b) => {
                    const aPref = preferences[`${a.teacher}_${day}_1`] === true ? 1 : 0;
                    const bPref = preferences[`${b.teacher}_${day}_1`] === true ? 1 : 0;
                    return bPref - aPref;
                });

                // Заполнение слотов
                for (let slot = 1; slot <= maxSlots; slot++) {
                    let placed = false;
                    for (let i = 0; i < dayLessons.length; i++) {
                        const lesson = dayLessons[i];
                        if (!lesson) continue;
                        const teacherName = lesson.teacher;
                        if (!teacherName) continue;
                        const key = `${teacherName}_${day}_${slot}`;
                        if (availability[key] !== false) {
                            slots[slot - 1] = {
                                discipline: lesson.discipline,
                                teacher: teacherName,
                                type: lesson.type,
                                day,
                                slot,
                            };
                            dayLessons[i] = null;
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) {
                        slots[slot - 1] = null;
                    }
                }


                const remaining = dayLessons.filter(l => l !== null);
                for (const lesson of remaining) {
                    for (let slot = 1; slot <= maxSlots; slot++) {
                        if (!slots[slot - 1]) {
                            const key = `${lesson.teacher}_${day}_${slot}`;
                            if (availability[key] !== false) {
                                slots[slot - 1] = {
                                    discipline: lesson.discipline,
                                    teacher: lesson.teacher,
                                    type: lesson.type,
                                    day,
                                    slot,
                                };
                                break;
                            }
                        }
                    }
                }

                return { day, slots };
            });


            const newWeeks = { ...weeksSchedule };
            if (selectedPeriod === 'week') {
                newWeeks[selectedWeek] = JSON.parse(JSON.stringify(baseSchedule));
            } else {
                for (let w = 1; w <= totalWeeks; w++) {
                    newWeeks[w] = JSON.parse(JSON.stringify(baseSchedule));
                }
            }
            setWeeksSchedule(newWeeks);
            localStorage.setItem(`schedule_${selectedGroup}_${selectedPeriod}`, JSON.stringify(newWeeks));

            const firstWeek = selectedPeriod === 'week' ? selectedWeek : 1;
            setCurrentWeek(firstWeek);
            setSchedule(newWeeks[firstWeek]);
            checkCollisions(newWeeks[firstWeek]);
            setIsGenerating(false);
        }, 300);
    };

    const checkCollisions = (data) => {
        const conflicts = [];
        const teacherMap = {};
        const groupMap = {};
        data.forEach((dayData) => {
            dayData.slots.forEach((slotData, slotIndex) => {
                if (!slotData) return;
                const day = dayData.day;
                const slot = slotIndex + 1;
                const tKey = `${slotData.teacher}_${day}_${slot}`;
                if (teacherMap[tKey]) {
                    conflicts.push({ type: 'teacher', teacher: slotData.teacher, day: day, slot: slot });
                } else {
                    teacherMap[tKey] = true;
                }
                const gKey = `${selectedGroup}_${day}_${slot}`;
                if (groupMap[gKey]) {
                    conflicts.push({ type: 'group', group: selectedGroup, day: day, slot: slot });
                } else {
                    groupMap[gKey] = true;
                }
            });
        });
        setCollisions(conflicts);
    };

    const handleDragStart = (e, dayIdx, slotIdx) => {
        const item = schedule[dayIdx]?.slots[slotIdx];
        if (!item) return;
        e.dataTransfer.setData('dragData', JSON.stringify({ dayIdx, slotIdx }));
    };

    const handleDrop = (e, targetDayIdx, targetSlotIdx) => {
        e.preventDefault();
        const drag = JSON.parse(e.dataTransfer.getData('dragData'));
        const { dayIdx: srcDayIdx, slotIdx: srcSlotIdx } = drag;
        if (srcDayIdx === targetDayIdx && srcSlotIdx === targetSlotIdx) return;
        const newSchedule = [...schedule];
        const draggedItem = newSchedule[srcDayIdx].slots[srcSlotIdx];
        if (!draggedItem) return;
        newSchedule[srcDayIdx].slots[srcSlotIdx] = null;
        const targetItem = newSchedule[targetDayIdx].slots[targetSlotIdx];
        if (targetItem) {
            newSchedule[srcDayIdx].slots[srcSlotIdx] = targetItem;
        }
        newSchedule[targetDayIdx].slots[targetSlotIdx] = draggedItem;
        setSchedule(newSchedule);
        checkCollisions(newSchedule);

        const newWeeks = { ...weeksSchedule };
        if (selectedPeriod === 'week') {
            newWeeks[selectedWeek] = newSchedule;
        } else {
            newWeeks[currentWeek] = newSchedule;
        }
        setWeeksSchedule(newWeeks);
        localStorage.setItem(`schedule_${selectedGroup}_${selectedPeriod}`, JSON.stringify(newWeeks));
    };

    const handleDragOver = (e) => e.preventDefault();

    const toggleAvailability = (teacher, day, slot) => {
        const key = `${teacher}_${day}_${slot}`;
        setAvailability((prev) => ({ ...prev, [key]: prev[key] !== false }));
    };

    const goToWeek = (weekNum) => {
        if (weekNum < 1 || weekNum > totalWeeks) return;
        setCurrentWeek(weekNum);
        const weekData = weeksSchedule[weekNum] || [];
        setSchedule(weekData);
        checkCollisions(weekData);
    };

    const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'];

    return (
        <Layout>
            <main className="main">
                <div className="main-content">
                    <div className="top-panel">
                        <h1>📅 Генератор расписания</h1>
                        <button className="save-btn" onClick={generateSchedule} disabled={isGenerating}>
                            {isGenerating ? 'Генерация...' : 'Сгенерировать автоматически'}
                        </button>
                    </div>

                    <p className="page-description">Выберите группу, период и нажмите «Сгенерировать».</p>

                    <div className="card filter-card">
                        <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                            <option value="">Группа</option>
                            {groups.map((g, index) => {
                                const value = typeof g === 'string' ? g : g.name;
                                return <option key={index} value={value}>{value}</option>;
                            })}
                        </select>
                        <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
                            <option value="semester">Семестр (17 недель)</option>
                            <option value="module">Модуль (8 недель)</option>
                            <option value="week">Неделя (1 неделя)</option>
                        </select>
                        {selectedPeriod === 'week' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>Неделя:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="16"
                                    value={selectedWeek}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val >= 1 && val <= 16 && val !== selectedWeek) {
                                            if (schedule.length > 0 && schedule.some(day => day.slots.some(s => s !== null))) {
                                                const newWeeks = { ...weeksSchedule };
                                                newWeeks[selectedWeek] = schedule;
                                                setWeeksSchedule(newWeeks);
                                                localStorage.setItem(`schedule_${selectedGroup}_${selectedPeriod}`, JSON.stringify(newWeeks));
                                            }
                                            setSelectedWeek(val);
                                            const saved = localStorage.getItem(`schedule_${selectedGroup}_${selectedPeriod}`);
                                            if (saved) {
                                                try {
                                                    const parsed = JSON.parse(saved);
                                                    setWeeksSchedule(parsed);
                                                    setSchedule(parsed[val] || []);
                                                    checkCollisions(parsed[val] || []);
                                                } catch (e) { }
                                            } else {
                                                setSchedule([]);
                                                setCollisions([]);
                                            }
                                        }
                                    }}
                                    style={{ width: '60px' }}
                                />
                            </div>
                        )}
                    </div>

                    {schedule.length > 0 && totalWeeks > 1 && (
                        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
                            <button
                                onClick={() => goToWeek(currentWeek - 1)}
                                disabled={currentWeek <= 1}
                                className="save-btn"
                                style={{ background: currentWeek <= 1 ? '#ccc' : '#6c757d', padding: '6px 15px' }}
                            >
                                ← Назад
                            </button>
                            <span style={{ fontWeight: 'bold' }}>
                                Неделя {currentWeek} из {totalWeeks}
                            </span>
                            <button
                                onClick={() => goToWeek(currentWeek + 1)}
                                disabled={currentWeek >= totalWeeks}
                                className="save-btn"
                                style={{ background: currentWeek >= totalWeeks ? '#ccc' : '#6c757d', padding: '6px 15px' }}
                            >
                                Вперёд →
                            </button>
                        </div>
                    )}

                    {teachersForGroup.length > 0 && (
                        <div className="card">
                            <h3>Жёсткие ограничения (занятые слоты)</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                                {teachers
                                    .filter(t => teachersForGroup.includes(t.name))
                                    .map((t) => (
                                        <div key={t.name}>
                                            <strong style={{ fontSize: '13px' }}>{t.name}</strong>
                                            <table style={{ borderCollapse: 'collapse', marginTop: '4px' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ padding: '2px 6px', fontSize: '10px', textAlign: 'center' }}>Пара\День</th>
                                                        {days.map((day) => (
                                                            <th key={day} style={{ padding: '2px 6px', fontSize: '10px', textAlign: 'center' }}>{day}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[1, 2, 3, 4].map((slot) => (
                                                        <tr key={slot}>
                                                            <td style={{ padding: '2px 6px', fontSize: '10px', textAlign: 'center', fontWeight: 'bold' }}>{slot}</td>
                                                            {days.map((day) => {
                                                                const key = `${t.name}_${day}_${slot}`;
                                                                const available = availability[key] !== false;
                                                                return (
                                                                    <td key={`${t.name}_${day}_${slot}`} style={{ padding: '2px' }}>
                                                                        <button
                                                                            onClick={() => toggleAvailability(t.name, day, slot)}
                                                                            style={{
                                                                                width: '28px',
                                                                                height: '28px',
                                                                                background: available ? '#a5d6a7' : '#ef9a9a',
                                                                                border: '1px solid #ccc',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '10px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                            }}
                                                                            title={`${day} ${slot} пара — ${available ? 'доступно' : 'занято'}`}
                                                                        >
                                                                            {slot}
                                                                        </button>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                🟢 доступно — 🟥 занято
                            </div>
                        </div>
                    )}

                    {schedule.length > 0 && (
                        <div className="card table-card">
                            <div className="table-wrapper">
                                <table className="schedule-table">
                                    <thead>
                                        <tr>
                                            <th>Время</th>
                                            {days.map((d) => <th key={d}>{d}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4].map((slotNum) => (
                                            <tr key={slotNum}>
                                                <td style={{ fontWeight: 'bold', background: '#f5f5f5' }}>{slotNum} пара</td>
                                                {schedule.map((dayData, dayIdx) => {
                                                    const slotData = dayData.slots[slotNum - 1];
                                                    const isCollision = collisions.some((c) => c.day === dayData.day && c.slot === slotNum);
                                                    return (
                                                        <td
                                                            key={`${dayIdx}-${slotNum}`}
                                                            draggable={!!slotData}
                                                            onDragStart={(e) => handleDragStart(e, dayIdx, slotNum - 1)}
                                                            onDrop={(e) => handleDrop(e, dayIdx, slotNum - 1)}
                                                            onDragOver={handleDragOver}
                                                            style={{
                                                                background: isCollision ? '#ffebee' : slotData ? '#e8f5e9' : '#fafafa',
                                                                border: isCollision ? '2px solid red' : '1px solid #ddd',
                                                                minWidth: '100px',
                                                                padding: '8px',
                                                                cursor: slotData ? 'grab' : 'default',
                                                            }}
                                                        >
                                                            {slotData ? (
                                                                <div>
                                                                    <strong>{slotData.discipline}</strong>
                                                                    <div style={{ fontSize: '12px', color: '#555' }}>{slotData.teacher}</div>
                                                                </div>
                                                            ) : <span style={{ color: '#ccc' }}>—</span>}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {collisions.length > 0 && (
                                <div style={{ marginTop: '15px', padding: '10px', background: '#ffebee', borderRadius: '8px' }}>
                                    <h4 style={{ color: '#c62828' }}>⚠️ Коллизии:</h4>
                                    {collisions.map((c, i) => (
                                        <p key={i} style={{ color: '#c62828' }}>
                                            {c.type === 'teacher' ? `Преподаватель ${c.teacher} занят (${c.day}, ${c.slot} пара)` : `Группа имеет двойную нагрузку (${c.day}, ${c.slot} пара)`}
                                        </p>
                                    ))}
                                </div>
                            )}

                            <p style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
                                💡 Перетащите занятие в другую ячейку для ручной корректировки.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </Layout>
    );
}

export default SchedulePage;