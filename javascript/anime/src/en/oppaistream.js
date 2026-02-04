const mangayomiSources = [{
    "name": "oppai.stream",
    "lang": "en",
    "baseUrl": "https://oppai.stream",
    "apiUrl": "",
    "iconUrl": "https://www.google.com/s2/favicons?sz=128&domain=oppai.stream",
    "typeSource": "single",
    "isManga": false,
    "itemType": 1,
    "version": "0.1.0",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "anime/src/en/oppaistream.js"
}];

class DefaultExtension extends MProvider {
    constructor() {
        super();
        this.client = new Client();
    }

    getHeaders(url) {
        return {
            "Referer": this.source.baseUrl,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        };
    }

    async request(url, headers = {}) {
        const finalHeaders = { ...this.getHeaders(url), ...headers };
        const res = await this.client.get(url, finalHeaders);
        return new Document(res.body);
    }

    parseAnimeList(doc) {
        const list = [];
        const animeElements = doc.select("div.item, article.post, div.post-item, div.anime-item");
        
        for (const element of animeElements) {
            try {
                const linkElement = element.selectFirst("a[href]");
                if (!linkElement) continue;
                
                const link = linkElement.getHref;
                const name = element.selectFirst("h2, h3, .title, .post-title")?.text.trim() ||
                            linkElement.attr("title") || 
                            linkElement.text.trim();
                
                let imageUrl = element.selectFirst("img")?.getSrc || 
                              element.selectFirst("img")?.attr("data-src") || "";
                
                if (name && link) {
                    list.push({ name, imageUrl, link });
                }
            } catch (e) {
                // Skip malformed elements
                continue;
            }
        }
        
        return list;
    }

    async getPopular(page) {
        const baseUrl = new SharedPreferences().get("overrideBaseUrl") || this.source.baseUrl;
        const url = `${baseUrl}/popular?page=${page}`;
        
        try {
            const doc = await this.request(url);
            const list = this.parseAnimeList(doc);
            const hasNextPage = doc.selectFirst("a.next, .pagination a:contains(Next), .next-page") != null;
            
            return { list, hasNextPage };
        } catch (e) {
            return { list: [], hasNextPage: false };
        }
    }

    async getLatestUpdates(page) {
        const baseUrl = new SharedPreferences().get("overrideBaseUrl") || this.source.baseUrl;
        const url = `${baseUrl}/latest?page=${page}`;
        
        try {
            const doc = await this.request(url);
            const list = this.parseAnimeList(doc);
            const hasNextPage = doc.selectFirst("a.next, .pagination a:contains(Next), .next-page") != null;
            
            return { list, hasNextPage };
        } catch (e) {
            return { list: [], hasNextPage: false };
        }
    }

    async search(query, page, filters) {
        const baseUrl = new SharedPreferences().get("overrideBaseUrl") || this.source.baseUrl;
        const url = `${baseUrl}/search?q=${encodeURIComponent(query)}&page=${page}`;
        
        try {
            const doc = await this.request(url);
            const list = this.parseAnimeList(doc);
            const hasNextPage = doc.selectFirst("a.next, .pagination a:contains(Next), .next-page") != null;
            
            return { list, hasNextPage };
        } catch (e) {
            return { list: [], hasNextPage: false };
        }
    }

    toStatus(status) {
        const statusLower = status.toLowerCase();
        if (statusLower.includes("ongoing") || statusLower.includes("airing")) {
            return 0;
        } else if (statusLower.includes("complete") || statusLower.includes("finished")) {
            return 1;
        } else if (statusLower.includes("hiatus")) {
            return 2;
        } else if (statusLower.includes("cancel") || statusLower.includes("dropped")) {
            return 3;
        }
        return 5; // unknown
    }

    parseDate(dateStr) {
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.valueOf())) {
                return String(date.valueOf());
            }
        } catch (e) {
            // Fallback to current date
        }
        return String(new Date().valueOf());
    }

    async getDetail(url) {
        const baseUrl = new SharedPreferences().get("overrideBaseUrl") || this.source.baseUrl;
        const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
        
        const doc = await this.request(fullUrl);
        
        // Extract anime details
        const imageUrl = doc.selectFirst("img.poster, .anime-poster img, .cover img")?.getSrc || 
                        doc.selectFirst("meta[property='og:image']")?.attr("content") || "";
        
        const description = doc.selectFirst(".description, .synopsis, .summary")?.text.trim() ||
                           doc.selectFirst("meta[property='og:description']")?.attr("content") || "";
        
        const author = doc.selectFirst(".author, .studio")?.text.trim() || "";
        const artist = doc.selectFirst(".producer, .director")?.text.trim() || "";
        
        const statusText = doc.selectFirst(".status")?.text.trim() || "";
        const status = this.toStatus(statusText);
        
        // Extract genres
        const genre = doc.select(".genre a, .genres a, .categories a").map(el => el.text.trim());
        
        // Extract episodes
        const episodes = [];
        const episodeElements = doc.select(".episode-item, .episode, .ep-item, .video-item");
        
        for (const element of episodeElements) {
            try {
                const linkElement = element.selectFirst("a[href]");
                if (!linkElement) continue;
                
                const url = linkElement.getHref;
                const name = element.selectFirst(".title, .episode-title")?.text.trim() ||
                            linkElement.attr("title") ||
                            linkElement.text.trim() ||
                            "Episode";
                
                const dateText = element.selectFirst(".date, .time, .release-date")?.text.trim() || "";
                const dateUpload = dateText ? this.parseDate(dateText) : null;
                
                episodes.push({ name, url, dateUpload });
            } catch (e) {
                continue;
            }
        }
        
        return {
            imageUrl,
            description,
            genre,
            author,
            artist,
            status,
            episodes
        };
    }

    async getVideoList(url) {
        const baseUrl = new SharedPreferences().get("overrideBaseUrl") || this.source.baseUrl;
        const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
        
        const doc = await this.request(fullUrl);
        const videos = [];
        
        // Try to find video sources
        // Method 1: Direct video elements
        const videoElements = doc.select("video source, video");
        for (const element of videoElements) {
            const videoUrl = element.attr("src") || element.attr("data-src");
            if (videoUrl) {
                videos.push({
                    url: videoUrl,
                    originalUrl: videoUrl,
                    quality: element.attr("quality") || element.attr("label") || "default"
                });
            }
        }
        
        // Method 2: iframe embeds
        if (videos.length === 0) {
            const iframes = doc.select("iframe[src]");
            for (const iframe of iframes) {
                const iframeUrl = iframe.getSrc;
                if (iframeUrl) {
                    videos.push({
                        url: iframeUrl,
                        originalUrl: iframeUrl,
                        quality: "iframe"
                    });
                }
            }
        }
        
        // Method 3: Try to extract from script tags
        if (videos.length === 0) {
            const scripts = doc.select("script");
            for (const script of scripts) {
                const scriptText = script.text;
                
                // Look for common video URL patterns
                const urlPatterns = [
                    /["'](?:url|file|src)["']\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/gi,
                    /source\s*=\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/gi,
                ];
                
                for (const pattern of urlPatterns) {
                    let match;
                    while ((match = pattern.exec(scriptText)) !== null) {
                        const videoUrl = match[1];
                        if (videoUrl && !videos.some(v => v.url === videoUrl)) {
                            videos.push({
                                url: videoUrl,
                                originalUrl: videoUrl,
                                quality: videoUrl.includes("1080") ? "1080p" : 
                                        videoUrl.includes("720") ? "720p" :
                                        videoUrl.includes("480") ? "480p" : "default"
                            });
                        }
                    }
                }
            }
        }
        
        // If no videos found, return a placeholder
        if (videos.length === 0) {
            videos.push({
                url: fullUrl,
                originalUrl: fullUrl,
                quality: "default"
            });
        }
        
        return videos;
    }

    getSourcePreferences() {
        return [{
            "key": "overrideBaseUrl",
            "editTextPreference": {
                "title": "Override BaseUrl",
                "summary": this.source.baseUrl,
                "value": this.source.baseUrl,
                "dialogTitle": "Override BaseUrl",
                "dialogMessage": "Enter the base URL for oppai.stream if it has changed",
            }
        }];
    }

    getFilterList() {
        return [];
    }
}
