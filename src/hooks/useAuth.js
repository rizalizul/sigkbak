import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000; // 2 jam

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);
    const throttleRef = useRef(null); 

    const logout = useCallback(async () => {
        clearTimeout(timerRef.current);
        localStorage.removeItem("last_activity");
        
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.warn("Logout timeout/error diabaikan:", error);
        }
    }, []);

    const resetTimer = useCallback(() => {
        clearTimeout(timerRef.current);
        
        // CATAT WAKTU SEKARANG KE LOCAL STORAGE
        localStorage.setItem("last_activity", Date.now().toString());

        timerRef.current = setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    alert("Sesi berakhir karena tidak ada aktivitas.");
                    logout();
                }
            });
        }, INACTIVITY_LIMIT);
    }, [logout]);

    // Track aktivitas user
    useEffect(() => {
        if (!user) return; 

        const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
        
        const handler = () => {
            if (!throttleRef.current) {
                resetTimer();
                throttleRef.current = setTimeout(() => {
                    throttleRef.current = null;
                }, 5000); 
            }
        };

        events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
        
        return () => {
            events.forEach((e) => window.removeEventListener(e, handler));
            if (throttleRef.current) clearTimeout(throttleRef.current);
        };
    }, [user, resetTimer]);

    // PENGECEKAN SAAT WEB BARU DIBUKA
    useEffect(() => {
        const checkSession = async () => {
            // 1. Cek apakah ada catatan waktu terakhir
            const lastActivity = localStorage.getItem("last_activity");
            
            if (lastActivity) {
                // Hitung selisih waktu sekarang dengan waktu terakhir
                const timePassed = Date.now() - parseInt(lastActivity, 10);
                
                if (timePassed > INACTIVITY_LIMIT) {
                    setLoading(false);
                    logout();
                    return;
                }
            }

            supabase.auth.getSession().then(({ data: { session } }) => {
                setUser(session?.user ?? null);
                if (session?.user) resetTimer();
                setLoading(false);
            });
        };

        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            if (event === 'SIGNED_IN' && session?.user) {
                resetTimer();
            } else if (!session?.user) {
                clearTimeout(timerRef.current);
                localStorage.removeItem("last_activity");
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(timerRef.current);
        };
    }, [resetTimer, logout]);

    return { user, loading, logout };
};
