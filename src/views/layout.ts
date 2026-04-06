export function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — criteria.agency</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            criteria: {
              black: '#0a0a0a',
              dark: '#141414',
              gray: '#1e1e1e',
              border: '#2a2a2a',
              muted: '#666666',
              text: '#a0a0a0',
              light: '#e0e0e0',
              white: '#fafafa',
              accent: '#f59e0b',
            }
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body class="bg-criteria-black text-criteria-light min-h-screen">
  ${body}
</body>
</html>`;
}

export function errorPage(title: string, message: string): string {
  return layout(
    title,
    `
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center max-w-md px-6">
        <h1 class="text-2xl font-bold text-criteria-white mb-4">${title}</h1>
        <p class="text-criteria-muted mb-8">${message}</p>
        <a href="/" class="text-criteria-accent hover:underline">Volver al inicio</a>
      </div>
    </div>
    `,
  );
}
