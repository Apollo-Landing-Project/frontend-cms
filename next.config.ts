import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
				port: "5000", // The port your backend is running on
				pathname: "/**", // Allow all paths
			},
			{
				protocol: "https",
				hostname: "api.evaluasipembelajaran.site",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "api.apolloglobalinteractive.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "evaluasipembelajaran.site",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "apolloglobalinteractive.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "storage.apolloglobalinteractive.com",
				port: "",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
