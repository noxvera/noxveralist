import { fetchLeaderboard } from '../content.js';
import { localize, getFontColour } from '../util.js';
import { store } from '../main.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
		store,
        searchQuery: '',
    }),
    template: `
       <main v-if="loading">
        <Spinner></Spinner>
    </main>
    <main v-else class="page-leaderboard-container">
        <div class="page-leaderboard">
            <div class="error-container">
                <p class="error" v-if="err.length > 0">
                    Leaderboard may be incorrect, as the following maps could not be loaded: {{ err.join(', ') }}
                </p>
            </div>
            <div class="board-container">
                <div class="search-bar">
					<img :src="\`/assets/search\${store.dark ? '-dark' : ''}.svg\`" alt="Search icon">
                    <input v-model="searchQuery" type="text" placeholder="Search user" />
                </div>
                <table class="board">
                    <tr v-for="entry in filteredLeaderboard">
                        <td class="rank">
                            <p class="type-label-lg">#{{ entry.position }}</p>
                        </td>
                        <td class="total">
                            <p class="type-label-lg">{{ entry.user === 'Unverified' ? '-' : localize(entry.total) }}</p>
                        </td>
                        <td class="user" :class="{ 'active': selected == entry.position - 1 }">
                            <button @click="selected = entry.position - 1">
                                <span class="type-label-lg">{{ entry.user }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="player-container">
                <div class="player">
                    <h1>#{{ selected + 1 }} {{ entry.user }}</h1>
                    <h3 class="bold-line">
                        {{ localize(entry.total, false) }} points<span v-if="entry.user !== 'Unverified' && entry.verified.length > 0">,
                            Hardest: {{ entry.verified[0].level }}
                            <span v-if="entry.verified[0].rank"> (#{{ entry.verified[0].rank }})</span>
                        </span>
                    </h3>
                    <div class="packs" v-if="entry.packs.length > 0">
                        <div v-for="pack in entry.packs" class="tag" :style="{background:pack.colour, color:getFontColour(pack.colour)}">
                            {{pack.name}}
                        </div>
                    </div>
                    <h2> {{ entry.user === 'Unverified' ? 'Unverified' : 'Verified' }} ({{ entry.verified.length }}) </h2>
                    <table class="table">
                        <tr v-for="score in entry.verified">
                            <td class="rank">
                                <p>#{{ score.rank }}</p>
                            </td>
                            <td class="level">
                                <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                            </td>
                            <td class="score">
                                <p>+{{ localize(score.score) }}</p>
                            </td>
                        </tr>
                    </table>
                    <h2 v-if="entry.completed.length > 0">Completed ({{ entry.completed.length }})</h2>
                    <table class="table">
                        <tr v-for="score in entry.completed">
                            <td class="rank">
                                <p>#{{ score.rank }}</p>
                            </td>
                            <td class="level">
                                <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                            </td>
                            <td class="score">
                                <p>+{{ localize(score.score) }}</p>
                            </td>
                        </tr>
                    </table>
                    <h2 v-if="entry.progressed.length > 0">Progressed ({{entry.progressed.length}})</h2>
                    <table class="table">
                        <tr v-for="score in entry.progressed">
                            <td class="rank">
                                <p>#{{ score.rank }}</p>
                            </td>
                            <td class="level">
                                <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                            </td>
                            <td class="score">
                                <p>+{{ localize(score.score) }}</p>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    </main>
    `,
    computed: {
        entry() {
            return this.leaderboard[this.selected];
        },
        filteredLeaderboard() {
            if (!this.searchQuery) {
                return this.leaderboard;
            }
            const query = this.searchQuery.toLowerCase();
            return this.leaderboard.filter(ientry => ientry?.user?.toLowerCase()?.includes(query));
        },
    },
    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        const verified = [];
        const unverified = [];

        for (const entry of leaderboard) {
            if (entry.user === "N/A") {
                entry.user = "Unverified";
                unverified.push(entry);
            } else {
                verified.push(entry);
            }
        }

        this.leaderboard = [...verified, ...unverified];

        this.leaderboard.forEach((entry, index) => {
            entry.position = index + 1;
        });

        this.err = err;
        this.loading = false;
    },

    methods: {
        localize,
        getFontColour,
    },
};
