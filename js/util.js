// https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
export function getYoutubeIdFromUrl(url) {
    return url.match(
        /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/,
    )?.[1] ?? '';
}

function parseTimeToSeconds(time) {

    if (!time) return 0;

    if (/^\d+$/.test(time)) {
        return parseInt(time, 10);
    }

    const regex = /(\d+)(h|m|s)/g;
    let totalSeconds = 0;
    let match;
    while ((match = regex.exec(time)) !== null) {
        const value = parseInt(match[1], 10);
        const unit = match[2];
        if (unit === 'h') totalSeconds += value * 3600;
        else if (unit === 'm') totalSeconds += value * 60;
        else if (unit === 's') totalSeconds += value;
    }

    if (totalSeconds === 0) {
        return parseInt(time, 10) || 0;
    }

    return totalSeconds;
}

export function embed(video) {
    if (!video) return 'https://www.youtube.com/embed/invalid'; //return empty if no url

    let startSeconds = null;
    try {
        const url = new URL(video, 'https://example.com');
        const t = url.searchParams.get('t') || url.searchParams.get('start');
        if (t) startSeconds = parseTimeToSeconds(t);

        // check for t=
        if (url.hash) {
        const hash = url.hash.substring(1);
        const m = hash.match(/t=([\dhms]+)/i);
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
    if (!useCommas) return fixed;
    return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


export function getThumbnailFromId(id) {
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}

// https://stackoverflow.com/a/44615197
export function getFontColour(hex){
    function getRGB(c) {
        return parseInt(c, 16) || c;
    }
      
      function getsRGB(c) {
        return getRGB(c) / 255 <= 0.03928
          ? getRGB(c) / 255 / 12.92
          : Math.pow((getRGB(c) / 255 + 0.055) / 1.055, 2.4);
    }
      
      function getLuminance(hexColor) {
        return (
          0.2126 * getsRGB(hexColor.substr(1, 2)) +
          0.7152 * getsRGB(hexColor.substr(3, 2)) +
          0.0722 * getsRGB(hexColor.substr(-2))
        );
    }
      
      function getContrast(f, b) {
        const L1 = getLuminance(f);
        const L2 = getLuminance(b);
        return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    }

    const whiteContrast = getContrast(hex, "#ffffff");
    const blackContrast = getContrast(hex, "#000000");
    
    return whiteContrast > blackContrast ? "#ffffff" : "#000000";
}

export function getTags(level) {
    const tags = [];

    if (level.challenge) tags.push("challenge");
    if (level.higheffort) tags.push("high effort");

    const idStr = String(level.id).toLowerCase();
    if (!idStr.includes("n/a") && !idStr.includes("unfinished") && !idStr.includes("cancelled") && !idStr.includes("lost") && !idStr.includes("unreleased")) {
        tags.push("released");
    }

    if (level.verifier && level.verifier.toLowerCase() !== "n/a") {
        tags.push("verified");
    } else {
        tags.push("unverified");
    }

    if (level.song === "NONG") {
        tags.push("NONG");
    }

    if (!level.records || level.records.length === 0) {
        tags.push("no progress");
    }

    return tags;
}
