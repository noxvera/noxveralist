import { round, score } from './score.js';
const dir = '/data';

function parsePercent(p) {
    return parseFloat(String(p).replace('*', ''));
}

function mapNames(level, nameMap) {
    return {
        ...level,
        verifier: nameMap[level.verifier] || level.verifier,
        publisher: nameMap[level.publisher] || level.publisher,
        creators: level.creators.map(c => nameMap[c] || c),
        records: level.records.map(r => ({
            ...r,
            user: nameMap[r.user] || r.user,
        })),
    };
}

export async function fetchList() {
    try {
        const [listResult, packResult, nameMap] = await Promise.all([
            fetch(`${dir}/_list.json`),
            fetch(`${dir}/_packlist.json`),
            fetchNameMap(),
        ]);
        const [list, packsList] = await Promise.all([
            listResult.json(),
            packResult.json(),
        ]);
        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    const level = await (await fetch(`${dir}/${path}.json`)).json();
                    const mapped = mapNames(level, nameMap);
                    const packs = packsList.filter(p => p.levels.includes(path));

                    return [{ ...mapped, packs, path }, null];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const [editorsRes, nameMap] = await Promise.all([
            fetch(`${dir}/_editors.json`),
            fetchNameMap(),
        ]);
        const editors = await editorsRes.json();
        return editors.map(e => ({
            ...e,
            name: nameMap[e.name] || e.name,
        }));
    } catch {
        return null;
    }
}

export async function fetchNameMap() {
    try {
        const res = await fetch(`${dir}/_name_map.json`);
        return await res.json();
    } catch {
        return {};
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();
    const packResult = await (await fetch(`${dir}/_packlist.json`)).json();
    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }
        level.percentToQualify = parsePercent(level.percentToQualify);
        scoreMap[level.verifier] ??= {
            verified: [], completed: [], progressed: [], packs: [],
        };
        scoreMap[level.verifier].verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
            path: level.path,
        });
        level.records.forEach(record => {
            scoreMap[record.user] ??= {
                verified: [], completed: [], progressed: [], packs: [],
            };
            if (record.percent === 100) {
                scoreMap[record.user].completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                    path: level.path,
                });
            } else {
                scoreMap[record.user].progressed.push({
                    rank: rank + 1,
                    level: level.name,
                    percent: record.percent,
                    score: score(rank + 1, record.percent, level.percentToQualify),
                    link: record.link,
                    path: level.path,
                });
            }
        });
    });
    // Handle packs
    for (let [username, data] of Object.entries(scoreMap)) {
        let levels = [...data.verified, ...data.completed].map(x => x.path);
        for (let pack of packResult) {
            if (!pack.levels || pack.levels.length === 0) continue;
            if (pack.levels.every(e1 => levels.includes(e1))) {
                data.packs.push(pack);
            }
        }
    }
    // Wrap in extra Object containing the user and total score
    let res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });
    res.sort((a, b) => b.total - a.total);
    res = res.map((entry, index) => ({
        position: index + 1,
        ...entry,
    }));
    // Map user to their name
    const nameMap = await fetchNameMap();
    res = res.map(entry => ({
        ...entry,
        user: nameMap[entry.user] || entry.user,
    }));
    return [res, errs];
}

export async function fetchPacks() {
    try {
        return await (await fetch(`${dir}/_packlist.json`)).json();
    } catch {
        return null;
    }
}

export async function fetchPackLevels(packname) {
    try {
        const [packResult, nameMap] = await Promise.all([
            fetch(`${dir}/_packlist.json`),
            fetchNameMap(),
        ]);
        const packsList = await packResult.json();
        const selectedPack = packsList.find(pack => pack.name == packname);

        return await Promise.all(
            selectedPack.levels.map(async (path, rank) => {
                try {
                    const level = await (await fetch(`${dir}/${path}.json`)).json();
                    const mapped = mapNames(level, nameMap);
                    mapped.percentToQualifyRaw = mapped.percentToQualify;
                    mapped.percentToQualify = parsePercent(mapped.percentToQualify);
                    return [{ level: mapped, path }, null];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch (e) {
        console.error(`Failed to load packs.`, e);
        return null;
    }
}

export async function getIdClass(id) {
    const idStr = String(id);
    if (idStr.includes('cancelled') || idStr.includes('lost')) return 'red-id';
    if (idStr.includes('unfinished')) return 'yellow-id';
    return '';
}

export async function fetchChangelog() {
    const res = await fetch('/data/_changelog.json');
    return await res.json();
}

export const availableTags = [
    'released', 'verified', 'unverified', 'challenge', 'high effort', /* 'NONG', 'no progress' */
];
