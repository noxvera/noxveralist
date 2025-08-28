import { store } from '../main.js';
import { embed, getFontColour, getTags } from '../util.js';
import { score } from '../score.js';
import { fetchEditors, fetchList, availableTags } from '../content.js';

import Spinner from '../components/Spinner.js';
import LevelAuthors from '../components/List/LevelAuthors.js';

const roleIconMap = {
    owner: 'crown',
    admin: 'user-gear',
    helper: 'user-shield',
    dev: 'code',
    trial: 'user-lock',
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading"><Spinner/></main>
        <main v-else class="page-list shared-list">
            <div class="list-container">
                <div class="search-bar search-container">
                    <img :src="'/assets/search' + (store.dark ? '-dark' : '') + '.svg'" alt="Search icon">
                    <input v-model="searchQuery" type="text" placeholder="Search map (e.g., 'zick')"/>
                    <button class="filter-button" @click="showTagMenu = true">
                        <img src=/assets/funnel.svg alt="Filter" class="filter-icon"/> ${/* https://lucide.dev/icons/funnel */''}
                    </button>
                </div>
                <transition name="overlay" appear>
                    <div v-if="showTagMenu" class="tag-popup-overlay" @click.self="closeFilterMenu">
                        <transition name="popup" appear>
                            <div class="tag-popup" @click.stop>
                                <button class="close-x" @click="closeFilterMenu">×</button>
                                <h3>Filter by Tags</h3>
                                <div class="tag-list">
                                    <label v-for="tag in availableTags" :key="tag">
                                        <input type="checkbox" :value="tag" v-model="selectedTags"/>
                                        {{ tag }}
                                    </label>
                                </div>
                                <div class="close-wrapper">
                                    <button class="close-btn" @click="closeFilterMenu">Close</button>
                                </div>
                            </div>
                        </transition>
                    </div>
                </transition>
                <table class="list" v-if="filteredList.length">
                    <tr v-for="([level, err], i) in filteredList" :key="i">
                        <td class="rank">
                            <p class="type-label-lg">
                                {{ (level?.originalIndex + 1) <= 200 ? '#' + (level.originalIndex + 1) : 'Legacy' }}
                            </p>
                        </td>
                        <td class="level" :class="{ error: !level }">
                            <div :class="{ active: selectedLevel === level }">
                                <button 
                                    @click="selectedLevel = level" 
                                    :class="{ 'highlight-higheffort': level?.higheffort }">
                                    <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                                    <span v-if="level.subtitle" class="subtitle">{{ level.subtitle }}</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div v-if="level" class="level">
                    <h1>{{ level.name }}</h1>
                    <div class="divider-line"></div>
                    <p v-if="level.description" class="level-description">
                        <template v-for="(part, i) in parseDescription(level.description)" :key="i">
                            <a v-if="part.type === 'link'" :href="part.href" target="_blank" rel="noopener" class="link-icon link-hover-underline">{{ part.text }}</a>
                            <span v-else>{{ part.text }}</span>
                        </template>
                    </p>
                    <p v-else class="level-description">No description has been added yet.</p>
                    <LevelAuthors :publisher="level.publisher" :creators="level.creators" :verifier="level.verifier" />
                    <div v-if="level.packs.length" class="packs">
                        <div v-for="pack in level.packs" :key="pack.name" class="tag" :style="{ background: pack.colour, color: getFontColour(pack.colour) || '#000' }">
                            <p>{{ pack.name }}</p>
                        </div>
                    </div>
                    <iframe class="video" :src="embed(level.verification)" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(level.originalIndex + 1, 100, parseFloat(String(level.percentToQualify).replace('*', ''))) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p 
                            :class="[
                                String(level.id ?? '').includes('cancelled') || String(level.id ?? '').includes('lost') 
                                    ? 'red-id' 
                                    : (String(level.id ?? '').includes('unfinished') ? 'yellow-id' : ''), 
                                'copyable-id'
                            ]"
                            @click="copyId(level.id)" title="Click to copy">
                            {{ level.id }}
                            </p>
                        </li>
                        <li>
                            <div class="type-title-sm">Song</div>
                            <p>
                                <a v-if="/^[0-9]+$/.test(level.song)" 
                                   :href="'https://www.newgrounds.com/audio/listen/' + level.song" 
                                   target="_blank" rel="noopener" class="link-icon link-hover-underline">
                                    {{ level.song }}
                                </a>
                                <template v-else>{{ level.song || 'default' }}</template>
                            </p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="level.originalIndex + 1 <= 200">
                        <strong>{{ parseFloat(String(level.percentToQualify).replace('*', '')) }}%<span v-if="String(level.percentToQualify).includes('*')">*</span></strong> or better to qualify
                    </p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" :key="record.user" class="record">
                            <td class="percent"><p>{{ record.percent }}%</p></td>
                            <td class="user"><a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a></td>
                            <td class="mobile"><img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile"></td>
                            <td class="hz"><p>{{ record.hz }}Hz</p></td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level no-results"><p>No results</p></div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length">
                        <p v-for="error of errors" :key="error" class="error">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Original Layout by <a class="link-hover-underline link-icon" href="https://tsl.pages.dev/#/" target="_blank">TSL</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors" :key="editor.name">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link-hover-underline" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Important Notes (please read!!)</h3>
                    <p> - Maps on the list highlighted <span style="color:#ffd700;">Gold</span> are maps I consider to have actual effort put into them (though they might still be bad). </p>
                    <p>
                        - Qualifying percentages with an asterisk (*) indicate that it is a 2.1 percentage. 
                        You can use the <a href="https://geode-sdk.org/mods/zsa.percentage-toggle" class="link-hover-underline link-icon" target="_blank">percentage toggle mod</a> to view 2.1 percentages in-game.
                    </p>
                    <p> 
                        - <a href="https://gdbrowser.com/u/1kv" class="link-hover-underline link-icon" target="_blank">1kV</a>, 
                        <a href="https://gdbrowser.com/u/cyrobyte" class="link-hover-underline link-icon" target="_blank">Cyrobyte</a>, 
                        and <a href="https://gdbrowser.com/search/19952001?user" class="link-hover-underline link-icon" target="_blank">someone (green user)</a> are all accounts belonging to me.
                    </p>
                    <p> - Maps in the top [16] are all probably above top 1/<a href="https://impossiblelevels.com/" class="link-hover-underline link-icon" target="_blank" >ILL difficulty</a>. </p>
                    <h3 style="color: #4fb6fcff"><u><a href="/assets/docs/guidelines.pdf" target="_blank">Submission Requirements</a></u></h3>
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
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        errors: [],
        roleIconMap,
        store,
        searchQuery: '',
        selectedLevel: null,
        selectedTags: JSON.parse(localStorage.getItem('selectedTags')) || [],
        showTagMenu: false,
        availableTags,
        toasts: [],
    }),
    computed: {
        level() { return this.selectedLevel; },
        filteredList() {
            const query = this.searchQuery.toLowerCase();
            const selectedTagsSet = new Set(this.selectedTags);

            return this.list.filter(([level]) => {

            const name = String(level?.name ?? '').toLowerCase();
            const subtitle = String(level?.subtitle ?? '').toLowerCase();
            const id = String(level?.id ?? '').toLowerCase();

            const matchesSearch = !query || (
                name.includes(query) ||
                subtitle.includes(query) ||
                id.includes(query)
            );

            const levelTagsSet = new Set(getTags(level));
            const matchesTags = !selectedTagsSet.size || [...selectedTagsSet].every(tag => levelTagsSet.has(tag));
            return matchesSearch && matchesTags;
            });
        },
    },
    async mounted() {
        const rawList = await fetchList();
        this.list = rawList.map((entry, i) => {
            if (entry[0]) entry[0].originalIndex = i;
            return entry;
        });
        this.editors = await fetchEditors();
        if (this.filteredList.length) this.selectedLevel = this.filteredList[0][0];
        if (!this.list) this.errors = ['Failed to load list. Retry later.'];
        else this.errors.push(...this.list.filter(([_, err]) => err).map(([_, err]) => `Failed to load level. (${err}.json)`));
        if (!this.editors) this.errors.push('Failed to load list editors.');
        this.loading = false;
    },
    methods: {
        embed, score, getFontColour,
        closeFilterMenu() { this.showTagMenu = false; },
        async copyId(id) {
            const cleaned = String(id ?? "").replace(/\([^)]*\)/g, "").replace(/\D+/g, "");
            if (/^\d+$/.test(cleaned)) {
                try {
                    await navigator.clipboard.writeText(cleaned);
                    this.addToast(`Copied ID ${cleaned} to clipboard`);
                } catch {
                    this.addToast("Failed to copy ID");
                }
            } else {
                this.addToast("Failed to copy to clipboard: Invalid ID");
            }
        },
        addToast(message) {
            const toast = { id: Date.now() + Math.random(), message };
            this.toasts.push(toast);
            setTimeout(() => this.removeToastById(toast.id), 2500);
        },
        removeToast(i) { this.toasts.splice(i, 1); },
        removeToastById(id) { this.toasts = this.toasts.filter(t => t.id !== id); },
        parseDescription(text) {
            const urlRegex = /((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-z]{2,}(\/\S*)?)/gi;
            const parts = []; let last = 0;
            text.replace(urlRegex, (match, _m, _p, _q, _r, offset) => {
                if (offset > last) parts.push({ type: "text", text: text.slice(last, offset) });
                parts.push({ type: "link", text: match, href: /^https?:\/\//i.test(match) ? match : "https://\${match}" });
                last = offset + match.length;
            });
            if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
            return parts;
        }
    },
};
