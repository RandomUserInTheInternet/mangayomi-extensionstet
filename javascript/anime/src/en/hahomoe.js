const mangayomiSources = [{
    "name": "HahoMoe",
    "lang": "en",
    "baseUrl": "https://haho.moe",
    "apiUrl": "",
    "iconUrl": "https://www.google.com/s2/favicons?sz=128&domain=haho.moe",
    "typeSource": "single",
    "isManga": false,
    "itemType": 1,
    "version": "0.0.2",
    "dateFormat": "",
    "dateFormatLocale": "",
    "isNsfw": true,
    "hasCloudflare": false,
    "sourceCodeUrl": "",
    "isFullData": false,
    "appMinVerReq": "0.5.0",
    "additionalParams": "",
    "sourceCodeLanguage": 1,
    "notes": "",
    "pkgPath": "anime/src/en/hahomoe.js"
}];

class DefaultExtension extends MProvider {
    constructor() {
        super();
        this.client = new Client();
        this.baseUrl = "https://haho.moe";
    }

    getHeaders() {
        return {
            "Referer": "https://haho.moe/",
            "Cookie": "__ddg1_=;__ddg2_=;loop-view=thumb",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        };
    }

    async request(url) {
        var res = await this.client.get(url, this.getHeaders());
        return new Document(res.body);
    }

    parseAnimeList(doc) {
        var list = [];
        var items = doc.select("ul.anime-loop.loop > li > a");
        console.log("parseAnimeList found items: " + items.length);

        for (var item of items) {
            try {
                var link = item.attr("href") || "";
                if (!link) continue;

                var name = "";
                var thumbTitle = item.selectFirst("div span.thumb-title");
                if (thumbTitle) {
                    name = thumbTitle.text.trim();
                }
                if (!name) {
                    var labelSpan = item.selectFirst("div.label > span");
                    if (labelSpan) {
                        name = labelSpan.text.trim();
                    }
                }
                if (!name) {
                    name = item.attr("title") || "";
                }

                var imgEl = item.selectFirst("img");
                var imageUrl = "";
                if (imgEl) {
                    imageUrl = imgEl.attr("src") || imgEl.getSrc || "";
                }

                if (!link.startsWith("http")) {
                    link = this.baseUrl + link;
                }
                if (imageUrl && !imageUrl.startsWith("http")) {
                    if (imageUrl.startsWith("//")) imageUrl = "https:" + imageUrl;
                    else if (imageUrl.startsWith("/")) imageUrl = this.baseUrl + imageUrl;
                }

                if (name && link) {
                    list.push({ name, imageUrl, link });
                }
            } catch (e) {
                console.log("Parse item error: " + e);
                continue;
            }
        }

        return list;
    }

    hasNextPage(doc) {
        var nextLink = doc.selectFirst("ul.pagination li.page-item a[rel=next]");
        return nextLink != null;
    }

    async getPopular(page) {
        var url = this.baseUrl + "/anime?s=vdy-d&page=" + page;
        console.log("getPopular: " + url);

        try {
            var doc = await this.request(url);
            var list = this.parseAnimeList(doc);
            var hasNextPage = this.hasNextPage(doc);
            console.log("getPopular found: " + list.length + ", hasNext: " + hasNextPage);
            return { list, hasNextPage };
        } catch (e) {
            console.log("getPopular error: " + e);
            return { list: [], hasNextPage: false };
        }
    }

    async getLatestUpdates(page) {
        var url = this.baseUrl + "/anime?s=rel-d&page=" + page;
        console.log("getLatestUpdates: " + url);

        try {
            var doc = await this.request(url);
            var list = this.parseAnimeList(doc);
            var hasNextPage = this.hasNextPage(doc);
            return { list, hasNextPage };
        } catch (e) {
            console.log("getLatestUpdates error: " + e);
            return { list: [], hasNextPage: false };
        }
    }

    async search(query, page, filters) {
        var encodedQuery = encodeURIComponent(query);
        var url = this.baseUrl + "/anime?q=" + encodedQuery + "&page=" + page;
        console.log("search: " + url);

        try {
            var doc = await this.request(url);
            var list = this.parseAnimeList(doc);
            var hasNextPage = this.hasNextPage(doc);
            console.log("search found: " + list.length);
            return { list, hasNextPage };
        } catch (e) {
            console.log("search error: " + e);
            return { list: [], hasNextPage: false };
        }
    }

    async getDetail(url) {
        var fullUrl = url;
        if (!url.startsWith("http")) {
            fullUrl = this.baseUrl + (url.startsWith("/") ? url : "/" + url);
        }
        var detailUrl = fullUrl;
        if (!detailUrl.includes("?s=")) {
            detailUrl = fullUrl + "?s=srt-d";
        }

        console.log("getDetail: " + detailUrl);

        try {
            var doc = await this.request(detailUrl);

            var title = "";
            var breadcrumb = doc.selectFirst("li.breadcrumb-item.active");
            if (breadcrumb) {
                title = breadcrumb.text.trim();
            }
            if (!title) {
                var h1 = doc.selectFirst("h1");
                if (h1) title = h1.text.trim();
            }

            var imageUrl = "";
            var coverImg = doc.selectFirst("img.cover-image.img-thumbnail");
            if (coverImg) {
                imageUrl = coverImg.attr("src") || coverImg.getSrc || "";
            }
            if (!imageUrl) {
                var ogImage = doc.selectFirst("meta[property='og:image']");
                if (ogImage) imageUrl = ogImage.attr("content") || "";
            }
            if (imageUrl && !imageUrl.startsWith("http")) {
                if (imageUrl.startsWith("//")) imageUrl = "https:" + imageUrl;
                else if (imageUrl.startsWith("/")) imageUrl = this.baseUrl + imageUrl;
            }

            var description = "";
            var cardBody = doc.selectFirst("div.card-body");
            if (cardBody) {
                description = cardBody.text.trim();
            }

            var genreEls = doc.select("li.genre span.value");
            var genre = [];
            for (var el of genreEls) {
                var g = el.text.trim();
                if (g) genre.push(g);
            }

            var status = 5;
            var statusEl = doc.selectFirst("li.status span.value");
            if (statusEl) {
                var statusText = statusEl.text.trim().toLowerCase();
                if (statusText.includes("ongoing")) status = 0;
                else if (statusText.includes("completed")) status = 1;
            }

            var chapters = [];
            var allEpisodePages = [doc];

            var hasMoreEpisodes = this.hasNextPage(doc);
            var currentDoc = doc;
            while (hasMoreEpisodes) {
                try {
                    var nextPageLink = currentDoc.selectFirst("ul.pagination li.page-item a[rel=next]");
                    if (!nextPageLink) break;
                    var nextUrl = nextPageLink.attr("href") || "";
                    if (!nextUrl) break;
                    if (!nextUrl.startsWith("http")) {
                        nextUrl = this.baseUrl + nextUrl;
                    }
                    console.log("Fetching next episode page: " + nextUrl);
                    currentDoc = await this.request(nextUrl);
                    allEpisodePages.push(currentDoc);
                    hasMoreEpisodes = this.hasNextPage(currentDoc);
                } catch (e) {
                    console.log("Episode pagination error: " + e);
                    break;
                }
            }

            for (var epDoc of allEpisodePages) {
                var episodeLinks = epDoc.select("ul.episode-loop > li > a");
                console.log("Episode links found on page: " + episodeLinks.length);

                for (var epLink of episodeLinks) {
                    try {
                        var epHref = epLink.attr("href") || "";
                        if (!epHref) continue;

                        if (!epHref.startsWith("http")) {
                            epHref = this.baseUrl + epHref;
                        }

                        var epNumEl = epLink.selectFirst("div.episode-number");
                        if (!epNumEl) epNumEl = epLink.selectFirst("div.episode-slug");
                        var epNumText = epNumEl ? epNumEl.text.trim() : "";

                        var epTitleEl = epLink.selectFirst("div.episode-title");
                        if (!epTitleEl) epTitleEl = epLink.selectFirst("div.episode-label");
                        var epTitleText = epTitleEl ? epTitleEl.text.trim() : "";

                        var epName = epNumText || "Episode";
                        if (epTitleText && epTitleText.toLowerCase() !== "no title") {
                            epName = epName + ": " + epTitleText;
                        }

                        chapters.push({
                            name: epName,
                            url: epHref
                        });
                    } catch (e) {
                        console.log("Episode parse error: " + e);
                        continue;
                    }
                }
            }

            if (chapters.length === 0) {
                var badge = doc.selectFirst(".entry-episodes > h2 > span.badge.badge-secondary");
                if (badge) {
                    var totalEps = parseInt(badge.text.trim());
                    if (totalEps && totalEps > 0) {
                        var animeBasePath = fullUrl.replace(/\?.*$/, "");
                        for (var i = 1; i <= totalEps; i++) {
                            chapters.push({
                                name: "Episode " + i,
                                url: animeBasePath + "/" + i
                            });
                        }
                    }
                }
            }

            chapters.sort(function(a, b) {
                var numA = parseFloat((a.name.match(/[\d.]+/) || ["0"])[0]);
                var numB = parseFloat((b.name.match(/[\d.]+/) || ["0"])[0]);
                return numB - numA;
            });

            if (chapters.length === 0) {
                chapters.push({ name: "Episode 1", url: fullUrl + "/1" });
            }

            var link = fullUrl;

            return {
                link,
                title,
                imageUrl,
                description,
                genre,
                status,
                chapters
            };
        } catch (e) {
            console.log("getDetail error: " + e);
            return {
                title: "",
                imageUrl: "",
                description: "",
                genre: [],
                status: 5,
                chapters: [{ name: "Episode 1", url: fullUrl + "/1" }]
            };
        }
    }

    async getVideoList(url) {
        var fullUrl = url;
        if (!url.startsWith("http")) {
            if (url.startsWith("/")) fullUrl = this.baseUrl + url;
            else fullUrl = this.baseUrl + "/" + url;
        }

        console.log("getVideoList: " + fullUrl);

        try {
            var res = await this.client.get(fullUrl, this.getHeaders());
            if (res.statusCode !== 200) {
                console.log("getVideoList status: " + res.statusCode);
                return [];
            }

            var html = res.body;
            var doc = new Document(html);
            var videos = [];

            var iframe = doc.selectFirst("iframe");
            if (iframe) {
                var iframeSrc = iframe.attr("src") || "";
                console.log("Found iframe: " + iframeSrc);

                if (iframeSrc) {
                    var iframeUrl = iframeSrc;
                    if (!iframeSrc.startsWith("http")) {
                        if (iframeSrc.startsWith("//")) iframeUrl = "https:" + iframeSrc;
                        else iframeUrl = this.baseUrl + iframeSrc;
                    }

                    try {
                        var iframeRes = await this.client.get(iframeUrl, {
                            "Referer": fullUrl,
                            "Cookie": "__ddg1_=;__ddg2_=;loop-view=thumb",
                            "User-Agent": this.getHeaders()["User-Agent"]
                        });

                        if (iframeRes.statusCode === 200) {
                            var iframeDoc = new Document(iframeRes.body);

                            var sources = iframeDoc.select("video#player > source");
                            console.log("Found video sources: " + sources.length);

                            for (var source of sources) {
                                var src = source.attr("src") || "";
                                var quality = source.attr("title") || "Default";

                                if (src) {
                                    if (!src.startsWith("http")) {
                                        if (src.startsWith("//")) src = "https:" + src;
                                        else src = this.baseUrl + src;
                                    }

                                    videos.push({
                                        url: src,
                                        originalUrl: src,
                                        quality: "HahoMoe - " + quality,
                                        headers: {
                                            "Referer": iframeUrl
                                        }
                                    });
                                    console.log("Added video: " + quality + " -> " + src);
                                }
                            }

                            var iframeHtml = iframeRes.body;
                            var m3u8Matches = iframeHtml.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/g) || [];
                            for (var m3u8 of m3u8Matches) {
                                if (!videos.some(function(v) { return v.url === m3u8; })) {
                                    videos.push({
                                        url: m3u8,
                                        originalUrl: m3u8,
                                        quality: "HahoMoe - HLS",
                                        headers: { "Referer": iframeUrl }
                                    });
                                }
                            }
                        }
                    } catch (iframeErr) {
                        console.log("Iframe fetch error: " + iframeErr);
                    }
                }
            }

            var serverLinks = doc.select("ul.dropdown-menu > li > a.dropdown-item");
            console.log("Found server links: " + serverLinks.length);

            for (var serverLink of serverLinks) {
                try {
                    var href = serverLink.attr("href") || "";
                    if (!href) continue;

                    var vMatch = href.match(/[?&]v=([^&]+)/);
                    if (!vMatch) continue;

                    var embedUrl = this.baseUrl + "/embed?v=" + vMatch[1];
                    var serverName = serverLink.text.replace(/\s+/g, "").replace("/-", "");
                    console.log("Trying server: " + serverName + " -> " + embedUrl);

                    var embedRes = await this.client.get(embedUrl, {
                        "Referer": fullUrl,
                        "Cookie": "__ddg1_=;__ddg2_=;loop-view=thumb",
                        "User-Agent": this.getHeaders()["User-Agent"]
                    });

                    if (embedRes.statusCode === 200) {
                        var embedDoc = new Document(embedRes.body);
                        var embedSources = embedDoc.select("video#player > source");

                        for (var es of embedSources) {
                            var esSrc = es.attr("src") || "";
                            var esQuality = es.attr("title") || "Default";

                            if (esSrc) {
                                if (!esSrc.startsWith("http")) {
                                    if (esSrc.startsWith("//")) esSrc = "https:" + esSrc;
                                    else esSrc = this.baseUrl + esSrc;
                                }

                                if (!videos.some(function(v) { return v.url === esSrc; })) {
                                    videos.push({
                                        url: esSrc,
                                        originalUrl: esSrc,
                                        quality: serverName + " - " + esQuality,
                                        headers: { "Referer": embedUrl }
                                    });
                                    console.log("Added server video: " + serverName + " " + esQuality + " -> " + esSrc);
                                }
                            }
                        }
                    }
                } catch (serverErr) {
                    console.log("Server fetch error: " + serverErr);
                    continue;
                }
            }

            var mp4Matches = html.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/g) || [];
            for (var mp4 of mp4Matches) {
                if (!videos.some(function(v) { return v.url === mp4; })) {
                    videos.push({
                        url: mp4,
                        originalUrl: mp4,
                        quality: "HahoMoe - MP4",
                        headers: { "Referer": fullUrl }
                    });
                }
            }

            console.log("Total videos: " + videos.length);
            return videos;
        } catch (e) {
            console.log("getVideoList error: " + e);
            return [];
        }
    }

    async getPageList(url) {
        return [];
    }

    getFilterList() {
        return [];
    }

    getSourcePreferences() {
        return [];
    }
}
