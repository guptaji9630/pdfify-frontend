import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name?: string;
    subscription?: {
        plan: 'FREE' | 'PRO' | 'BUSINESS';
        status: string;
        currentPeriodEnd?: string;
    };
}

interface AuthStore {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;

    setAuth: (user: User, token: string) => void;
    /** Refresh user data in store (e.g. after plan upgrade) without changing the token */
    updateUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (user, token) => {
                localStorage.setItem('token', token);
                set({ user, token, isAuthenticated: true });
            },

            updateUser: (user) => {
                set({ user });
            },

            logout: () => {
                localStorage.removeItem('token');
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
