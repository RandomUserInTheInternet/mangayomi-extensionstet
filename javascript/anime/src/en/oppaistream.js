const mangayomiSources = [{
    "name": "Oppai Stream",
    "lang": "en",
    "baseUrl": "https://oppai.stream",
    "apiUrl": "",
    "iconUrl": "https://www.google.com/s2/favicons?sz=128&domain=oppai.stream",
    "typeSource": "single",
    "isManga": false,
    "itemType": 1,
    "version": "0.1.2",
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
            const doc = await this.request(url);
            const list = [];
            
            const elements = doc.select("div.in-grid.episode-shown");
            
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

    getAnimeSlugFromUrl(url) {
        try {
            if (url.includes("?e=")) {
                return url.split("?e=")[1].split("&")[0];
            }
        } catch (e) {}
        return "";
    }

    getBaseAnimeName(slug) {
        const parts = slug.split("-");
        if (parts.length > 1) {
            const lastPart = parts[parts.length - 1];
            if (/^\d+$/.test(lastPart)) {
                return parts.slice(0, -1).join("-");
            }
        }
        return slug;
    }

    async getDetail(url) {
        let fullUrl = url;
        if (!url.startsWith("http")) {
            fullUrl = `${this.baseUrl}${url}`;
        }
        
        try {
            console.log("Getting detail: " + fullUrl);
            const html = await this.requestRaw(fullUrl);
            const doc = new Document(html);
            
            const imageUrl = doc.selectFirst(".poster img")?.getSrc || 
                            doc.selectFirst("img.poster")?.getSrc ||
                            doc.selectFirst("meta[property='og:image']")?.attr("content") ||
                            doc.selectFirst(".thumb img")?.getSrc ||
                            doc.selectFirst("img")?.getSrc || "";
            
            const title = doc.selectFirst("h1")?.text?.trim() || 
                         doc.selectFirst(".title")?.text?.trim() ||
                         doc.selectFirst("meta[property='og:title']")?.attr("content") || "";
            
            const description = doc.selectFirst(".description")?.text?.trim() || 
                               doc.selectFirst(".synopsis")?.text?.trim() ||
                               doc.selectFirst("meta[property='og:description']")?.attr("content") || "";
            
            const genreElements = doc.select(".genres a, .genre a, .tags a");
            const genre = [];
            for (const el of genreElements) {
                const g = el.text?.trim();
                if (g) genre.push(g);
            }
            
            const currentSlug = this.getAnimeSlugFromUrl(fullUrl);
            const baseAnimeName = this.getBaseAnimeName(currentSlug);
            console.log("Current slug: " + currentSlug + ", Base name: " + baseAnimeName);
            
            const chapters = [];
            
            const episodeElements = doc.select("div.more-same-eps div.in-grid.episode-shown, div.other-episodes div.in-grid.episode-shown");
            console.log("Found potential episodes: " + episodeElements.length);
            
            for (const element of episodeElements) {
                try {
                    const linkElement = element.selectFirst("a");
                    let episodeUrl = linkElement?.attr("href") || linkElement?.getHref || "";
                    
                    if (!episodeUrl) continue;
                    
                    if (episodeUrl.includes("&for=episode-more")) {
                        episodeUrl = episodeUrl.replace("&for=episode-more", "");
                    }
                    
                    if (!episodeUrl.startsWith("http")) {
                        episodeUrl = `${this.baseUrl}${episodeUrl}`;
                    }
                    
                    const episodeSlug = this.getAnimeSlugFromUrl(episodeUrl);
                    const episodeBaseName = this.getBaseAnimeName(episodeSlug);
                    
                    if (baseAnimeName && episodeBaseName && 
                        episodeBaseName.toLowerCase() === baseAnimeName.toLowerCase()) {
                        
                        const epNumber = element.selectFirst("h5 .ep, .ep")?.text?.trim() || "";
                        const epTitle = element.selectFirst("h5 .title, .title-ep")?.text?.trim() || "";
                        
                        let name = "";
                        if (epNumber) {
                            name = `Episode ${epNumber}`;
                            if (epTitle) name += `: ${epTitle}`;
                        } else if (epTitle) {
                            name = epTitle;
                        } else {
                            const urlEpMatch = episodeSlug.match(/-(\d+)$/);
                            if (urlEpMatch) {
                                name = `Episode ${urlEpMatch[1]}`;
                            } else {
                                name = "Episode";
                            }
                        }
                        
                        if (!chapters.some(c => c.url === episodeUrl)) {
                            chapters.push({ 
                                name, 
                                url: episodeUrl,
                                dateUpload: null
                            });
                            console.log("Added episode: " + name + " -> " + episodeUrl);
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!chapters.some(c => c.url === fullUrl)) {
                const currentEpMatch = currentSlug.match(/-(\d+)$/);
                const epNum = currentEpMatch ? currentEpMatch[1] : "1";
                chapters.unshift({ 
                    name: `Episode ${epNum}`, 
                    url: fullUrl,
                    dateUpload: null 
                });
            }
            
            chapters.sort((a, b) => {
                const numA = parseInt(a.name.match(/\d+/)?.[0] || "0");
                const numB = parseInt(b.name.match(/\d+/)?.[0] || "0");
                return numA - numB;
            });
            
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
                chapters: [{ name: "Episode 1", url: fullUrl, dateUpload: null }]
            };
        }
    }

    async getVideoList(url) {
        let fullUrl = url;
        if (!url.startsWith("http")) {
            if (url.startsWith("://")) {
                fullUrl = "https" + url;
            } else if (url.startsWith("/")) {
                fullUrl = this.baseUrl + url;
            } else {
                fullUrl = this.baseUrl + "/" + url;
            }
        }
        
        console.log("Getting videos for: " + fullUrl);
        
        try {
            const res = await this.client.get(fullUrl, this.getHeaders());
            console.log("Response status: " + res.statusCode);
            
            if (res.statusCode !== 200) {
                console.log("Failed to fetch page, status: " + res.statusCode);
                return [];
            }
            
            const html = res.body;
            const doc = new Document(html);
            const videos = [];
            
            const iframes = doc.select("iframe[src]");
            console.log("Found iframes: " + iframes.length);
            
            for (const iframe of iframes) {
                const iframeSrc = iframe.attr("src") || iframe.getSrc || "";
                if (iframeSrc && !iframeSrc.includes("google") && !iframeSrc.includes("ads")) {
                    console.log("Processing iframe: " + iframeSrc);
                    
                    let iframeFullUrl = iframeSrc;
                    if (!iframeSrc.startsWith("http")) {
                        if (iframeSrc.startsWith("//")) {
                            iframeFullUrl = "https:" + iframeSrc;
                        } else {
                            iframeFullUrl = this.baseUrl + iframeSrc;
                        }
                    }
                    
                    try {
                        const iframeRes = await this.client.get(iframeFullUrl, {
                            "Referer": fullUrl,
                            "User-Agent": this.getHeaders()["User-Agent"]
                        });
                        
                        if (iframeRes.statusCode === 200) {
                            const iframeHtml = iframeRes.body;
                            
                            const m3u8Matches = iframeHtml.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/g) || [];
                            for (const m3u8 of m3u8Matches) {
                                if (!videos.some(v => v.url === m3u8)) {
                                    const qualityMatch = m3u8.match(/\/(\d{3,4})\//);
                                    videos.push({
                                        url: m3u8,
                                        originalUrl: m3u8,
                                        quality: `Oppai Stream - ${qualityMatch ? qualityMatch[1] + 'p' : 'Auto'}`,
                                        headers: { "Referer": iframeFullUrl }
                                    });
                                    console.log("Found m3u8: " + m3u8);
                                }
                            }
                            
                            const mp4Matches = iframeHtml.match(/https?:\/\/[^\s"']+\.mp4[^\s"']*/g) || [];
                            for (const mp4 of mp4Matches) {
                                if (!videos.some(v => v.url === mp4)) {
                                    const qualityMatch = mp4.match(/\/(\d{3,4})\//);
                                    videos.push({
                                        url: mp4,
                                        originalUrl: mp4,
                                        quality: `Oppai Stream - ${qualityMatch ? qualityMatch[1] + 'p' : 'Default'}`,
                                        headers: { "Referer": iframeFullUrl }
                                    });
                                    console.log("Found mp4: " + mp4);
                                }
                            }
                            
                            if (iframeHtml.includes("eval(function(p,a,c,k,e,d)")) {
                                console.log("Found packed JS in iframe");
                                const packedUrls = iframeHtml.match(/https?:\\\/\\\/[^"']+\.(?:m3u8|mp4)[^"']*/g) || [];
                                for (let packedUrl of packedUrls) {
                                    packedUrl = packedUrl.replace(/\\\//g, '/');
                                    if (!videos.some(v => v.url === packedUrl)) {
                                        videos.push({
                                            url: packedUrl,
                                            originalUrl: packedUrl,
                                            quality: "Oppai Stream - Packed",
                                            headers: { "Referer": iframeFullUrl }
                                        });
                                    }
                                }
                            }
                        }
                    } catch (iframeErr) {
                        console.log("Iframe fetch error: " + iframeErr);
                    }
                }
            }
            
            const m3u8Regex = /https?:\/\/[^\s"']+\.m3u8[^\s"']*/g;
            const mp4Regex = /https?:\/\/[^\s"']+\.mp4[^\s"']*/g;
            
            const m3u8Matches = html.match(m3u8Regex) || [];
            const mp4Matches = html.match(mp4Regex) || [];
            
            for (const m3u8 of m3u8Matches) {
                if (!videos.some(v => v.url === m3u8)) {
                    videos.push({
                        url: m3u8,
                        originalUrl: m3u8,
                        quality: "Oppai Stream - HLS",
                        headers: this.getHeaders()
                    });
                }
            }
            
            for (const mp4 of mp4Matches) {
                if (!videos.some(v => v.url === mp4)) {
                    videos.push({
                        url: mp4,
                        originalUrl: mp4,
                        quality: "Oppai Stream - MP4",
                        headers: this.getHeaders()
                    });
                }
            }
            
            const videoElements = doc.select("video source[src], video[src]");
            for (const video of videoElements) {
                const src = video.attr("src") || "";
                if (src && !videos.some(v => v.url === src)) {
                    videos.push({
                        url: src.startsWith("http") ? src : this.baseUrl + src,
                        originalUrl: src,
                        quality: "Oppai Stream - Direct",
                        headers: this.getHeaders()
                    });
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
