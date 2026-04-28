/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["iyzipay"],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/iyzipay/lib/resources/**/*",
      "./node_modules/iyzipay/lib/requests/**/*",
      "./node_modules/iyzipay/lib/IyzipayResource.js",
      "./node_modules/iyzipay/lib/utils.js"
    ],
  },
};

export default nextConfig;
