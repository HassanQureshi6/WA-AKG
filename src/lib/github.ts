
export async function getLatestRelease(owner: string, repo: string) {
    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
            headers: {
                "Accept": "application/vnd.github+json",
                "User-Agent": "WA-AKG-System"
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        
        if (!res.ok) return null;
        
        const data = await res.json();
        return {
            tag_name: data.tag_name, // e.g. v1.0.1
            name: data.name,
            html_url: data.html_url,
            body: data.body,
            published_at: data.published_at
        };
    } catch (e) {
        console.error("Error fetching GitHub release:", e);
        return null;
    }
}
