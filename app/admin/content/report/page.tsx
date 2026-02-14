"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportList from "@/components/pages/report/ReportList";
import ReportCategoryList from "@/components/pages/report/ReportCategoryList";

export default function page() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/>
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem className="hidden md:block">
									<BreadcrumbLink href="/admin">Beranda</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem className="hidden md:block">
									<BreadcrumbLink href="/admin/content">Content</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage>Reports</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</header>
				{/* Tengahkan div dibawah */}
				<div className="p-6 md:px-24 md:py-12 w-full space-y-8">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
						<div>
							<h1 className="text-3xl font-bold tracking-tight text-slate-900">
								Reports & Investor Relations
							</h1>
							<p className="text-slate-500 mt-1">
								Manage financial reports, sustainability reports, and other
								documents.
							</p>
						</div>
					</div>
					<Tabs defaultValue="reports" className="w-full">
						<TabsList className="mb-4">
							<TabsTrigger value="reports">All Reports</TabsTrigger>
							<TabsTrigger value="categories">Categories</TabsTrigger>
						</TabsList>
						<TabsContent value="reports">
							<ReportList />
						</TabsContent>
						<TabsContent value="categories">
							<ReportCategoryList />
						</TabsContent>
					</Tabs>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
