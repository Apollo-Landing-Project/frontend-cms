"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useUserStore } from "@/store/setUserStore";

import {
	Info,
	History,
	Users,
	Building2,
	Car,
	Key,
	Wrench,
	Search,
	TrendingUp,
	FileDown,
	Newspaper,
	Heart,
	MapPin,
	Mail,
	LayoutDashboard,
} from "lucide-react";

const data = {
	navMain: [
		{
			title: "Profil Perusahaan",
			url: "/admin/profil",
			icon: Info,
			isActive: true,
			items: [
				{ title: "Visi & Misi", url: "/admin/profil/visi-misi" },
				{
					title: "Struktur Organisasi",
					url: "/admin/profil/struktur",
					icon: Users,
				},
				{
					title: "Afiliasi Grup",
					url: "/admin/profil/afiliasi",
					icon: Building2,
				},
				{ title: "Sejarah", url: "/admin/profil/sejarah", icon: History },
			],
		},
		{
			title: "Layanan & Produk",
			url: "/admin/services",
			icon: Car,
			items: [
				{ title: "Dealer Mobil Baru", url: "/admin/services/new-cars" },
				{ title: "Penyewaan Mobil", url: "/admin/services/rental", icon: Key },
				{
					title: "Pusat Servis",
					url: "/admin/services/service-center",
					icon: Wrench,
				},
				{
					title: "Katalog Mobil Bekas",
					url: "/admin/services/used-cars",
					icon: Search,
				},
			],
		},
		{
			title: "Hubungan Investor",
			url: "/admin/investor",
			icon: TrendingUp,
			items: [
				{ title: "Market Data", url: "/admin/investor/market-data" },
				{
					title: "Pusat Unduhan (PDF)",
					url: "/admin/investor/downloads",
					icon: FileDown,
				},
				{
					title: "Investor News",
					url: "/admin/investor/news",
					icon: Newspaper,
				},
			],
		},
		{
			title: "Berita & Kegiatan",
			url: "/admin/news",
			icon: Newspaper,
			items: [
				{ title: "Artikel Umum", url: "/admin/news/articles" },
				{ title: "CSR", url: "/admin/news/csr", icon: Heart },
			],
		},
		{
			title: "Hubungi Kami",
			url: "/admin/contact",
			icon: Mail,
			items: [
				{ title: "Store Locator", url: "/admin/contact/maps", icon: MapPin },
				{ title: "Formulir Kontak", url: "/admin/contact/form" },
			],
		},
	],
	// Bisa digunakan untuk akses cepat ke fitur tertentu
	projects: [
		{
			name: "Dashboard Utama",
			url: "/admin/beranda",
			icon: LayoutDashboard,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const user = useUserStore((state) => state.user);

	const userData = {
		name: user?.name || "Loading...",
		email: user?.email || "",
		avatar: user?.avatar || "/default-avatar.png",
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
