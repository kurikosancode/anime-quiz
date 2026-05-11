import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll multiple possible containers to the top
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Also try scrolling the main element if it exists
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.scrollTop = 0;
        }
    }, [pathname]);

    return null;
}
