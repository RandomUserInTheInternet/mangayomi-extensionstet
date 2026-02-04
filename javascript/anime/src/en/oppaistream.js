const mangayomiSources = [{
    "name": "Oppai Stream",
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
    "isNsfw": true,
    "pkgPath": "anime/src/en/oppaistream.js"
}];

class DefaultExtension extends MProvider {
    constructor() {
        super();
        this.client = new Client();
        this.baseUrl = "https://oppai.stream";
    }

    getPreference(key) {
        return new SharedPreferences().get(key);
    }

    getHeaders() {
        return {
            "Referer": "https://oppai.stream/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.48 Safari/537.36"
        };
    }

    async request(url) {
        const res = await this.client.get(url, this.getHeaders());
        return new Document(res.body);
    }

    async requestRaw(url) {
        const res = await this.client.get(url, this.getHeaders());
        return res.body;
    }

    async getPopular(page) {
        const url = `${this.baseUrl}/actions/search.php?order=views&page=${page}&limit=36&genres=&blacklist=&studio=&ibt=0&swa=1&text=`;
        
        try {
            console.log("Fetching: " + url);
            const doc = await this.request(url);
            const list = [];
            
            const elements = doc.select("div.in-grid.episode-shown");
            console.log("Found elements: " + elements.length);
            
            for (const element of elements) {
                try {
                    const linkElement = element.selectFirst("a");
                    let link = linkElement?.attr("href") || linkElement?.getHref || "";
                    
                    if (link.includes("&for=search")) {
                        link = link.replace("&for=search", "");
                    }
                    
                    const name = element.selectFirst(".title-ep")?.text?.trim() || 
                                element.selectFirst("h5")?.text?.trim() || "";
                    
                    const imageUrl = element.selectFirst("img")?.getSrc || 
                                    element.selectFirst("img")?.attr("src") ||
                                    element.selectFirst("img")?.attr("data-src") || "";
                    
                    if (name && link) {
                        list.push({ name, imageUrl, link });
                        console.log("Added: " + name);
                    }
                } catch (e) {
                    console.log("Element error: " + e);
                    continue;
                }
            }
            
            const hasNextPage = list.length >= 36;
            console.log("Total items: " + list.length);
            
            return { list, hasNextPage };
        } catch (e) {
            console.log("getPopular error: " + e);
            return { list: [], hasNextPage: false };
        }
    }

    async getLatestUpdates(page) {
        const url = `${this.baseUrl}/actions/search.php?order=recent&page=${page}&limit=36&genres=&blacklist=&studio=&ibt=0&swa=1&text=`;
        
        try {
            console.log("Fetching: " + url);
            const doc = await this.request(url);
            const list = [];
            
            const elements = doc.select("div.in-grid.episode-shown");
            console.log("Found elements: " + elements.length);
            
            for (const element of elements) {
                try {
                    const linkElement = element.selectFirst("a");
                    let link = linkElement?.attr("href") || linkElement?.getHref || "";
                    
                    if (link.includes("&for=search")) {
                        link = link.replace("&for=search", "");
                    }
                    
                    const name = element.selectFirst(".title-ep")?.text?.trim() || 
                                element.selectFirst("h5")?.text?.trim() || "";
                    
                    const imageUrl = element.selectFirst("img")?.getSrc || 
                                    element.selectFirst("img")?.attr("src") ||
                                    element.selectFirst("img")?.attr("data-src") || "";
                    
                    if (name && link) {
                        list.push({ name, imageUrl, link });
                    }
                } catch (e) {
                    continue;
                }
            }
            
            const hasNextPage = list.length >= 36;
            return { list, hasNextPage };
        } catch (e) {
            console.log("getLatestUpdates error: " + e);
            return { list: [], hasNextPage: false };
        }
    }

    async search(query, page, filters) {
        let order = "recent";
        
        if (filters && filters.length > 0 && filters[0].values) {
            const selectedIndex = filters[0].state || 0;
            order = filters[0].values[selectedIndex]?.value || "recent";
        }
        
        const url = `${this.baseUrl}/actions/search.php?order=${order}&page=${page}&limit=36&genres=&blacklist=&studio=&ibt=0&swa=1&text=${encodeURIComponent(query)}`;
        
        try {
            console.log("Searching: " + url);
            const doc = await this.request(url);
            const list = [];
            
            const elements = doc.select("div.in-grid.episode-shown");
            console.log("Found elements: " + elements.length);
            
            for (const element of elements) {
                try {
                    const linkElement = element.selectFirst("a");
                    let link = linkElement?.attr("href") || linkElement?.getHref || "";
                    
                    if (link.includes("&for=search")) {
                        link = link.replace("&for=search", "");
                    }
                    
                    const name = element.selectFirst(".title-ep")?.text?.trim() || 
                                element.selectFirst("h5")?.text?.trim() || "";
                    
                    const imageUrl = element.selectFirst("img")?.getSrc || 
                                    element.selectFirst("img")?.attr("src") ||
                                    element.selectFirst("img")?.attr("data-src") || "";
                    
                    if (name && link) {
                        list.push({ name, imageUrl, link });
                    }
                } catch (e) {
                    continue;
                }
            }
            
            const hasNextPage = list.length >= 36;
            return { list, hasNextPage };
        } catch (e) {
            console.log("search error: " + e);
            return { list: [], hasNextPage: false };
        }
    }

    async getDetail(url) {
        let fullUrl = url;
        if (!url.startsWith("http")) {
            fullUrl = `${this.baseUrl}${url}`;
        }
        
        try {
            console.log("Getting detail: " + fullUrl);
            const doc = await this.request(fullUrl);
            
            const imageUrl = doc.selectFirst(".poster img")?.getSrc || 
                            doc.selectFirst("img.poster")?.getSrc ||
                            doc.selectFirst("meta[property='og:image']")?.attr("content") ||
                            doc.selectFirst("img")?.getSrc || "";
            
            const title = doc.selectFirst("h1")?.text?.trim() || 
                         doc.selectFirst(".title")?.text?.trim() || "";
            
            const description = doc.selectFirst(".description")?.text?.trim() || 
                               doc.selectFirst(".synopsis")?.text?.trim() ||
                               doc.selectFirst("meta[property='og:description']")?.attr("content") || "";
            
            const genreElements = doc.select(".genres a, .genre a, .tags a");
            const genre = [];
            for (const el of genreElements) {
                const g = el.text?.trim();
                if (g) genre.push(g);
            }
            
            const chapters = [];
            const episodeElements = doc.select("div.other-episodes div.in-grid.episode-shown, div.more-same-eps div.in-grid.episode-shown");
            console.log("Found episodes: " + episodeElements.length);
            
            for (const element of episodeElements) {
                try {
                    const linkElement = element.selectFirst("a");
                    let episodeUrl = linkElement?.attr("href") || linkElement?.getHref || "";
                    
                    if (episodeUrl.includes("&for=episode-more")) {
                        episodeUrl = episodeUrl.replace("&for=episode-more", "");
                    }
                    
                    const epNumber = element.selectFirst("h5 .ep, .ep")?.text?.trim() || "";
                    const epTitle = element.selectFirst("h5 .title, .title")?.text?.trim() || "";
                    
                    let name = "";
                    if (epNumber && epTitle) {
                        name = `Episode ${epNumber}: ${epTitle}`;
                    } else if (epNumber) {
                        name = `Episode ${epNumber}`;
                    } else if (epTitle) {
                        name = epTitle;
                    } else {
                        name = element.selectFirst("h5")?.text?.trim() || "Episode";
                    }
                    
                    if (episodeUrl) {
                        chapters.push({ 
                            name, 
                            url: episodeUrl, 
                            dateUpload: null
                        });
                        console.log("Added episode: " + name);
                    }
                } catch (e) {
                    console.log("Episode parse error: " + e);
                    continue;
                }
            }
            
            if (chapters.length === 0) {
                chapters.push({ name: "Watch", url: fullUrl, dateUpload: null });
            }
            
            return {
                title,
                imageUrl,
                description,
                genre,
                author: "",
                artist: "",
                status: 5,
                chapters
            };
        } catch (e) {
            console.log("getDetail error: " + e);
            return {
                title: "",
                imageUrl: "",
                description: "",
                genre: [],
                author: "",
                artist: "",
                status: 5,
                chapters: [{ name: "Watch", url: fullUrl, dateUpload: null }]
            };
        }
    }

    async getVideoList(url) {
        let fullUrl = url;
        if (!url.startsWith("http")) {
            fullUrl = `${this.baseUrl}${url}`;
        }
        
        try {
            console.log("Getting videos for: " + fullUrl);
            const html = await this.requestRaw(fullUrl);
            const videos = [];
            
            const m3u8Regex = /https?:\/\/[^\s'"]+\.m3u8(?:\?[^\s'"]*)?/g;
            const m3u8Matches = html.match(m3u8Regex) || [];
            
            for (const m3u8Url of m3u8Matches) {
                if (!videos.some(v => v.url === m3u8Url)) {
                    const qualityMatch = m3u8Url.match(/\/(\d{3,4})\//);
                    const quality = qualityMatch ? `${qualityMatch[1]}p` : "Auto";
                    
                    videos.push({
                        url: m3u8Url,
                        originalUrl: m3u8Url,
                        quality: `Oppai Stream - ${quality}`,
                        headers: this.getHeaders()
                    });
                    console.log("Found m3u8: " + m3u8Url);
                }
            }
            
            const mp4Regex = /https?:\/\/[^\s'"]+\.mp4(?:\?[^\s'"]*)?/g;
            const mp4Matches = html.match(mp4Regex) || [];
            
            for (const mp4Url of mp4Matches) {
                if (!videos.some(v => v.url === mp4Url)) {
                    const qualityMatch = mp4Url.match(/\/(\d{3,4})\//);
                    const quality = qualityMatch ? `${qualityMatch[1]}p` : "Default";
                    
                    videos.push({
                        url: mp4Url,
                        originalUrl: mp4Url,
                        quality: `Oppai Stream - ${quality}`,
                        headers: this.getHeaders()
                    });
                    console.log("Found mp4: " + mp4Url);
                }
            }
            
            const doc = new Document(html);
            const iframes = doc.select("iframe[src]");
            
            for (const iframe of iframes) {
                const iframeSrc = iframe.attr("src") || iframe.getSrc;
                if (iframeSrc && !iframeSrc.includes("ads")) {
                    console.log("Found iframe: " + iframeSrc);
                    
                    try {
                        const iframeHtml = await this.requestRaw(iframeSrc);
                        
                        if (iframeHtml.includes("eval(function(p,a,c,k,e,d)")) {
                            console.log("Found packed JS, attempting to unpack...");
                            const m3u8InPacked = iframeHtml.match(/https?:\\\/\\\/[^'"]+\.m3u8[^'""]*/g);
                            const mp4InPacked = iframeHtml.match(/https?:\\\/\\\/[^'"]+\.mp4[^'""]*/g);
                            
                            if (m3u8InPacked) {
                                for (let m3u8 of m3u8InPacked) {
                                    m3u8 = m3u8.replace(/\\\//g, '/');
                                    if (!videos.some(v => v.url === m3u8)) {
                                        videos.push({
                                            url: m3u8,
                                            originalUrl: m3u8,
                                            quality: "Oppai Stream - HLS",
                                            headers: { "Referer": iframeSrc }
                                        });
                                    }
                                }
                            }
                            
                            if (mp4InPacked) {
                                for (let mp4 of mp4InPacked) {
                                    mp4 = mp4.replace(/\\\//g, '/');
                                    if (!videos.some(v => v.url === mp4)) {
                                        videos.push({
                                            url: mp4,
                                            originalUrl: mp4,
                                            quality: "Oppai Stream - MP4",
                                            headers: { "Referer": iframeSrc }
                                        });
                                    }
                                }
                            }
                        }
                        
                        const iframeM3u8 = iframeHtml.match(m3u8Regex) || [];
                        const iframeMp4 = iframeHtml.match(mp4Regex) || [];
                        
                        for (const videoUrl of [...iframeM3u8, ...iframeMp4]) {
                            if (!videos.some(v => v.url === videoUrl)) {
                                const isM3u8 = videoUrl.includes(".m3u8");
                                videos.push({
                                    url: videoUrl,
                                    originalUrl: videoUrl,
                                    quality: `Oppai Stream - ${isM3u8 ? "HLS" : "MP4"}`,
                                    headers: { "Referer": iframeSrc }
                                });
                            }
                        }
                    } catch (iframeError) {
                        console.log("Error fetching iframe: " + iframeError);
                        videos.push({
                            url: iframeSrc,
                            originalUrl: iframeSrc,
                            quality: "Embed",
                            headers: this.getHeaders()
                        });
                    }
                }
            }
            
            const scripts = doc.select("script");
            for (const script of scripts) {
                const scriptText = script.text || "";
                
                const sourcePatterns = [
                    /["']?(?:file|source|src|url)["']?\s*[=:]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/gi,
                    /sources\s*:\s*\[\s*\{\s*(?:file|src)\s*:\s*["']([^"']+)["']/gi,
                ];
                
                for (const pattern of sourcePatterns) {
                    let match;
                    while ((match = pattern.exec(scriptText)) !== null) {
                        const videoUrl = match[1];
                        if (videoUrl && !videos.some(v => v.url === videoUrl)) {
                            const isM3u8 = videoUrl.includes(".m3u8");
                            videos.push({
                                url: videoUrl,
                                originalUrl: videoUrl,
                                quality: `Oppai Stream - ${isM3u8 ? "HLS" : "MP4"}`,
                                headers: this.getHeaders()
                            });
                        }
                    }
                }
            }
            
            console.log("Total videos found: " + videos.length);
            return videos;
        } catch (e) {
            console.log("getVideoList error: " + e);
            return [];
        }
    }

    async getPageList(url) {
        return [];
    }

    getSourcePreferences() {
        return [{
            key: "overrideBaseUrl",
            editTextPreference: {
                title: "Override BaseUrl",
                summary: "Enter the base URL if it has changed",
                value: "https://oppai.stream",
                dialogTitle: "Override BaseUrl",
                dialogMessage: "Enter the base URL if it has changed",
            }
        }];
    }

    getFilterList() {
        return [
            {
                type_name: "SelectFilter",
                name: "Sort By",
                state: 0,
                values: [
                    { type_name: "SelectOption", name: "Recent", value: "recent" },
                    { type_name: "SelectOption", name: "Most Views", value: "views" },
                    { type_name: "SelectOption", name: "Top Rated", value: "rating" },
                    { type_name: "SelectOption", name: "A-Z", value: "az" },
                    { type_name: "SelectOption", name: "Z-A", value: "za" },
                ]
            }
        ];
    }
}

var extension = new DefaultExtension();
