/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  transpilePackages: ["@finance/db"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["@prisma/client", "@finance/db"],
};

module.exports = nextConfig;
