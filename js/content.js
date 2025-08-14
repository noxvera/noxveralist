import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    const packResult = await fetch(`${dir}/_packlist.json`);
    const nameMap = await fetchNameMap();
    try {
        const list = await listResult.json();
        const packsList = await packResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    level.verifier = nameMap[level.verifier] || level.verifier;
                    level.author = nameMap[level.author] || level.author;
                    level.creators = level.creators.map((creator) => nameMap[creator] || creator);
                    let packs = packsList.filter((x) =>
                        x.levels.includes(path)
                    );
                    return [
                        {
                            ...level,
                            packs,
                            path,
                            records: level.records.map((record) => {
                                record.user = nameMap[record.user] || record.user;
                                return record;
                            }),
                        },
                        null,
                    ];
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
    const nameMap = await fetchNameMap();
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = (await editorsResults.json()).map((editor) => {
            return {
                ...editor,
                name: nameMap[editor.name] || editor.name,
            }   
        });
        return editors;
    } catch {
        return null;
    }
}

export async function fetchNameMap() {
    try {
        const nameMapResults = await fetch(`${dir}/_name_map.json`);
        const nameMap = await nameMapResults.json();
        return nameMap;
    } catch {
        return null;
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

        level.percentToQualify = parseFloat(String(level.percentToQualify).replace('*', ''));

        // Verification
        const verifier = Object.keys(scoreMap).find(
            (u) => u === level.verifier,
        ) || level.verifier;
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
            packs: [],
        };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
            path: level.path,
        });

        // Records
        level.records.forEach((record) => {
            const user = Object.keys(scoreMap).find(
                (u) => u === record.user,
            ) || record.user;
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
                packs: [],
            };
            const { completed, progressed } = scoreMap[user];
            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                    path: level.path,
                });
                return;
            }

            progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                score: score(rank + 1, record.percent, level.percentToQualify),
                link: record.link,
                path: level.path,
            });
        });
    });
    for (let user of Object.entries(scoreMap)) {
        let levels = [...user[1]["verified"], ...user[1]["completed"]].map(
            (x) => x["path"]
        );
        for (let pack of packResult) {
            if (pack.levels.every((e1) => levels.includes(e1))) {
                user[1]["packs"].push(pack);
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

	// Sort by total score
	res.sort((a, b) => b.total - a.total);

    // Add rank to each user
    res = res.map((entry, index) => ({
        position: index + 1,
        ...entry
    }));

    
    // Map user to their name
    const nameMap = await fetchNameMap();
    res = res.map((entry) => {
        let user = entry.user;
        let name = nameMap[user] || user;
        
        return {
            ...entry,
            user: name
        };
    });

    return [res, errs];
    
}

export async function fetchPacks() {
    try {
        const packResult = await fetch(`${dir}/_packlist.json`);
        const packsList = await packResult.json();
        return packsList;
    } catch {
        return null;
    }
}

export async function fetchPackLevels(packname) {
    const packResult = await fetch(`${dir}/_packlist.json`);
    const packsList = await packResult.json();
    const selectedPack = await packsList.find((pack) => pack.name == packname);
    const nameMap = await fetchNameMap();
    try {
        return await Promise.all(
            selectedPack.levels.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    // level.percentToQualify = parseFloat(String(level.percentToQualify).replace(/\*/g, ''));
                    level.percentToQualifyRaw = level.percentToQualify;
                    level.percentToQualify = parseFloat(String(level.percentToQualify).replace('*', ''));
                    level.verifier = nameMap[level.verifier] || level.verifier;
                    level.author = nameMap[level.author] || level.author;
                    level.creators = level.creators.map((creator) => nameMap[creator] || creator);


                    return [
                        {
                            level,
                            path,
                            records: level.records.map((record) => {
                                record.user = nameMap[record.user] || record.user;
                                return record;
                            }),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            })
        );
    } catch (e) {
        console.error(`Failed to load packs.`, e);
        return null;
    }
}

export async function getIdClass(id) {
    const idStr = typeof id === 'string' ? id : String(id);
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