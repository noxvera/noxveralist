import { fetchLeaderboard } from '../content.js';
import { localize, getFontColour } from '../util.js';
import { store } from '../main.js';

import Spinner from '../components/Spinner.js';

export default {
    components: { Spinner },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
        store,
        searchQuery: '',
        toasts: [],
    }),
    template: `
        <main v-if="loading">
            <Spinner/>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                <p class="error" v-if="err.length">
                    Leaderboard may be incorrect, as the following maps could not be loaded: {{ err.join(', ') }}
                </p>
                </div>
                <div class="board-container">
                <div class="search-bar">
                    <img :src="\`/assets/search\${store.dark ? '-dark' : ''}.svg\`" alt="Search icon">
                    <input v-model="searchQuery" type="text" placeholder="Search user" />
                </div>
                <table class="board">
                    <tr v-for="entry in filteredLeaderboard" :key="entry.user + '-' + entry.position">
                    <td class="rank"><p class="type-label-lg">#{{ entry.position }}</p></td>
                    <td class="total"><p class="type-label-lg">{{ entry.user === 'Uncleared' ? 'bruh' : localize(entry.total, false) }}</p></td>
                    <td class="user" :class="{ active: selected === entry.position - 1 }">
                        <button @click="selected = entry.position - 1">
                        <span class="type-label-lg">{{ entry.user }}</span>
                        </button>
                    </td>
                    </tr>
                </table>
                </div>
                <div class="player-container" v-if="entry">
                    <div class="player">
                        <h1>#{{ selected + 1 }} {{ entry.user }}</h1>
                        <h3 class="bold-line">
                            {{ localize(entry.total, false) }} points<span v-if="entry.user !== 'Uncleared' && entry.verified.length > 0">,
                            Hardest: {{ entry.verified[0].level }}
                            <span v-if="entry.verified[0].rank"> (#{{ entry.verified[0].rank }})</span>
                        </h3>
                        <div class="packs" v-if="entry.packs.length">
                            <div v-for="pack in entry.packs" :key="pack.name" class="tag" :style="{ background: pack.colour, color: getFontColour(pack.colour) }">
                                {{ pack.name }}
                            </div>
                        </div>
                        <h2>{{ entry.user === 'Uncleared' ? 'Uncleared' : 'Verified' }} ({{ entry.verified.length }})</h2>
                        <table class="table">
                            <tr v-for="score in entry.verified" :key="'v-' + score.level + '-' + score.rank">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level"><a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a></td>
                                <td class="score"><p>+{{ localize(score.score) }}</p></td>
                            </tr>
                        </table>
                        <h2 v-if="entry.completed.length">Cleared ({{ entry.completed.length }})</h2>
                        <table class="table" v-if="entry.completed.length">
                            <tr v-for="score in entry.completed" :key="'c-' + score.level + '-' + score.rank">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level"><a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a></td>
                                <td class="score"><p>+{{ localize(score.score) }}</p></td>
                            </tr>
                        </table>
                        <h2 v-if="entry.progressed.length">Progressed ({{ entry.progressed.length }})</h2>
                        <table class="table" v-if="entry.progressed.length">
                            <tr v-for="score in entry.progressed" :key="'p-' + score.level + '-' + score.rank + '-' + score.percent">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                </td>
                                <td class="score"><p>+{{ localize(score.score) }}</p></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            <div class="toast-container">
                <transition-group name="toast" tag="div" class="toast-stack">
                    <div v-for="(toast, i) in toasts" :key="toast.id" class="toast">
                        <button class="toast-close" @click="removeToast(i)">×</button>
                        {{ toast.message }}
                    </div>
                </transition-group>
            </div>
        </main>
    `,
    computed: {
        entry() {
        return this.leaderboard[this.selected] || null;
        },
        filteredLeaderboard() {
        const q = this.searchQuery.trim().toLowerCase();
        if (!q) return this.leaderboard;
        return this.leaderboard.filter(e => e.user && e.user.toLowerCase().includes(q));
        },
    },
    async mounted() {
        const [raw, err] = await fetchLeaderboard();
        // Normalize and then place "Uncleared" at the end
        const normalized = raw.map(e => ({
            ...e,
            user: e.user === 'N/A' ? 'Uncleared' : e.user
        }));
        normalized.sort((a, b) => (a.user === 'Uncleared') - (b.user === 'Uncleared'));
        normalized.forEach((e, i) => (e.position = i + 1));

        this.leaderboard = normalized;
        this.err = err;
        this.loading = false;
        window.addEventListener('add-toast', this.handleToastEvent);
    },
    beforeUnmount() {
        window.removeEventListener('add-toast', this.handleToastEvent);
    },
    methods: {
        handleToastEvent(e) {
            const toast = { id: Date.now() + Math.random(), message: e.detail.message };
            this.toasts.push(toast);
            setTimeout(() => this.removeToastById(toast.id), 4000);
        },
        removeToast(i) { this.toasts.splice(i, 1); },
        removeToastById(id) { this.toasts = this.toasts.filter(t => t.id !== id); },
        localize,
        getFontColour,
    },
};
