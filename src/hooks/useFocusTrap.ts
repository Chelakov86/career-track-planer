import { useEffect } from 'react';

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(containerRef: { current: HTMLElement | null }, active: boolean) {
    useEffect(() => {
        const container = containerRef.current;
        if (!active || !container) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;

        const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
        const first = () => getFocusable()[0];
        const last = () => getFocusable()[getFocusable().length - 1];

        first()?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            const items = getFocusable();
            if (items.length === 0) return;
            const f = items[0];
            const l = items[items.length - 1];
            if (e.shiftKey && document.activeElement === f) {
                e.preventDefault();
                l.focus();
            } else if (!e.shiftKey && document.activeElement === l) {
                e.preventDefault();
                f.focus();
            }
        };

        container.addEventListener('keydown', onKeyDown);
        return () => {
            container.removeEventListener('keydown', onKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [active, containerRef]);
}
