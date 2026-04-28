/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  transpilePackages: ["@finance/db"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["@prisma/client"],
  outputFileTracingIncludes: {
    "**": [
      "node_modules/.pnpm/**/libquery_engine-rhel-openssl-3.0.x.so.node",
      "node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/schema.prisma",
    ],
  },
};

module.exports = nextConfig;
