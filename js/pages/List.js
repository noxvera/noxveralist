import { store } from '../main.js';
import { embed, getFontColour, getTags } from '../util.js';
import { score } from '../score.js';
import { fetchEditors, fetchList, fetchBenchmarks, availableTags } from '../content.js';

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
                                    <button 
                                        v-for="tag in availableTags" 
                                        :key="tag"
                                        @click="toggleTag(tag)"
                                        :class="{
                                            'tag-button': true,
                                            'tag-include': getTagState(tag) === 'include',
                                            'tag-exclude': getTagState(tag) === 'exclude'
                                        }"
                                    >
                                        {{ tag }}
                                    </button>
                                </div>
                                <div class="close-wrapper">
                                    <button class="reset-btn" @click="resetFilters">Reset</button>
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
                                <template v-if="level?.isBenchmark">—</template>
                                <template v-else>
                                    {{ (level?.originalIndex + 1) <= 200 ? '#' + (level.originalIndex + 1) : 'Legacy' }}
                                </template>
                            </p>
                        </td>
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
                    <p v-if="level.description" ref="levelDesc" :class="['level-description', { clamp: !showFullDesc }]">
                        <template v-for="(part, i) in parseDescription(level.description)" :key="i">
                            <a v-if="part.type === 'link'" :href="part.href" target="_blank" rel="noopener" class="link-icon link-hover-underline">{{ part.text }}</a>
                            <span v-else>{{ part.text }}</span>
                        </template>
                    </p>
                    <p v-else class="level-description">No description has been added yet.</p>
                    <button v-if="needsTruncation" class="show-more-btn" @click="showFullDesc = !showFullDesc">
                        {{ showFullDesc ? 'Show less' : 'Show more' }}
                    </button>
                    <LevelAuthors :publisher="level.publisher" :creators="level.creators" :verifier="level.verifier" />
                    <div v-if="level.packs.length" class="packs">
                        <div v-for="pack in level.packs" :key="pack.name" class="tag" :style="{ background: pack.colour, color: getFontColour(pack.colour) || '#000' }">
                            <p>{{ pack.name }}</p>
                        </div>
                    </div>
                    <div v-if="level.videos && level.videos.length" class="videotabs">
                        <button v-for="(video, index) in level.videos" :key="index" :class="['video-tab', { active: selectedVideoIndex === index }]" @click="selectedVideoIndex = index">
                            {{ video.name }}
                        </button>
                    </div>
                    <iframe class="video" :key="selectedVideoIndex" :src="embed(getSelectedVideoUrl())" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when cleared</div>
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
                    <p v-else>This map does not accept records.</p>
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
                        <a href="https://gdbrowser.com/u/1kf" class="link-hover-underline link-icon" target="_blank">1kF</a>,
                        <a href="https://gdbrowser.com/u/cyrobyte" class="link-hover-underline link-icon" target="_blank">Cyrobyte</a>, 
                        and <a href="https://gdbrowser.com/search/19952001?user" class="link-hover-underline link-icon" target="_blank">someone (green user)</a> are all accounts belonging to me.
                    </p>
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
        benchmarks: [],
        editors: [],
        loading: true,
        errors: [],
        roleIconMap,
        store,
        searchQuery: '',
        selectedLevel: null,
        selectedTags: JSON.parse(localStorage.getItem('selectedTags')) || {},
        showTagMenu: false,
        availableTags,
        toasts: [],
        showFullDesc: false,
        needsTruncation: false,
        selectedVideoIndex: 0,
    }),
    computed: {
        level() { return this.selectedLevel; },
    
        filteredList() {
            const query = this.searchQuery.toLowerCase();
            const filtered = this.list.filter(([level]) => 
                this.shouldIncludeLevel(level, query)
            );

            const result = [...filtered];
            const sortedBenchmarks = this.benchmarks
                .filter(b => b.level && this.shouldIncludeLevel(b.level, query))
                .sort((a, b) => b.after - a.after);
            for (const { level, after } of sortedBenchmarks) {
                const insertIndex = result.findIndex(([l]) => l?.originalIndex === after);
                if (insertIndex !== -1) {
                    result.splice(insertIndex + 1, 0, [level, null]);
                }
            }
            
            return result;
        },
    },
    async mounted() {
        const rawList = await fetchList();
        this.list = rawList.map((entry, i) => {
            if (entry[0]) entry[0].originalIndex = i;
            return entry;
        });
        const rawBenchmarks = await fetchBenchmarks() || [];
        this.benchmarks = rawBenchmarks.map(([level, after, err]) => {
            // initialize missing properties for benchmarks
            if (level) {
                level.isBenchmark = true;
                level.packs = level.packs || [];
            }
            return {
                level,
                after,
                err
            };
        });
        this.editors = await fetchEditors();
        if (this.filteredList.length) this.selectedLevel = this.filteredList[0][0];
        if (!this.list) this.errors = ['Failed to load list. Retry later.'];
        else this.errors.push(...this.list.filter(([_, err]) => err).map(([_, err]) => `Failed to load level. (${err}.json)`));
        if (!this.editors) this.errors.push('Failed to load list editors.');
         this.errors.push(...this.benchmarks.filter(b => b.err).map(b => `Failed to load benchmark. (${b.err}.json)`));
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
        },
        checkDescriptionOverflow() {
            this.$nextTick(() => {
                let el = this.$refs.levelDesc;
                el = Array.isArray(el) ? el[0] : el;
                
                if (!el) { 
                    this.needsTruncation = false;
                    return;
                }

                const origOverflow = el.style.overflow;
                const origWebkitLineClamp = el.style.webkitLineClamp;
                
                el.style.overflow = 'visible';
                el.style.webkitLineClamp = 'unset';

                const fullHeight = el.scrollHeight;
                const cs = window.getComputedStyle(el);
                const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2 || 19.2;

                el.style.overflow = origOverflow;
                el.style.webkitLineClamp = origWebkitLineClamp;

                this.needsTruncation = Math.round(fullHeight / lineHeight) > 3;
            });
        },

        toggleTag(tag) {
            const currentState = this.selectedTags[tag];
            const newTags = { ...this.selectedTags };
            
            if (!currentState) {
                newTags[tag] = 'include';
            } else if (currentState === 'include') {
                newTags[tag] = 'exclude';
            } else {
                delete newTags[tag];
            }
            
            this.selectedTags = newTags;
            localStorage.setItem('selectedTags', JSON.stringify(newTags));
        },

        getTagState(tag) {
            return this.selectedTags[tag] || null;
        },

        resetFilters() {
            this.selectedTags = {};
            localStorage.removeItem('selectedTags');
        },

        getSelectedVideoUrl() {
            return this.level.videos?.[this.selectedVideoIndex]?.url ?? this.level.verification;
        },

        matchesSearchQuery(level, query) {
            if (!query) return true;
            const q = query.toLowerCase();
            return [level?.name, level?.subtitle, level?.id]
                .some(field => String(field ?? '').toLowerCase().includes(q));
        },

        matchesTagFilters(level) {
            const levelTags = new Set(getTags(level));
            return Object.entries(this.selectedTags).every(([tag, state]) => 
                state === 'include' ? levelTags.has(tag) : !levelTags.has(tag)
            );
        },

        shouldIncludeLevel(level, query) {
            return this.matchesSearchQuery(level, query) && this.matchesTagFilters(level);
        },
    },
    watch: {
        selectedLevel() {
            this.selectedVideoIndex = 0;
            this.showFullDesc = false;
            this.checkDescriptionOverflow();
        }
    }
};
