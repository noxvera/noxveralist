// https://stackoverflow.com/questions/3452546
export function getYoutubeIdFromUrl(url) {
    return url.match(
        /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/
    )?.[1] ?? '';
}

function parseTimeToSeconds(time) {
    if (!time) return 0;
    if (/^\d+$/.test(time)) return parseInt(time, 10);

    const regex = /(\d+)(h|m|s)/g;
    let totalSeconds = 0, match;

    while ((match = regex.exec(time)) !== null) {
        const value = parseInt(match[1], 10);
        switch (match[2]) {
            case 'h': totalSeconds += value * 3600; break;
            case 'm': totalSeconds += value * 60; break;
            case 's': totalSeconds += value; break;
        }
    }
    return totalSeconds || parseInt(time, 10) || 0;
}

export function embed(video) {
    if (!video) return 'https://www.youtube.com/embed/invalid';

    let startSeconds = null;
    try {
        const url = new URL(video, 'https://example.com');
        const t = url.searchParams.get('t') || url.searchParams.get('start');
        if (t) startSeconds = parseTimeToSeconds(t);
        if (url.hash) {
            const m = url.hash.substring(1).match(/t=([\dhms]+)/i);
            if (m) startSeconds = parseTimeToSeconds(m[1]);
        }
    } catch {
        // ignore if invalid url
    }

    const id = getYoutubeIdFromUrl(video);
    if (!id) return 'https://www.youtube.com/embed/invalid';

    return `https://www.youtube.com/embed/${id}${startSeconds ? `?start=${startSeconds}` : ''}`;
}

export function localize(number, useCommas = true, decimals = 2) {
    const fixed = Number(number).toFixed(decimals);
    return useCommas ? fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : fixed;
}

export function getThumbnailFromId(id) {
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

// https://stackoverflow.com/questions/2450954
export function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex) {
        const randomIndex = Math.floor(Math.random() * currentIndex--);
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// https://stackoverflow.com/a/44615197
export function getFontColour(hex) {
    const getRGB = (c) => parseInt(c, 16) || 0;
    const getsRGB = (c) => {
        const v = getRGB(c) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const getLuminance = (h) =>
        0.2126 * getsRGB(h.substr(1, 2)) +
        0.7152 * getsRGB(h.substr(3, 2)) +
        0.0722 * getsRGB(h.substr(-2));
    const contrast = (f, b) => {
        const L1 = getLuminance(f), L2 = getLuminance(b);
        return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    };
    return contrast(hex, "#ffffff") > contrast(hex, "#000000") ? "#ffffff" : "#000000";
}

export function getTags(level) {
    const tags = [];

    if (level.challenge) tags.push("challenge");
    if (level.higheffort) tags.push("high effort");

    const idStr = String(level.id).toLowerCase();
    if (!["n/a", "unfinished", "cancelled", "lost", "unreleased"].some(flag => idStr.includes(flag))) {
        tags.push("released");
    }

    tags.push(level.verifier && level.verifier.toLowerCase() !== "n/a" ? "verified" : "unverified");
    if (level.song === "NONG") tags.push("NONG");
    if (!level.records?.length) tags.push("no progress");

    return tags;
}
