/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.GITHUB_PAGES === "true" ? "/Law-On-Demand" : "";

const nextConfig = {
  output: isStaticExport ? "export" : undefined,
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  experimental: {
    typedRoutes: false
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC_EXPORT: isStaticExport ? "true" : "false"
  }
};

export default nextConfig;
