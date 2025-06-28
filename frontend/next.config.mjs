/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/chat',
        destination: 'http://localhost:8000/chat', // Proxy to your backend
      },
    ];
  },
};

export default nextConfig;
