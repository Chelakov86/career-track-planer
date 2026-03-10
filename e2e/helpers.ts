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
        addJob: 'Job hinzufügen',
        exportCSV: 'Excel Export',
        save: 'Speichern',
        cancel: 'Abbrechen',
        close: 'Schließen',
        edit: 'Bearbeiten',
        deleteTitle: 'Job löschen?',
        confirmDelete: 'Löschen',
        viewDetails: 'Details anzeigen',
        columns: ['Recherche', 'Zu bewerben', 'Beworben', 'Interview', 'Angebot', 'Abgelehnt'],
        filter: 'Filter',
        sort: 'Sortieren nach',
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
        applicationsOverTime: 'Bewerbungen im Zeitverlauf',
        recentActivity: 'Letzte Aktivitäten',
    },
    timeline: {
        title: 'Bewerbungs-Zeitstrahl',
        noEvents: 'Keine Ereignisse anzuzeigen',
        eventTypes: {
            jobAdded: 'Job hinzugefügt',
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
