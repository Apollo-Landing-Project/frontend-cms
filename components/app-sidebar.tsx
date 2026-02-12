"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useUserStore } from "@/store/setUserStore";

import {
	Info,
	Car,
	TrendingUp,
	Newspaper,
	Heart,
	LayoutDashboard,
	FileText,
	Settings,
	Send,
	BookPlus,
} from "lucide-react";

const data = {
	navMain: [
		// =========================
		// HALAMAN
		// =========================
		{
			title: "Halaman Website",
			url: "/admin/pages",
			icon: Info,
			items: [
				{ title: "Home", url: "/admin/pages/home" },
				{ title: "About Us", url: "/admin/pages/about-us" },
				{ title: "Our Service", url: "/admin/pages/service" },
				{ title: "News", url: "/admin/pages/news" },
				{ title: "Investor", url: "/admin/pages/investor" },
				{ title: "Footer", url: "/admin/pages/footer" },
			],
		},

		// =========================
		// CONTENT
		// =========================
		{
			title: "Manajemen Konten",
			url: "/admin/content",
			icon: FileText,
			items: [
				{
					title: "Services Items",
					url: "/admin/content/services-items",
					icon: Car,
				},
				{
					title: "Car Gallery",
					url: "/admin/content/car-gallery",
					icon: BookPlus,
				},
				{
					title: "News (Artikel)",
					url: "/admin/content/news",
					icon: Newspaper,
				},
				{
					title: "News (CSR)",
					url: "/admin/content/csr",
					icon: Heart,
				},
				{
					title: "Report / Investor",
					url: "/admin/content/report",
					icon: TrendingUp,
				},
			],
		},

		// =========================
		// SYSTEM
		// =========================
		{
			title: "Pengaturan",
			url: "/admin/settings",
			icon: Settings,
			items: [
				{ title: "User Management", url: "/admin/settings/users" },
				{ title: "Role & Akses", url: "/admin/settings/roles" },
			],
		},
	],

	projects: [
		{
			name: "Dashboard Utama",
			url: "/admin",
			icon: LayoutDashboard,
		},
		{
			name: "Landing Page",
			url: "https://apolloglobalinteractive.com",
			icon: Send,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const user = useUserStore((state) => state.user);

	const userData = {
		name: user?.name || "Loading...",
		email: user?.email || "",
		avatar:
			user?.avatar ||
			"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbm6QhXf5jqRZcX6R-lNF9sgaYnR0jtHKh0A&s",
	};

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavProjects projects={data.projects} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={userData} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
