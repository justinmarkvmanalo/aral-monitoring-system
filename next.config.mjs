/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  async redirects() {
    return [
      { source: '/index.php', destination: '/', permanent: true },
      { source: '/login.php', destination: '/teacher/login', permanent: true },
      { source: '/register_teacher.php', destination: '/teacher/register', permanent: true },
      { source: '/dashboard.php', destination: '/teacher/dashboard', permanent: true },
      { source: '/setup_section.php', destination: '/teacher/setup', permanent: true },
      { source: '/logout.php', destination: '/teacher/logout', permanent: true },
      { source: '/admin_login.php', destination: '/admin/login', permanent: true },
      { source: '/admin_dashboard.php', destination: '/admin/dashboard', permanent: true },
      { source: '/admin_logout.php', destination: '/admin/logout', permanent: true }
    ];
  }
};

export default nextConfig;
