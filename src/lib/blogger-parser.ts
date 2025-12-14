export interface Post {
  id: string;
  title: string;
  excerpt: string;
  published_at: string;
  url: string;
  image_url: string;
}

interface BloggerEntry {
  id: { $t: string };
  title: { $t: string };
  published: { $t: string };
  summary?: { $t: string };
  content?: { $t: string };
  link: Array<{ rel: string; type?: string; href: string }>;
  media$thumbnail?: { url: string };
}

interface BloggerFeed {
  feed: {
    entry?: BloggerEntry[];
  };
}

const extractImageFromHtml = (html: string): string | null => {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const match = html.match(imgRegex);
  return match ? match[1] : null;
};

const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim();
};

export async function fetchAndParseBloggerPosts(feedUrl: string): Promise<Post[]> {
  const response = await fetch(feedUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Blogger feed: ${response.status}`);
  }

  const data: BloggerFeed = await response.json();

  if (!data.feed.entry) {
    return [];
  }

  return data.feed.entry.map((entry) => {
    const alternateLink = entry.link.find(
      (l) => l.rel === 'alternate' && l.type === 'text/html'
    );

    let imageUrl = '';
    
    // Try media$thumbnail first
    if (entry.media$thumbnail?.url) {
      imageUrl = entry.media$thumbnail.url;
    } else {
      // Try to extract from content or summary
      const htmlContent = entry.content?.$t || entry.summary?.$t || '';
      const extractedImage = extractImageFromHtml(htmlContent);
      if (extractedImage) {
        imageUrl = extractedImage;
      }
    }

    const rawExcerpt = entry.summary?.$t || entry.content?.$t || '';
    const excerpt = stripHtmlTags(rawExcerpt).substring(0, 150) + '...';

    return {
      id: entry.id.$t,
      title: entry.title.$t,
      excerpt,
      published_at: entry.published.$t,
      url: alternateLink?.href || '#',
      image_url: imageUrl,
    };
  });
}
