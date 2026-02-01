import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
	user: {
		name: string;
		email: string;
		avatar: string;
	} | null;
	setUser: (userData: any) => void;
	clearUser: () => void;
}

export const useUserStore = create<UserState>()(
	persist(
		(set) => ({
			user: null,
			setUser: (data) =>
				set({
					user: {
						name: data.name,
						email: data.email,
						avatar: data.profile_image,
					},
				}),
			clearUser: () => set({ user: null }),
		}),
		{ name: "user-storage" }, // Ini otomatis simpan ke localStorage
	),
);
