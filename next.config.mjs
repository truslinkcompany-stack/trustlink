/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp"],
  // Шрифт для PDF должен попасть в serverless-бандл на Vercel
  outputFileTracingIncludes: {
    "/api/records/[id]/pdf": ["./public/fonts/**/*"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // камера и геолокация нужны только нашей странице
          { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
