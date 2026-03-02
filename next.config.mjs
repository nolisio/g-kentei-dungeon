const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const useGithubPagesBasePath = process.env.GITHUB_ACTIONS === "true" && repoName;

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  basePath: useGithubPagesBasePath ? `/${repoName}` : "",
  assetPrefix: useGithubPagesBasePath ? `/${repoName}/` : "",
};

export default nextConfig;
