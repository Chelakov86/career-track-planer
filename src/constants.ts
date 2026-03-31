import { ScheduleBlock, ApplicationStatus, Language, JobApplication } from './types';

export const TRANSLATIONS = {
  en: {
    login: {
      title: "Welcome Back",
      subtitle: "Sign in to continue your career journey.",
      googleBtn: "Sign in with Google",
      footer: "Protected by CareerTrack Security",
      emailPlaceholder: "Enter your email",
      sendMagicLink: "Send Magic Link",
      sending: "Sending...",
      securedBy: "Secured by Supabase Auth",
      checkEmail: "Check your email!",
      checkEmailMessage: "We sent a magic link to",
      checkEmailAction: "Click it to log in.",
      errorSendingLink: "Error sending magic link"
    },
    nav: {
      schedule: "Daily Schedule",
      board: "Application Board",
      timeline: "Timeline",
      stats: "Analytics",
      subtitle: "Job Hunt Planner",
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
      moveStage: "Move to next stage",
      openLink: "Open Link",
      exportCSV: "Export CSV",
      newOpp: "Add New Opportunity",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      edit: "Edit",
      deleteTitle: "Delete Job?",
      deleteMessage: "Are you sure you want to permanently delete the application for {position} at {company}?",
      confirmDelete: "Delete",
      interview: "interview",
      interviews: "interviews",
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
        location: "Location",
        salary: "Salary",
        link: "Link",
        notes: "Notes",
        dateAdded: "Date Added",
        lastUpdated: "Last Updated",
        interviewRound: "Interview Round",
        interviewDate: "Interview Date",
        interviewStart: "Start Time",
        interviewEnd: "End Time",
        interviewStatus: "Interview Status",
        interviewNotes: "Interview Notes",
        interviewMeetingLink: "Meeting Link"
      },
      status: {
        [ApplicationStatus.RESEARCH]: 'Research',
        [ApplicationStatus.TO_APPLY]: 'To Apply',
        [ApplicationStatus.APPLIED]: 'Applied',
        [ApplicationStatus.INTERVIEW]: 'Interview',
        [ApplicationStatus.OFFER]: 'Offer',
        [ApplicationStatus.REJECTED]: 'Rejected'
      },
      filters: {
        status: 'Filter',
        allStatuses: 'All',
        search: 'Search',
        searchPlaceholder: 'Search company, position, location, notes...',
        sortBy: 'Sort by',
        sortOptions: {
          dateAddedDesc: 'Date added (newest)',
          dateAddedAsc: 'Date added (oldest)',
          lastUpdatedDesc: 'Last updated (newest)',
          lastUpdatedAsc: 'Last updated (oldest)',
          companyAsc: 'Company (A–Z)',
          companyDesc: 'Company (Z–A)',
          positionAsc: 'Position (A–Z)',
          positionDesc: 'Position (Z–A)'
        },
        reset: 'Reset all filters',
        clearAll: 'Clear all filters',
        activeFilters: 'Active filters:',
        showing: 'Showing',
        of: 'of',
        applications: 'applications',
        last7Days: 'Last 7 days',
        last30Days: 'Last 30 days',
        thisMonth: 'This month',
        noResults: 'No applications found',
        noResultsMessage: 'Try adjusting your filters or search terms to find what you\'re looking for.',
        hideEmptyColumns: 'Hide empty columns',
        showEmptyColumns: 'Show empty columns'
      },
      viewDetails: 'View Details',
      emptyColumns: {
        RESEARCH: 'Start exploring opportunities!',
        TO_APPLY: 'Add jobs you want to apply for.',
        APPLIED: 'Submit your first application!',
        INTERVIEW: 'Interviews coming your way!',
        OFFER: 'No offers yet. Keep pushing!',
        REJECTED: 'Every no gets you closer to yes.',
      }
    },
    toggleTheme: "Toggle Dark Mode",
    toggleMenu: "Toggle Mobile Menu",
    dashboard: {
      total: "Total Applications",
      active: "Active Pipeline",
      interviews: "Interviews",
      funnel: "Application Funnel",
      title: "Statistics",
      subtitle: "Track your job search progress",
      thisWeek: "this week",
      applicationsOverTime: "Applications Over Time",
      recentActivity: "Recent Activity",
      noActivity: "No recent activity"
    },
    modal: {
      interviews: "Interview Rounds",
      addInterview: "Add Interview Round"
    },
    timeline: {
      title: "Application Timeline",
      filters: "Filters",
      allEvents: "All Events",
      eventTypes: {
        jobAdded: "Job Added",
        jobApplied: "Applied",
        statusChanged: "Status Changed",
        interviewScheduled: "Interview Scheduled",
        interviewCompleted: "Interview Completed",
        awaitingFeedback: "Awaiting Feedback"
      },
      noEvents: "No events to display",
      viewOnBoard: "View on Board"
    },
    interviewRound: {
      roundName: "Round Name",
      roundNamePlaceholder: "e.g., Phone Screen, Technical Interview",
      interviewDate: "Interview Date",
      startTime: "Start Time",
      endTime: "End Time",
      status: "Status",
      notes: "Notes",
      meetingLink: "Meeting Link",
      addToCalendar: "Add to Google Calendar",
      statuses: {
        scheduled: "Scheduled",
        completed: "Completed",
        awaiting_feedback: "Awaiting Feedback"
      },
      delete: "Delete Round",
      deleteConfirm: "Delete this interview round?"
    },
    errors: {
      addInterviewFailed: "Failed to add interview round. Please try again.",
      updateInterviewFailed: "Failed to update interview round. Please try again.",
      deleteInterviewFailed: "Failed to delete interview round. Please try again."
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
      footer: "Geschützt durch CareerTrack Security",
      emailPlaceholder: "E-Mail-Adresse eingeben",
      sendMagicLink: "Magic Link senden",
      sending: "Wird gesendet...",
      securedBy: "Gesichert durch Supabase Auth",
      checkEmail: "E-Mail prüfen!",
      checkEmailMessage: "Wir haben einen Magic Link an",
      checkEmailAction: "gesendet. Klicke darauf, um dich anzumelden.",
      errorSendingLink: "Fehler beim Senden des Magic Links"
    },
    nav: {
      schedule: "Tagesplan",
      board: "Bewerbungen",
      timeline: "Timeline",
      stats: "Statistik",
      subtitle: "Jobsuche Planer",
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
      moveStage: "In nächste Phase verschieben",
      openLink: "Link öffnen",
      exportCSV: "Excel Export",
      newOpp: "Neue Chance hinzufügen",
      save: "Speichern",
      cancel: "Abbrechen",
      close: "Schließen",
      edit: "Bearbeiten",
      deleteTitle: "Job löschen?",
      deleteMessage: "Möchtest du die Bewerbung für {position} bei {company} wirklich unwiderruflich löschen?",
      confirmDelete: "Löschen",
      interview: "Interview",
      interviews: "Interviews",
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
        location: "Ort",
        salary: "Gehalt",
        link: "Link",
        notes: "Notizen",
        dateAdded: "Hinzugefügt",
        lastUpdated: "Aktualisiert",
        interviewRound: "Interview-Runde",
        interviewDate: "Interview-Datum",
        interviewStart: "Startzeit",
        interviewEnd: "Endzeit",
        interviewStatus: "Interview-Status",
        interviewNotes: "Interview-Notizen",
        interviewMeetingLink: "Meeting-Link"
      },
      status: {
        [ApplicationStatus.RESEARCH]: 'Recherche',
        [ApplicationStatus.TO_APPLY]: 'Zu bewerben',
        [ApplicationStatus.APPLIED]: 'Beworben',
        [ApplicationStatus.INTERVIEW]: 'Interview',
        [ApplicationStatus.OFFER]: 'Angebot',
        [ApplicationStatus.REJECTED]: 'Abgelehnt'
      },
      filters: {
        status: 'Filter',
        allStatuses: 'Alle',
        search: 'Suche',
        searchPlaceholder: 'Suche nach Firma, Position, Ort, Notizen...',
        sortBy: 'Sortieren nach',
        sortOptions: {
          dateAddedDesc: 'Hinzugefügt (neueste)',
          dateAddedAsc: 'Hinzugefügt (älteste)',
          lastUpdatedDesc: 'Aktualisiert (neueste)',
          lastUpdatedAsc: 'Aktualisiert (älteste)',
          companyAsc: 'Firma (A–Z)',
          companyDesc: 'Firma (Z–A)',
          positionAsc: 'Position (A–Z)',
          positionDesc: 'Position (Z–A)'
        },
        reset: 'Alle Filter zurücksetzen',
        clearAll: 'Alle Filter löschen',
        activeFilters: 'Aktive Filter:',
        showing: 'Zeige',
        of: 'von',
        applications: 'Bewerbungen',
        last7Days: 'Letzte 7 Tage',
        last30Days: 'Letzte 30 Tage',
        thisMonth: 'Dieser Monat',
        noResults: 'Keine Bewerbungen gefunden',
        noResultsMessage: 'Versuche, deine Filter oder Suchbegriffe anzupassen, um zu finden, wonach du suchst.',
        hideEmptyColumns: 'Leere Spalten ausblenden',
        showEmptyColumns: 'Leere Spalten anzeigen'
      },
      viewDetails: 'Details anzeigen',
      emptyColumns: {
        RESEARCH: 'Entdecke neue Möglichkeiten!',
        TO_APPLY: 'Füge Jobs hinzu, auf die du dich bewerben willst.',
        APPLIED: 'Reiche deine erste Bewerbung ein!',
        INTERVIEW: 'Interviews kommen auf dich zu!',
        OFFER: 'Noch keine Angebote. Bleib dran!',
        REJECTED: 'Jedes Nein bringt dich näher ans Ja.',
      }
    },
    toggleTheme: "Design wechseln",
    toggleMenu: "Mobiles Menü umschalten",
    dashboard: {
      total: "Bewerbungen Gesamt",
      active: "Aktive Pipeline",
      interviews: "Interviews",
      funnel: "Bewerbungstrichter",
      title: "Statistik",
      subtitle: "Verfolge deinen Bewerbungsfortschritt",
      thisWeek: "diese Woche",
      applicationsOverTime: "Bewerbungen im Zeitverlauf",
      recentActivity: "Letzte Aktivitäten",
      noActivity: "Keine Aktivitäten"
    },
    modal: {
      interviews: "Interview-Runden",
      addInterview: "Interview-Runde hinzufügen"
    },
    timeline: {
      title: "Bewerbungs-Zeitstrahl",
      filters: "Filter",
      allEvents: "Alle Ereignisse",
      eventTypes: {
        jobAdded: "Job hinzugefügt",
        jobApplied: "Beworben",
        statusChanged: "Status geändert",
        interviewScheduled: "Interview geplant",
        interviewCompleted: "Interview abgeschlossen",
        awaitingFeedback: "Warte auf Rückmeldung"
      },
      noEvents: "Keine Ereignisse anzuzeigen",
      viewOnBoard: "Auf Board anzeigen"
    },
    interviewRound: {
      roundName: "Runden-Name",
      roundNamePlaceholder: "z.B. Telefoninterview, Technisches Interview",
      interviewDate: "Interview-Datum",
      startTime: "Startzeit",
      endTime: "Endzeit",
      status: "Status",
      notes: "Notizen",
      meetingLink: "Meeting-Link",
      addToCalendar: "In Google Kalender eintragen",
      statuses: {
        scheduled: "Geplant",
        completed: "Abgeschlossen",
        awaiting_feedback: "Warte auf Rückmeldung"
      },
      delete: "Runde löschen",
      deleteConfirm: "Diese Interview-Runde löschen?"
    },
    errors: {
      addInterviewFailed: "Interview-Runde konnte nicht hinzugefügt werden. Bitte erneut versuchen.",
      updateInterviewFailed: "Interview-Runde konnte nicht aktualisiert werden. Bitte erneut versuchen.",
      deleteInterviewFailed: "Interview-Runde konnte nicht gelöscht werden. Bitte erneut versuchen."
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
    description: 'Scan job boards (LinkedIn, Stepstone). Analyze job fit and requirements. Read descriptions thoroughly.',
    category: 'Research',
    isFixed: false
  },
  {
    id: '2',
    startTime: '10:00',
    endTime: '12:00',
    title: 'Deep Work: Applications',
    description: 'Tailor CV/Resume. Write specific cover letters highlighting relevant skills and experience.',
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
    description: 'Online courses, professional certificates, or tool training relevant to your target roles.',
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
    description: 'Jobbörsen scannen (LinkedIn, Stepstone). Passgenauigkeit und Anforderungen prüfen. Beschreibungen gründlich lesen.',
    category: 'Research',
    isFixed: false
  },
  {
    id: '2',
    startTime: '10:00',
    endTime: '12:00',
    title: 'Fokusarbeit: Bewerbungen',
    description: 'Lebenslauf anpassen. Spezifische Anschreiben verfassen, die relevante Fähigkeiten und Erfahrungen hervorheben.',
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
    description: 'Online-Kurse, professionelle Zertifikate oder Tool-Training relevant für Ihre Zielrollen.',
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

export const STATUS_COUNT_COLORS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.RESEARCH]: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  [ApplicationStatus.TO_APPLY]: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  [ApplicationStatus.APPLIED]: 'bg-primary/20 text-primary dark:border dark:border-primary/30',
  [ApplicationStatus.INTERVIEW]: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
  [ApplicationStatus.OFFER]: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  [ApplicationStatus.REJECTED]: 'bg-slate-200 dark:bg-slate-800 text-slate-500',
};

export const MOCK_JOBS: JobApplication[] = [
  {
    id: 'j1',
    company: 'TechCorp GmbH',
    position: 'Junior Project Manager',
    location: 'Berlin (Remote)',
    status: ApplicationStatus.APPLIED,
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
    dateAdded: '2023-10-28',
    lastUpdated: '2023-10-28',
    notes: 'Looks interesting, need to check funding.',
    salary: 'Unknown'
  }
];