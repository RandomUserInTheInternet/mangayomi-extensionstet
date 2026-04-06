const mangayomiSources = [{
    "name": "KickAssAnime",
    "lang": "en",
    "baseUrl": "https://kaa.lt",
    "apiUrl": "",
    "iconUrl": "https://www.google.com/s2/favicons?sz=128&domain=kaa.lt",
    "typeSource": "single",
    "isManga": false,
    "itemType": 1,
    "version": "0.0.1",
    "dateFormat": "",
    "dateFormatLocale": "",
    "isNsfw": false,
    "hasCloudflare": false,
    "sourceCodeUrl": "https://raw.githubusercontent.com/RandomUserInTheInternet/mangayomi-extensionstet/main/javascript/anime/src/en/kickassanime.js",
    "isFullData": false,
    "appMinVerReq": "0.5.0",
    "additionalParams": "",
    "sourceCodeLanguage": 1,
    "id": 723849156,
    "notes": "KickAssAnime (kaa.lt) with HLS stream extraction from krussdomi.com player",
    "pkgPath": "anime/src/en/kickassanime.js"
}];

class DefaultExtension extends MProvider {
    constructor() {
        super();
        this.client = new Client();
        this.baseUrl = "https://kaa.lt";
        this.posterBase = "https://i.kaa.lt/image/";
    }

    getHeaders() {
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Referer": this.baseUrl + "/",
            "Accept": "application/json, */*; q=0.01",
            "Origin": this.baseUrl
        };
    }

    getPageHeaders() {
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Referer": this.baseUrl + "/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        };
    }

    // ── Poster URL builder ────────────────────────────────────────────────────
    buildPoster(poster) {
        if (!poster) return "";
        if (poster.startsWith("http")) return poster;
        // poster.hq or poster.sm is a slug like "theatre-of-darkness-yamishibai-16-bb77-hq"
        // Full URL: https://i.kaa.lt/image/{slug}.jpeg
        return this.posterBase + poster + ".jpeg";
    }

    // ── API GET helper ────────────────────────────────────────────────────────
    async apiGet(path) {
        var url = this.baseUrl + "/api" + path;
        console.log("KAA GET: " + url);
        var res = await this.client.get(url, this.getHeaders());
        if (res.statusCode !== 200) {
            console.log("KAA API status: " + res.statusCode + " for " + url);
            throw new Error("API returned " + res.statusCode);
        }
        return JSON.parse(res.body);
    }

    // ── API POST helper ───────────────────────────────────────────────────────
    async apiPost(path, body) {
        var url = this.baseUrl + "/api" + path;
        console.log("KAA POST: " + url);
        var headers = Object.assign({}, this.getHeaders(), {
            "Content-Type": "application/json"
        });
        var res = await this.client.post(url, headers, JSON.stringify(body));
        if (res.statusCode !== 200) {
            console.log("KAA API POST status: " + res.statusCode);
            throw new Error("API returned " + res.statusCode);
        }
        return JSON.parse(res.body);
    }

    // ── Map status string → Mangayomi int ────────────────────────────────────
    parseStatus(statusStr) {
        if (!statusStr) return 5;
        var s = statusStr.toLowerCase();
        if (s.includes("currently_airing") || s.includes("airing")) return 0;
        if (s.includes("finished") || s.includes("completed")) return 1;
        if (s.includes("not_yet_aired") || s.includes("upcoming")) return 3;
        return 5;
    }

    // ── getPopular ────────────────────────────────────────────────────────────
    async getPopular(page) {
        console.log("KAA getPopular page=" + page);
        try {
            // Use the airing/season endpoint
            var data = await this.apiGet("/top-anime?type=all&page=" + page);
            var list = [];
            var items = data.result || data.data || [];
            for (var item of items) {
                var poster = item.poster
                    ? this.buildPoster(item.poster.hq || item.poster.sm || "")
                    : "";
                list.push({
                    name: item.title_en || item.title || "",
                    imageUrl: poster,
                    link: item.slug || ""
                });
            }
            var hasNextPage = items.length >= 26;
            console.log("getPopular: " + list.length + " results");
            return { list, hasNextPage };
        } catch (e) {
            console.log("getPopular error: " + e);
            return { list: [], hasNextPage: false };
        }
    }

    // ── getLatestUpdates ──────────────────────────────────────────────────────
    async getLatestUpdates(page) {
        console.log("KAA getLatestUpdates page=" + page);
        try {
            var data = await this.apiGet("/recent-episodes?page=" + page + "&lang=ja-JP");
            var list = [];
            var items = data.result || data.data || [];
            for (var item of items) {
                var poster = item.show
                    ? this.buildPoster((item.show.poster || {}).hq || "")
                    : this.buildPoster((item.poster || {}).hq || "");
                var slug = item.show_slug || (item.show && item.show.slug) || item.slug || "";
                var title = item.show_title || (item.show && item.show.title_en) || item.title_en || item.title || "";
                if (slug) {
                    list.push({ name: title, imageUrl: poster, link: slug });
                }
            }
            var hasNextPage = items.length >= 26;
            console.log("getLatestUpdates: " + list.length + " results");
            return { list, hasNextPage };
        } catch (e) {
            console.log("getLatestUpdates error: " + e);
            // Fallback to popular if recent-episodes endpoint differs
            return await this.getPopular(page);
        }
    }

    // ── search ────────────────────────────────────────────────────────────────
    async search(query, page, filters) {
        console.log("KAA search: " + query);
        try {
            var data = await this.apiPost("/fsearch", { page: page, query: query });
            var list = [];
            var items = data.result || data.data || [];
            for (var item of items) {
                var poster = item.poster
                    ? this.buildPoster(item.poster.hq || item.poster.sm || "")
                    : "";
                list.push({
                    name: item.title_en || item.title || "",
                    imageUrl: poster,
                    link: item.slug || ""
                });
            }
            var hasNextPage = items.length >= 26;
            console.log("search: " + list.length + " results");
            return { list, hasNextPage };
        } catch (e) {
            console.log("search error: " + e);
            return { list: [], hasNextPage: false };
        }
    }

    // ── getDetail ─────────────────────────────────────────────────────────────
    async getDetail(url) {
        console.log("KAA getDetail: " + url);
        try {
            var animeSlug = url; // stored as slug from search/popular

            // Fetch show metadata
            var show = await this.apiGet("/show/" + animeSlug);

            var title = show.title_en || show.title || "";
            var imageUrl = show.poster
                ? this.buildPoster(show.poster.hq || show.poster.sm || "")
                : "";
            var description = show.synopsis || "";
            var genre = show.genres || [];
            var status = this.parseStatus(show.status);

            // Determine the preferred language (default to first available)
            var lang = "ja-JP";
            if (show.locales && show.locales.length > 0) {
                lang = show.locales[0];
            }

            // Fetch all episodes — paginated via the "pages" field
            var chapters = [];
            // First page to discover page count
            var firstPage = await this.apiGet("/show/" + animeSlug + "/episodes?ep=1&lang=" + lang);
            var pages = firstPage.pages || [];

            // Build episode list from all pages
            var allEpisodes = firstPage.result || [];

            for (var p = 1; p < pages.length; p++) {
                try {
                    var pageData = await this.apiGet(
                        "/show/" + animeSlug + "/episodes?ep=" + pages[p].from + "&lang=" + lang
                    );
                    allEpisodes = allEpisodes.concat(pageData.result || []);
                } catch (pe) {
                    console.log("Episode page " + p + " error: " + pe);
                }
            }

            // Convert to Mangayomi chapter format (newest first via episode_desc sort)
            // KAA returns episodes ascending; reverse for Mangayomi convention
            allEpisodes.sort(function(a, b) { return b.episode_number - a.episode_number; });

            for (var ep of allEpisodes) {
                var epNum = ep.episode_number || 0;
                var epSlug = ep.slug || "";
                // Store: animeSlug||ep-{num}-{epSlug}||lang
                chapters.push({
                    name: "Episode " + ep.episode_string,
                    url: animeSlug + "||ep-" + epNum + "-" + epSlug + "||" + lang,
                    dateUpload: null
                });
            }

            console.log("getDetail: " + title + ", " + chapters.length + " episodes");
            return {
                link: this.baseUrl + "/" + animeSlug,
                name: title || "KickAssAnime Show",
                imageUrl,
                description,
                genre,
                status,
                chapters
            };
        } catch (e) {
            console.log("getDetail error: " + e);
            return { name: "", imageUrl: "", description: "", genre: [], status: 5, chapters: [] };
        }
    }

    // ── getVideoList ──────────────────────────────────────────────────────────
    async getVideoList(url) {
        console.log("KAA getVideoList: " + url);
        try {
            var parts = url.split("||");
            if (parts.length < 2) {
                console.log("Invalid episode URL format");
                return [];
            }
            var animeSlug = parts[0];
            var episodeSlug = parts[1]; // e.g. "ep-13-09316a"
            var lang = parts[2] || "ja-JP";

            // Step 1: get episode info (includes server list with krussdomi URL)
            var epInfo = await this.apiGet(
                "/show/" + animeSlug + "/episode/" + episodeSlug
            );

            var servers = epInfo.servers || [];
            if (servers.length === 0) {
                console.log("No servers found for episode");
                return [];
            }

            var videos = [];

            for (var server of servers) {
                try {
                    var playerUrl = server.src || "";
                    var serverName = server.shortName || server.name || "KAA";

                    if (!playerUrl) continue;
                    console.log("Fetching player: " + playerUrl);

                    // Step 2: Fetch the krussdomi player page
                    var playerHeaders = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
                        "Referer": this.baseUrl + "/",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                    };
                    var playerRes = await this.client.get(playerUrl, playerHeaders);
                    if (playerRes.statusCode !== 200) {
                        console.log("Player page status: " + playerRes.statusCode);
                        continue;
                    }

                    var playerHtml = playerRes.body;

                    // Step 3: Extract manifest URL from astro-island props
                    // The props attr contains HTML-encoded JSON with the manifest URL
                    // Pattern: &quot;manifest&quot;:[0,&quot;https://hls.krussdomi.com/...&quot;]
                    var m3u8Url = null;

                    // Primary: extract from astro-island props attribute
                    // The manifest field is: "manifest":[0,"https://hls.krussdomi.com/..."]
                    var propsMatch = playerHtml.match(/&quot;manifest&quot;:\[0,&quot;(https?:\/\/[^&]+)&quot;\]/);
                    if (propsMatch) {
                        m3u8Url = propsMatch[1];
                        console.log("Found manifest from props: " + m3u8Url);
                    }

                    // Fallback: look for any hls.krussdomi.com URL
                    if (!m3u8Url) {
                        var cdnMatch = playerHtml.match(/https?:\/\/hls\.krussdomi\.com\/[^"'\s&]+master\.m3u8/);
                        if (cdnMatch) {
                            m3u8Url = cdnMatch[0];
                            console.log("Found manifest (fallback): " + m3u8Url);
                        }
                    }

                    // Fallback 2: any .m3u8 on krussdomi
                    if (!m3u8Url) {
                        var anyM3u8 = playerHtml.match(/https?:\/\/hls\.krussdomi\.com\/[^"'\s&]+\.m3u8/);
                        if (anyM3u8) {
                            m3u8Url = anyM3u8[0];
                            console.log("Found m3u8 (fallback2): " + m3u8Url);
                        }
                    }

                    if (m3u8Url) {
                        videos.push({
                            url: m3u8Url,
                            originalUrl: m3u8Url,
                            quality: "KAA " + serverName,
                            headers: {
                                "Referer": "https://krussdomi.com/",
                                "Origin": "https://krussdomi.com"
                            }
                        });
                    } else {
                        console.log("No m3u8 found in player page for server: " + serverName);
                    }
                } catch (serverErr) {
                    console.log("Server processing error: " + serverErr);
                }
            }

            console.log("Total videos: " + videos.length);
            return videos;
        } catch (e) {
            console.log("getVideoList error: " + e);
            return [];
        }
    }

    async getPageList(url) { return []; }
    getFilterList() { return []; }
    getSourcePreferences() { return []; }
}
