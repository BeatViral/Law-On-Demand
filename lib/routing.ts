export const appBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const isStaticDemo = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

export function appPath(path: string) {
  if (!appBasePath) return path;
  if (path === "/") return `${appBasePath}/`;
  return `${appBasePath}${path.startsWith("/") ? path : `/${path}`}`;
}
