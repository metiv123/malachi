export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/beta/status') {
      try {
        const response = await fetch('https://malachi-v78v.onrender.com/api/beta/status', {
          headers: { accept: 'application/json' }
        });
        const current = await response.json();
        const maxFamilies = 100;
        const used = Math.max(0, Number(current.used || 0));
        return Response.json({
          open: used < maxFamilies,
          maxFamilies,
          used,
          remaining: Math.max(0, maxFamilies - used),
          waitlist: Number(current.waitlist || 0)
        });
      } catch (_error) {
        return Response.json({ open: true, maxFamilies: 100, used: 0, remaining: 100, waitlist: 0 });
      }
    }
    return env.ASSETS.fetch(request);
  }
};
