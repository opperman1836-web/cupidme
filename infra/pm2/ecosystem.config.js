module.exports = {
  apps: [
    {
      name: 'cupidme-api',
      cwd: './apps/api',
      script: 'dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        API_PORT: 4000,
      },
      max_memory_restart: '512M',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
    },
    {
      name: 'cupidme-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '512M',
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
    },
  ],
};
