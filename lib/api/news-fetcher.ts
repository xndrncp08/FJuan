// F1 News fetcher using RSS feeds
export interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  image?: string;
}

async function parseRSSFeed(url: string, source: string): Promise<NewsArticle[]> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xmlText = await response.text();
    const articles: NewsArticle[] = [];

    const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);

    for (const match of itemMatches) {
      const itemContent = match[1];

      const title =
        itemContent
          .match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]
          ?.trim() || '';

      const link =
        itemContent
          .match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1]
          ?.trim() || '';

      const description =
        itemContent
          .match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]
          ?.trim() || '';

      const pubDate =
        itemContent
          .match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/)?.[1]
          ?.trim() || '';

      let image = '';
      const imgMatch = itemContent.match(/<img[^>]+src="([^">]+)"/i);
      if (imgMatch) {
        image = imgMatch[1];
      }

      if (title && link) {
        articles.push({
          title: title.replace(/<[^>]*>/g, ''),
          description: description.replace(/<[^>]*>/g, '').substring(0, 200),
          link,
          pubDate,
          source,
          image,
        });
      }
    }

    return articles.slice(0, 6);
  } catch (error) {
    console.error(`Error parsing RSS feed from ${source}:`, error);
    return [];
  }
}

export async function getF1News(): Promise<NewsArticle[]> {
  try {
    const sources = [
      { url: 'https://www.autosport.com/rss/feed/f1', name: 'Autosport' },
      { url: 'https://www.racefans.net/feed/', name: 'RaceFans' },
      { url: 'https://www.motorsport.com/rss/f1/news/', name: 'Motorsport.com' }
    ];

    for (const source of sources) {
      const articles = await parseRSSFeed(source.url, source.name);
      if (articles.length > 0) {
        return articles;
      }
    }

    return [];
  } catch (error) {
    console.error('Error fetching F1 news:', error);
    return [];
  }
}
