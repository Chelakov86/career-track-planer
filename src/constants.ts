import { ScheduleBlock, ApplicationStatus, Language, JobApplication } from './types';

export const TRANSLATIONS = {
  en: {
    login: {
      title: "Welcome Back",
      subtitle: "Sign in to continue your career journey.",
      googleBtn: "Sign in with Google",
      footer: "Protected by CareerTrack Security"
    },
    nav: {
      schedule: "Daily Schedule",
      board: "Application Board",
      stats: "Analytics",
      subtitle: "Job Hunt Planner",
      focus: "Focus Area",
      logout: "Log out"
    },
    schedule: {
      title: "Daily Routine",
      subtitle: "Structured blocks for maximum productivity.",
      export: "Export All (.ics)",
      addToCal: "Add to Cal",
      getFocus: "Get Focus",
      coachAdvice: "Coach's Advice",
      thinking: "Thinking..."
    },
    board: {
      title: "Job Tracker",
      subtitle: "Visualize your application pipeline.",
      addJob: "Add Job",
      editJob: "Edit Job",
      viewJob: "View Job",
      openLink: "Open Link",
      exportCSV: "Export CSV",
      newOpp: "Add New Opportunity",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      edit: "Edit",
      deleteTitle: "Delete Job?",
      deleteMessage: "Are you sure you want to permanently delete this application?",
      confirmDelete: "Delete",
      placeholders: {
        company: "Company",
        position: "Position",
        location: "Location (e.g. Remote)",
        salary: "Salary (e.g. 60k)",
        link: "Job Link (URL)",
        notes: "Notes & Thoughts..."
      },
      labels: {
        status: "Status",
        role: "Role",
        location: "Location",
        salary: "Salary",
        link: "Link",
        notes: "Notes",
        dateAdded: "Date Added",
        lastUpdated: "Last Updated"
      },
      status: {
        [ApplicationStatus.RESEARCH]: 'Research',
        [ApplicationStatus.TO_APPLY]: 'To Apply',
        [ApplicationStatus.APPLIED]: 'Applied',
        [ApplicationStatus.INTERVIEW]: 'Interview',
        [ApplicationStatus.OFFER]: 'Offer',
        [ApplicationStatus.REJECTED]: 'Rejected'
      }
    },
    dashboard: {
      total: "Total Applications",
      active: "Active Pipeline",
      interviews: "Interviews",
      funnel: "Application Funnel",
      distribution: "Role Focus Distribution"
    },
    categories: {
      'Research': 'Research',
      'Deep Work': 'Deep Work',
      'Break': 'Break',
      'Learning': 'Learning',
      'Network': 'Networking',
      'Admin': 'Admin'
    }
  },
  de: {
    login: {
      title: "Willkommen zurück",
      subtitle: "Melde dich an, um deine Karriereplanung fortzusetzen.",
      googleBtn: "Mit Google anmelden",
      footer: "Geschützt durch CareerTrack Security"
    },
    nav: {
      schedule: "Tagesplan",
      board: "Bewerbungen",
      stats: "Statistik",
      subtitle: "Jobsuche Planer",
      focus: "Fokusbereich",
      logout: "Abmelden"
    },
    schedule: {
      title: "Tagesablauf",
      subtitle: "Strukturierte Blöcke für maximale Produktivität.",
      export: "Alles exportieren (.ics)",
      addToCal: "Kalender",
      getFocus: "Fokus starten",
      coachAdvice: "Coach Ratschlag",
      thinking: "Nachdenken..."
    },
    board: {
      title: "Bewerbungstracker",
      subtitle: "Visualisiere deinen Bewerbungsprozess.",
      addJob: "Job hinzufügen",
      editJob: "Job bearbeiten",
      viewJob: "Job anzeigen",
      openLink: "Link öffnen",
      exportCSV: "Excel Export",
      newOpp: "Neue Chance hinzufügen",
      save: "Speichern",
      cancel: "Abbrechen",
      close: "Schließen",
      edit: "Bearbeiten",
      deleteTitle: "Job löschen?",
      deleteMessage: "Möchtest du diese Bewerbung wirklich unwiderruflich löschen?",
      confirmDelete: "Löschen",
      placeholders: {
        company: "Firma",
        position: "Position",
        location: "Ort (z.B. Remote)",
        salary: "Gehalt (z.B. 60k)",
        link: "Link zur Stelle",
        notes: "Notizen & Gedanken..."
      },
      labels: {
        status: "Status",
        role: "Rolle",
        location: "Ort",
        salary: "Gehalt",
        link: "Link",
        notes: "Notizen",
        dateAdded: "Hinzugefügt",
        lastUpdated: "Aktualisiert"
      },
      status: {
        [ApplicationStatus.RESEARCH]: 'Recherche',
        [ApplicationStatus.TO_APPLY]: 'Zu bewerben',
        [ApplicationStatus.APPLIED]: 'Beworben',
        [ApplicationStatus.INTERVIEW]: 'Interview',
        [ApplicationStatus.OFFER]: 'Angebot',
        [ApplicationStatus.REJECTED]: 'Abgelehnt'
      }
    },
    dashboard: {
      total: "Bewerbungen Gesamt",
      active: "Aktive Pipeline",
      interviews: "Interviews",
      funnel: "Bewerbungstrichter",
      distribution: "Verteilung Rollenfokus"
    },
    categories: {
      'Research': 'Recherche',
      'Deep Work': 'Fokusarbeit',
      'Break': 'Pause',
      'Learning': 'Lernen',
      'Network': 'Netzwerken',
      'Admin': 'Admin'
    }
  }
};

const SCHEDULE_EN: ScheduleBlock[] = [
  {
    id: '1',
    startTime: '09:00',
    endTime: '10:00',
    title: 'Research & Screening',
    description: 'Scan job boards (LinkedIn, Stepstone). Analyze PM vs QA fit. Read descriptions thoroughly.',
    category: 'Research',
    isFixed: false
  },
  {
    id: '2',
    startTime: '10:00',
    endTime: '12:00',
    title: 'Deep Work: Applications',
    description: 'Tailor CV/Resume. Write specific cover letters highlighting Agile or Testing tools.',
    category: 'Deep Work',
    isFixed: false
  },
  {
    id: '3',
    startTime: '12:00',
    endTime: '13:00',
    title: 'Lunch Break',
    description: 'Disconnect. Walk, eat, no screens.',
    category: 'Break',
    isFixed: true
  },
  {
    id: '4',
    startTime: '13:00',
    endTime: '14:00',
    title: 'Upskilling (Hard Skills)',
    description: 'Online courses, certificates (PMP, ISTQB), or tool training (Jira, Cypress).',
    category: 'Learning',
    isFixed: false
  },
  {
    id: '5',
    startTime: '14:00',
    endTime: '15:00',
    title: 'Networking & Admin',
    description: 'LinkedIn engagement, message recruiters, update application tracker.',
    category: 'Network',
    isFixed: false
  }
];

const SCHEDULE_DE: ScheduleBlock[] = [
  {
    id: '1',
    startTime: '09:00',
    endTime: '10:00',
    title: 'Recherche & Screening',
    description: 'Jobbörsen scannen (LinkedIn, Stepstone). Passgenauigkeit für PM vs QA prüfen. Beschreibungen gründlich lesen.',
    category: 'Research',
    isFixed: false
  },
  {
    id: '2',
    startTime: '10:00',
    endTime: '12:00',
    title: 'Fokusarbeit: Bewerbungen',
    description: 'Lebenslauf anpassen. Spezifische Anschreiben verfassen, die Agile- oder Testing-Tools hervorheben.',
    category: 'Deep Work',
    isFixed: false
  },
  {
    id: '3',
    startTime: '12:00',
    endTime: '13:00',
    title: 'Mittagspause',
    description: 'Abschalten. Spazieren gehen, essen, keine Bildschirme.',
    category: 'Break',
    isFixed: true
  },
  {
    id: '4',
    startTime: '13:00',
    endTime: '14:00',
    title: 'Weiterbildung (Hard Skills)',
    description: 'Online-Kurse, Zertifikate (PMP, ISTQB) oder Tool-Training (Jira, Cypress).',
    category: 'Learning',
    isFixed: false
  },
  {
    id: '5',
    startTime: '14:00',
    endTime: '15:00',
    title: 'Netzwerken & Admin',
    description: 'LinkedIn Interaktion, Recruiter anschreiben, Bewerbungstracker aktualisieren.',
    category: 'Network',
    isFixed: false
  },
];

export const getSchedule = (lang: Language): ScheduleBlock[] => lang === 'de' ? SCHEDULE_DE : SCHEDULE_EN;

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.RESEARCH]: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  [ApplicationStatus.TO_APPLY]: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900',
  [ApplicationStatus.APPLIED]: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900',
  [ApplicationStatus.INTERVIEW]: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-900',
  [ApplicationStatus.OFFER]: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900',
  [ApplicationStatus.REJECTED]: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900',
};

export const MOCK_JOBS: JobApplication[] = [
  {
    id: 'j1',
    company: 'TechCorp GmbH',
    position: 'Junior Project Manager',
    location: 'Berlin (Remote)',
    status: ApplicationStatus.APPLIED,
    roleType: 'PM',
    dateAdded: '2023-10-25',
    lastUpdated: '2023-10-26',
    notes: 'Requires Jira expertise.',
    salary: '55k'
  },
  {
    id: 'j2',
    company: 'QualitySoft',
    position: 'QA Engineer',
    location: 'Munich',
    status: ApplicationStatus.INTERVIEW,
    roleType: 'QA',
    dateAdded: '2023-10-20',
    lastUpdated: '2023-10-27',
    notes: 'Technical interview on Tuesday.',
    salary: '60k'
  },
  {
    id: 'j3',
    company: 'StartUp Inc',
    position: 'Product Owner',
    location: 'Hamburg',
    status: ApplicationStatus.RESEARCH,
    roleType: 'PM',
    dateAdded: '2023-10-28',
    lastUpdated: '2023-10-28',
    notes: 'Looks interesting, need to check funding.',
    salary: 'Unknown'
  }
];