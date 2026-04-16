import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

const INACTIVITY_LIMIT = 4 * 60 * 60 * 1000; // 4 jam dalam ms

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);

    const logout = useCallback(async () => {
        clearTimeout(timerRef.current);
        await supabase.auth.signOut();
    }, []);

    const resetTimer = useCallback(() => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) logout();
            });
        }, INACTIVITY_LIMIT);
    }, [logout]);

    // Track aktivitas user
    useEffect(() => {
        const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
        const handler = () => {
            if (user) resetTimer();
        };
        events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
        return () => events.forEach((e) => window.removeEventListener(e, handler));
    }, [user, resetTimer]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) resetTimer();
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user ?? null);
            if (session?.user) resetTimer();
            else clearTimeout(timerRef.current);
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(timerRef.current);
        };
    }, [resetTimer]);

    return { user, loading, logout };
};
