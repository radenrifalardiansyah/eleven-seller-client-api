export default function Page() {
  const endpoints = [
    { method: "POST", path: "/api/auth/register" },
    { method: "POST", path: "/api/auth/login" },
    { method: "POST", path: "/api/auth/logout" },
    { method: "GET",  path: "/api/auth/me" },
    { method: "GET|POST",        path: "/api/products" },
    { method: "GET|PUT|DELETE",  path: "/api/products/[id]" },
    { method: "GET|POST",        path: "/api/products/[id]/images" },
    { method: "DELETE",          path: "/api/products/[id]/images/[imageId]" },
    { method: "GET|POST",        path: "/api/categories" },
    { method: "GET|PUT|DELETE",  path: "/api/categories/[id]" },
    { method: "GET",             path: "/api/orders" },
    { method: "GET|PUT",         path: "/api/orders/[id]" },
    { method: "GET|POST|PUT",    path: "/api/orders/[id]/return" },
    { method: "GET|POST",        path: "/api/customers" },
    { method: "GET|PUT",         path: "/api/customers/[id]" },
    { method: "GET|PUT",         path: "/api/store" },
    { method: "GET",             path: "/api/store/stats" },
    { method: "GET|POST",        path: "/api/notifications" },
    { method: "PUT",             path: "/api/notifications/[id]" },
    { method: "GET|POST",        path: "/api/vouchers" },
    { method: "GET|PUT|DELETE",  path: "/api/vouchers/[id]" },
    { method: "GET|POST",        path: "/api/resellers" },
    { method: "GET|PUT",         path: "/api/resellers/[id]" },
    { method: "GET|POST",        path: "/api/inventory" },
  ];

  return (
    <html lang="id">
      <head>
        <title>LapaKoo API</title>
        <style>{`
          body { font-family: monospace; background: #0f0f0f; color: #e5e5e5; padding: 2rem; }
          h1 { color: #a78bfa; margin-bottom: 0.25rem; }
          p  { color: #71717a; margin-top: 0; margin-bottom: 2rem; }
          table { border-collapse: collapse; width: 100%; max-width: 640px; }
          td { padding: 0.4rem 0.75rem; border-bottom: 1px solid #1f1f1f; font-size: 0.875rem; }
          td:first-child { color: #34d399; width: 160px; }
          td:last-child  { color: #93c5fd; }
        `}</style>
      </head>
      <body>
        <h1>LapaKoo API</h1>
        <p>v1.0.0 — All routes require Authorization except /auth/register and /auth/login</p>
        <table>
          <tbody>
            {endpoints.map((e) => (
              <tr key={e.path}>
                <td>{e.method}</td>
                <td>{e.path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </body>
    </html>
  );
}
