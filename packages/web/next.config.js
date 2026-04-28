const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@finance/db"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["@prisma/client"],

  experimental: {
    outputFileTracingIncludes: {
      "**": [
        "./node_modules/.prisma/client/**",
        "./node_modules/@prisma/client/**",
      ],
    },
  },
};

module.exports = nextConfig;