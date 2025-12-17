module.exports = {
  apps: [
    {
      name: 'frontend-polyclinique',
      script: 'npm',
      args: 'run start:prod',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5008,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5008,
        HOST: '0.0.0.0'
      },
      // Options de redémarrage
      watch: false,
      max_memory_restart: '512M',
      // Gestion des erreurs et logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      // Options de redémarrage automatique
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // Variables d'environnement supplémentaires
      merge_logs: true,
      // Ignorer les fichiers à surveiller
      ignore_watch: [
        'node_modules',
        'logs',
        'dist',
        '.git',
        '*.log',
        'public'
      ],
      // Attendre que le processus soit prêt
      wait_ready: false,
      listen_timeout: 10000,
      // Options de monitoring
      pmx: true
    }
  ]
};
