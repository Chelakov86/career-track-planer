import { Page, expect } from '@playwright/test';

/**
 * Default language is DE. These are common German translation strings
 * used across tests to assert visible UI text.
 */
export const DE = {
    login: {
        title: 'Willkommen zurück',
        subtitle: 'Melde dich an, um deine Karriereplanung fortzusetzen.',
        sendMagicLink: 'Magic Link senden',
        emailPlaceholder: 'E-Mail-Adresse eingeben',
        securedBy: 'Gesichert durch Supabase Auth',
        footer: 'Geschützt durch CareerTrack Security',
        languageLabel: 'Sprache',
    },
    nav: {
        board: 'Bewerbungen',
        timeline: 'Timeline',
        schedule: 'Tagesplan',
        stats: 'Statistik',
        subtitle: 'Jobsuche Planer',
        logout: 'Abmelden',
    },
    board: {
        title: 'Bewerbungstracker',
        subtitle: 'Visualisiere deinen Bewerbungsprozess.',
        addJob: 'Bewerbung hinzufügen',
        exportCSV: 'CSV-Export',
        moreActions: 'Mehr',
        moreActionsTitle: 'Weitere Aktionen',
        backToTop: 'Nach oben',
        showLess: 'Weniger anzeigen',
        save: 'Speichern',
        cancel: 'Abbrechen',
        close: 'Schließen',
        edit: 'Bearbeiten',
        editJob: 'Bewerbung bearbeiten',
        moveTo: 'Verschieben nach...',
        deleteTitle: 'Bewerbung löschen?',
        confirmDelete: 'Löschen',
        deleteJob: 'Bewerbung löschen',
        viewDetails: 'Details anzeigen',
        columns: ['Recherche', 'Zu bewerben', 'Beworben', 'Interview', 'Angebot', 'Abgelehnt'],
        filter: 'Filter',
        sort: 'Sortieren nach',
        viewJob: 'Bewerbung anzeigen',
        placeholders: {
            company: 'Firma',
            position: 'Position',
            location: 'Ort (z.B. Remote)',
            salary: 'Gehalt (z.B. 60k)',
            link: 'Link zur Stelle',
            notes: 'Notizen & Gedanken...',
        },
    },
    dashboard: {
        title: 'Statistik',
        subtitle: 'Verfolge deinen Bewerbungsfortschritt',
        total: 'Bewerbungen Gesamt',
        active: 'Aktive Pipeline',
        interviews: 'Interviews',
        funnel: 'Bewerbungstrichter',
        analyticsTitle: 'Bewerbungsanalyse',
        period: 'Zeitraum',
        grain: 'Auflösung',
        periodPresets: {
            thisWeek: 'Diese Woche',
            last4Weeks: 'Letzte 4 Wochen',
            last8Weeks: 'Letzte 8 Wochen',
            last3Months: 'Letzte 3 Monate',
            thisYear: 'Dieses Jahr',
            allTime: 'Gesamter Zeitraum',
            custom: 'Benutzerdefinierter Zeitraum',
        },
        from: 'Von',
        to: 'Bis',
        day: 'Tag',
        week: 'Woche',
        month: 'Monat',
        added: 'Hinzugefügt',
        applied: 'Beworben',
        rejected: 'Abgelehnt',
        interviewsSeries: 'Interviews',
        periodTotals: 'Summen im Zeitraum',
        rejectionDepth: 'Ablehnungen nach Interview-Runden',
        zeroRounds: '0 Runden',
        oneRound: '1 Runde',
        twoRounds: '2 Runden',
        threePlusRounds: '3+ Runden',
        recentActivity: 'Letzte Aktivitäten',
        jobsInPeriod: 'Bewerbungen im Zeitraum',
        noApplicationDataInPeriod: 'Keine Bewerbungsdaten in diesem Zeitraum',
    },
    timeline: {
        title: 'Bewerbungs-Zeitstrahl',
        noEvents: 'Keine Ereignisse anzuzeigen',
        eventTypes: {
            jobAdded: 'Job hinzugefügt',
            jobRejected: 'Abgelehnt',
            interviewScheduled: 'Interview geplant',
            interviewCompleted: 'Interview abgeschlossen',
            awaitingFeedback: 'Warte auf Rückmeldung',
        },
    },
    schedule: {
        title: 'Tagesablauf',
        subtitle: 'Strukturierte Blöcke für maximale Produktivität.',
        export: 'Alles exportieren (.ics)',
        addToCal: 'Kalender',
        getFocus: 'Fokus starten',
    },
    toggleTheme: 'Design wechseln',
} as const;

export const EN = {
    login: {
        title: 'Welcome Back',
    },
    nav: {
        board: 'Application Board',
        timeline: 'Timeline',
        schedule: 'Daily Schedule',
        stats: 'Analytics',
    },
    board: {
        title: 'Job Tracker',
        columns: ['Research', 'To Apply', 'Applied', 'Interview', 'Offer', 'Rejected'],
    },
    dashboard: {
        title: 'Statistics',
        analyticsTitle: 'Application Analytics',
        jobsInPeriod: 'Jobs in this period',
        added: 'Added',
    },
    timeline: {
        title: 'Application Timeline',
    },
    schedule: {
        title: 'Daily Routine',
    },
} as const;

/** Wait for the app to finish loading (spinner gone, board/page visible) */
export async function waitForAppLoad(page: Page) {
    // Wait for the loading spinner to disappear
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {
        // spinner might already be gone
    });
    // Wait for the main content to be visible
    await page.waitForTimeout(500);
}

/** Navigate and wait for load */
export async function navigateTo(page: Page, path: string) {
    await page.goto(path);
    await waitForAppLoad(page);
}
