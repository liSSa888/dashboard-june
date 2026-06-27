// src/data/loadData.js — РАБОЧАЯ ВЕРСИЯ С LOCALSTORAGE

// ========== ГРУППЫ ==========
export const loadGroups = async () => {
  const saved = localStorage.getItem("groups");
  if (saved) return JSON.parse(saved).map((g) => g.name);
  return [];
};

export const loadGroupsFull = async () => {
  const saved = localStorage.getItem("groups");
  return saved ? JSON.parse(saved) : [];
};

export const saveGroups = async (groups) => {
  localStorage.setItem("groups", JSON.stringify(groups));
};

// ========== ПРЕПОДАВАТЕЛИ (с availability и preferences) ==========
export const loadTeachers = async () => {
  const saved = localStorage.getItem("teachers");
  if (saved) {
    const teachers = JSON.parse(saved);
    return teachers.map((t) => ({
      ...t,
      availability: t.availability || {},
      preferences: t.preferences || {},
    }));
  }
  return [];
};

export const saveTeachers = async (teachers) => {
  localStorage.setItem("teachers", JSON.stringify(teachers));
};

// ========== ДИСЦИПЛИНЫ (с синхронизацией имён преподавателей) ==========
export const loadDisciplinesByGroup = async () => {
  const saved = localStorage.getItem("disciplinesByGroup");
  if (!saved) return {};

  const disciplines = JSON.parse(saved);

  // Загружаем актуальный список преподавателей
  const teachers = await loadTeachers();
  const teacherNames = new Set(teachers.map((t) => t.name));

  // Проходим по всем группам и синхронизируем имена преподавателей
  Object.keys(disciplines).forEach((groupName) => {
    disciplines[groupName] = disciplines[groupName].map((d) => {
      if (!d.teacher) return d;

      // Если преподаватель есть в актуальном списке — оставляем как есть
      if (teacherNames.has(d.teacher)) return d;

      // Если нет — ищем по частичному совпадению
      const found = teachers.find(
        (t) =>
          t.name.toLowerCase().includes(d.teacher.toLowerCase()) ||
          d.teacher.toLowerCase().includes(t.name.toLowerCase()),
      );

      if (found) {
        return { ...d, teacher: found.name };
      }

      // Если не нашли — оставляем как есть
      return d;
    });
  });

  // Сохраняем синхронизированные дисциплины
  localStorage.setItem("disciplinesByGroup", JSON.stringify(disciplines));

  return disciplines;
};

export const saveDisciplinesByGroup = async (data) => {
  localStorage.setItem("disciplinesByGroup", JSON.stringify(data));
};

// ========== СТУДЕНТЫ ==========
export const loadStudents = async () => {
  const saved = localStorage.getItem("students");
  return saved ? JSON.parse(saved) : [];
};

export const saveStudents = async (students) => {
  localStorage.setItem("students", JSON.stringify(students));
};

// ========== РЕЙТИНГИ ==========
export const loadRatings = async () => {
  const saved = localStorage.getItem("ratings");
  return saved ? JSON.parse(saved) : {};
};

export const saveRatings = async (ratings) => {
  localStorage.setItem("ratings", JSON.stringify(ratings));
};

// ========== ИСТОРИЯ ==========
export const loadHistory = async () => {
  const saved = localStorage.getItem("history");
  return saved ? JSON.parse(saved) : [];
};

export const saveHistory = async (history) => {
  localStorage.setItem("history", JSON.stringify(history));
};
