import { fetchList } from '../content.js';
import { getThumbnailFromId, getYoutubeIdFromUrl, shuffle } from '../util.js';

import Spinner from '../components/Spinner.js';
import Btn from '../components/Btn.js';

export default {
    components: { Spinner, Btn },
    template: `
        <main v-if="loading">
            <Spinner/>
        </main>
        <main v-else class="page-roulette">
            <div class="sidebar">
                <p class="type-label-md">
                    I've kept this here but you probably shouldn't use this since many maps are unfinished/lost.
                </p>
                <p class="type-label-md" style="color: #aaa">
                    Shameless copy of the Extreme Demon Roulette by
                    <a href="https://matcool.github.io/extreme-demon-roulette/" target="_blank">matcool</a>.
                </p>
                <form class="options">
                    <div class="check">
                        <input type="checkbox" id="main" v-model="useMainList">
                        <label for="main">Main List</label>
                    </div>
                    <div class="check">
                        <input type="checkbox" id="extended" v-model="useExtendedList">
                        <label for="extended">Extended List</label>
                    </div>
                    <Btn @click.native.prevent="onStart">
                        {{ levels.length === 0 ? 'Start' : 'Restart' }}
                    </Btn>
                </form>
                <p class="type-label-md" style="color: #aaa">The roulette saves automatically.</p>
                <form class="save">
                    <p>Manual Load/Save</p>
                    <div class="btns">
                        <Btn @click.native.prevent="onImport">Import</Btn>
                        <Btn :disabled="!isActive" @click.native.prevent="onExport">Export</Btn>
                    </div>
                </form>
            </div>
            <section class="levels-container">
                <div class="levels">
                    <template v-if="levels.length > 0">
                        <div v-for="(level, i) in completedLevels" :key="i" class="level">
                            <a :href="level.video" class="video">
                                <img :src="getThumbnailFromId(getYoutubeIdFromUrl(level.video))" alt="">
                            </a>
                            <div class="meta">
                                <p>#{{ level.rank }}</p>
                                <h2>{{ level.name }}</h2>
                                <p style="color: #00b54b; font-weight: 700">{{ progression[i] }}%</p>
                            </div>
                        </div>
                        <div v-if="!hasCompleted && currentLevel" class="level">
                            <a :href="currentLevel.video" target="_blank" class="video">
                                <img :src="getThumbnailFromId(getYoutubeIdFromUrl(currentLevel.video))" alt="">
                            </a>
                            <div class="meta">
                                <p>#{{ currentLevel.rank }}</p>
                                <h2>{{ currentLevel.name }}</h2>
                                <p>{{ currentLevel.id }}</p>
                            </div>
                            <form v-if="!givenUp" class="actions">
                                <input type="number" v-model.number="percentage" :placeholder="placeholder" :min="currentPercentage + 1" max="100">
                                <Btn @click.native.prevent="onDone">Done</Btn>
                                <Btn @click.native.prevent="onGiveUp" style="background-color: #e91e63;">Give Up</Btn>
                            </form>
                        </div>
                        <div v-if="givenUp || hasCompleted" class="results">
                            <h1>Results</h1>
                            <p>Number of maps: {{ progression.length }}</p>
                            <p>Highest percent: {{ currentPercentage }}%</p>
                            <Btn v-if="currentPercentage < 99 && !hasCompleted" @click.native.prevent="showRemaining = true">
                                Show remaining maps
                            </Btn>
                        </div>
                        <template v-if="givenUp && showRemaining">
                            <div v-for="(level, i) in remainingLevels" :key="i" class="level">
                                <a v-if="level.video" :href="level.video" target="_blank" class="video">
                                    <img :src="getThumbnailFromId(getYoutubeIdFromUrl(level.video))" alt="">
                                </a>
                                <div v-else class="video" style="background: #333; display: flex; align-items: center; justify-content: center;">
                                    <p>No video</p>
                                </div>
                                <div class="meta">
                                    <p>#{{ level.rank }}</p>
                                    <h2>{{ level.name }}</h2>
                                    <p style="color: #d50000; font-weight: 700">{{ currentPercentage + 2 + i }}%</p>
                                </div>
                            </div>
                        </template>
                    </template>
                </div>
            </section>
            <div class="toast-container">
                <transition-group name="toast" tag="div" class="toast-stack">
                    <div v-for="toast in toasts" :key="toast.id" class="toast">
                        <button class="toast-close" @click="removeToastById(toast.id)">×</button>
                        {{ toast.message }}
                    </div>
                </transition-group>
            </div>
        </main>
    `,
    data: () => ({
        loading: false,
        levels: [],
        progression: [],
        percentage: undefined,
        givenUp: false,
        showRemaining: false,
        useMainList: true,
        useExtendedList: true,
        toasts: [],
        fileInput: null,
    }),
    mounted() {
        window.addEventListener('add-toast', this.handleToastEvent);
        this.fileInput = Object.assign(document.createElement('input'), { type: 'file', accept: '.json' });
        this.fileInput.addEventListener('change', this.onImportUpload);
        const saved = localStorage.getItem('roulette');
        if (saved) {
            const { levels, progression } = JSON.parse(saved);
            this.levels = levels;
            this.progression = progression;
        }
    },
    beforeUnmount() {
        window.removeEventListener('add-toast', this.handleToastEvent);
    },
    computed: {
        currentLevel() { return this.levels[this.progression.length]; },
        currentPercentage() { return this.progression[this.progression.length - 1] || 0; },
        placeholder() { return `At least ${this.currentPercentage + 1}%`; },
        hasCompleted() { return this.progression[this.progression.length - 1] >= 100 || this.progression.length === this.levels.length; },
        isActive() { return this.progression.length > 0 && !this.givenUp && !this.hasCompleted; },
        completedLevels() { return this.levels.slice(0, this.progression.length); },
        remainingLevels() { return this.levels.slice(this.progression.length + 1, this.levels.length - this.currentPercentage + this.progression.length); },
    },
    methods: {
        shuffle, getThumbnailFromId, getYoutubeIdFromUrl,
        async onStart() {
            if (this.isActive) return this.showToast('Give up before starting a new roulette.');
            if (!this.useMainList && !this.useExtendedList) return;
            this.loading = true;
            const fullList = await fetchList();
            if (fullList.some(([_, err]) => err)) {
                this.loading = false;
                return this.showToast("List is currently broken. Wait until it's fixed to start a roulette.");
            }
            const fullListMapped = fullList.map(([lvl], i) => ({
                rank: i + 1, id: lvl.id, name: lvl.name,
                video: lvl.videos?.[0]?.url ?? lvl.verification,
            }));
            const list = [...(this.useMainList ? fullListMapped.slice(0, 100) : []), ...(this.useExtendedList ? fullListMapped.slice(100, 200) : [])];
            this.levels = shuffle(list).slice(0, 100);
            this.progression = [];
            this.percentage = undefined;
            this.givenUp = false;
            this.showRemaining = false;
            this.loading = false;
        },
        save() { localStorage.setItem('roulette', JSON.stringify({ levels: this.levels, progression: this.progression })); },
        onDone() {
            if (!this.percentage || this.percentage <= this.currentPercentage || this.percentage > 100) return this.showToast('Invalid percentage.');
            this.progression.push(this.percentage);
            this.percentage = undefined;
            this.save();
        },
        onGiveUp() {
            this.givenUp = true;
            localStorage.removeItem('roulette');
        },
        onImport() {
            if (this.isActive && !confirm('This will overwrite the current run. Continue?')) return;
            this.fileInput.click();
        },
        async onImportUpload() {
            if (!this.fileInput.files.length) return;
            const file = this.fileInput.files[0];
            if (file.type !== 'application/json') return this.showToast('Invalid file.');
            try {
                const roulette = JSON.parse(await file.text());
                if (!roulette.levels || !roulette.progression) return this.showToast('Invalid file.');
                this.levels = roulette.levels;
                this.progression = roulette.progression;
                this.percentage = undefined;
                this.givenUp = false;
                this.showRemaining = false;
                this.save();
            } catch { this.showToast('Invalid file.'); }
        },
        onExport() {
            const url = URL.createObjectURL(new Blob([JSON.stringify({ levels: this.levels, progression: this.progression })], { type: 'application/json' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'nxl_roulette.json';
            a.click();
            URL.revokeObjectURL(url);
        },
        showToast(msg, duration = 4000) {
            const toast = { id: Date.now() + Math.random(), message: msg };
            this.toasts.push(toast);
            setTimeout(() => this.removeToastById(toast.id), duration);
        },
        handleToastEvent(e) {
            const toast = { id: Date.now() + Math.random(), message: e.detail.message };
            this.toasts.push(toast);
            setTimeout(() => this.removeToastById(toast.id), 4000);
        },
        removeToastById(id) { this.toasts = this.toasts.filter(t => t.id !== id); },
    },
};
