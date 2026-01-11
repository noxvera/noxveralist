import { fetchPacks, fetchPackLevels, fetchList, availableTags } from "../content.js";
import { getFontColour, embed, addToast, getTags } from "../util.js";
import { score } from "../score.js";
import { store } from '../main.js';

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

export default {
    components: {
        Spinner,
        LevelAuthors,
    },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list pack-list shared-list">
            <div class="packs-nav">
                <div>
                    <button @click="switchLevels(i)" v-for="(pack, i) in packs" :style="{ background: pack.colour }" :class="['type-label-lg', { selected: selected === i }]">
                        <p>{{ pack.name }}</p>
                    </button>
                </div>
            </div>
            <div class="list-container">
                <div class="search-bar search-container">
                    <img :src="'/assets/search' + (store.dark ? '-dark' : '') + '.svg'" alt="Search icon">
                    <input v-model="searchQuery" type="text" placeholder="Search map..."/>
                    <button class="filter-button" @click="showTagMenu = true">
                        <img src=/assets/funnel.svg alt="Filter" class="filter-icon"/>
                    </button>
                </div>
                <transition name="overlay" appear>
                    <div v-if="showTagMenu" class="tag-popup-overlay" @click.self="closeFilterMenu">
                        <transition name="popup" appear>
                            <div class="tag-popup" @click.stop>
                                <button class="close-x" @click="closeFilterMenu">×</button>
                                <h3>Filter by Tags</h3>
                                <div class="tag-list">
                                    <button v-for="tag in availableTags" :key="tag" @click="toggleTag(tag)" :class="{ 'tag-button': true, 'tag-include': getTagState(tag) === 'include', 'tag-exclude': getTagState(tag) === 'exclude' }">
                                        {{ tag }}
                                    </button>
                                </div>
                                <div class="filter-bar">
                                    <div class="checkbox-label">
                                        <input type="checkbox" v-model="showValidOnly"/>
                                        <span>Only show valid maps for completion</span>
                                    </div>
                                    <div class="checkbox-label">
                                        <input type="checkbox" v-model="sortByMainListOrder"/>
                                        <span>Sort by main list order</span>
                                    </div>
                                </div>
                                <div class="close-wrapper">
                                    <button class="reset-btn" @click="resetFilters">Reset</button>
                                    <button class="close-btn" @click="closeFilterMenu">Close</button>
                                </div>
                            </div>
                        </transition>
                    </div>
                </transition>
                <table class="list" v-if="filteredPackLevels && filteredPackLevels.length">
                    <tr v-for="([level, err], i) in filteredPackLevels" :key="i">
                        <td class="rank">
                            <p class="type-label-lg">#{{ i + 1 }}</p>
                        </td>
                        <td class="level" :class="{ error: !level }">
                            <div :class="{ active: selectedLevel === level }">
                                <button @click="selectLevel(level)" :class="{ 'highlight-higheffort': level?.higheffort === true }">
                                    <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                                    <span v-if="level?.subtitle" class="subtitle">{{ level.subtitle }}</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div v-if="viewMode === 'overview'" class="pack-level">
                    <h1>{{ pack.name }}</h1>
                    <div class="divider-line"></div>
                    <p v-if="pack.description" class="level-description">{{ pack.description }}</p>
                    <p v-else class="level-description">No description has been added yet.</p>
                    <h2>Pack Info</h2>
                    <p>Complete all maps in this pack to earn: <strong>{{ packPoints }}</strong> points</p>
                    <p style="margin-top: -1rem;">Valid maps for completion: {{ validLevelCount }}<span style="color: #999;">/{{ totalLevels }}</span></p>
                </div>
                <div v-else>
                    <div class="level" v-if="level">
                    <h1>
                        {{ level.name }}
                        <span class="mainlist-placement">
                            (#{{ selectedLevelPlacement || 'N/A' }})
                        </span>
                    </h1> 
                    <div class="divider-line"></div>
                    <p v-if="level.description" ref="levelDesc" :class="['level-description', { clamp: needsTruncation && !showFullDesc }]">
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
                    <div v-if="level.videos?.length" class="videotabs">
                        <button v-for="(video, index) in level.videos" :key="index" :class="['video-tab', { active: selectedVideoIndex === index }]" @click="selectedVideoIndex = index">
                            {{ video.name }}
                        </button>
                    </div>
                    <iframe class="video" :key="selectedVideoIndex" :src="embed(getSelectedVideoUrl())" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when cleared</div>
                            <p>{{ score(selectedLevelPlacement || 999, 100, parseFloat(String(level.percentToQualify).replace('*', ''))) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p :class="[getIdClass(level.id), 'copyable-id']" @click="copyId(level.id)" title="Click to copy">
                                {{ level.id }}
                            </p>
                        </li>
                        <li>
                            <div class="type-title-sm">Song</div>
                            <p>
                                <a v-if="level.song === 'NONG' && level.nonglink" :href="level.nonglink" target="_blank" rel="noopener" class="link-icon link-hover-underline">NONG</a>
                                <a v-else-if="!isNaN(level.song)" :href="'https://www.newgrounds.com/audio/listen/' + level.song" target="_blank" rel="noopener" class="link-icon link-hover-underline">
                                    {{ level.song }}
                                </a>
                                <template v-else>{{ level.song || 'default' }}</template>
                            </p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selectedLevelPlacement && selectedLevelPlacement <= 200">
                        <strong>{{ parseFloat(String(level.percentToQualify).replace('*', '')) }}%<span v-if="String(level.percentToQualify).includes('*')">*</span></strong> or better to qualify
                    </p>
                    <p v-else>This map does not accept records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" :key="record.user" class="record">
                            <td class="percent"><p>{{ record.percent }}%</p></td>
                            <td class="user"><a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a></td>
                            <td class="mobile"><img v-if="record.mobile" :src="\`/assets/phone-landscape\${store?.dark ? '-dark' : ''}.svg\`" alt="Mobile"></td>
                            <td class="hz"><p>{{ record.hz }}Hz</p></td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level no-results"><p>No results</p></div>
            </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <p class="scroll-indicator">You can scroll/drag to see more packs</p>
                    <h3>About the packs</h3>
                    <p>
                        These packs are basically "map series". They contain maps not on the main list and may include maps not made by me.
                    </p>
                    <h3>How can I get these packs?</h3>
                    <p>
                        Packs (as well as points gained from completing) will automatically appear on your profile once you have cleared all maps in the pack that are valid for completion.
                    </p>
                    <h3>What makes a map invalid for completion?</h3>
                    <p>
                        Maps are invalid if they are not available to play (for example, unreleased) or are not on the mainlist.
                    </p>
                </div>
            </div>
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
        packs: [],
        errors: [],
        selected: 0,
        selectedLevel: null,
        selectedPackLevels: [],
        loading: true,
        listOrderMap: {},
        sortByMainListOrder: false,
        showValidOnly: false,
        searchQuery: '',
        selectedTags: JSON.parse(localStorage.getItem('packSelectedTags')) || {},
        showTagMenu: false,
        availableTags,
        toasts: [],
        showFullDesc: false,
        needsTruncation: false,
        selectedVideoIndex: 0,
        viewMode: 'overview',
        store
    }),
    computed: {
        pack() {
            return this.packs[this.selected];
        },
        level() {
            return this.selectedLevel;
        },
        displayedPackLevels() {
            if (!this.selectedPackLevels) return [];
            if (!this.sortByMainListOrder) return this.selectedPackLevels;
            return [...this.selectedPackLevels].sort((a, b) => {
                const pathA = a?.[0]?.path;
                const pathB = b?.[0]?.path;
                const indexA = pathA in this.listOrderMap ? this.listOrderMap[pathA] : Infinity;
                const indexB = pathB in this.listOrderMap ? this.listOrderMap[pathB] : Infinity;
                return indexA - indexB;
            });
        },
        filteredPackLevels() {
            try {
                const query = this.searchQuery.toLowerCase();
                return this.displayedPackLevels
                    .map(([levelData, err]) => {
                        const level = levelData?.level;
                        return [level, levelData, err];
                    })
                    .filter(([level, levelData]) => {
                        if (!level) return false;
                        
                        if (this.showValidOnly) {
                            const idStr = String(level.id || '');
                            if (idStr.includes('unreleased') || idStr.includes('lost') || idStr.includes('unfinished')) return false;
                            
                            const placement = this.listOrderMap[levelData.path];
                            if (placement === undefined) return false;
                        }
                        
                        return this.matchesSearchQuery(level, query) && this.matchesTagFilters(level);
                    })
                    .map(([level, _, err]) => [level, err]);
            } catch (error) {
                console.error('Error in filteredPackLevels:', error);
                return [];
            }
        },
        selectedLevelPlacement() {
            if (!this.level) return null;

            const originalEntry = this.displayedPackLevels.find(([levelData]) => levelData?.level === this.level);
            if (!originalEntry) return null;
            
            const levelPath = originalEntry[0]?.path;
            if (!levelPath) return null;
            
            const placement = this.listOrderMap[levelPath];
            return placement !== undefined ? placement + 1 : null;
        },
        validLevelCount() {
        if (!this.selectedPackLevels) return 0;
        return this.selectedPackLevels.filter(([levelData]) => {
            const level = levelData?.level;
            if (!level) return false;
            const idStr = String(level.id || '');
            // invalid IDs
            if (idStr.includes('unreleased') || idStr.includes('lost') || idStr.includes('unfinished')) return false;

            // exclude levels not on the main list
            const placement = this.listOrderMap[levelData.path];
            if (placement === undefined) return false;
            
            return true;
        }).length;
    },
        totalLevels() {
            return this.selectedPackLevels ? this.selectedPackLevels.length : 0;
        },
        packPoints() {
            if (!this.selectedPackLevels) return 0;
            let sum = 0;
            for (const [levelData] of this.selectedPackLevels) {
                const level = levelData?.level;
                if (!level) continue;
                const idStr = String(level.id || '');
                if (idStr.includes('unreleased') || idStr.includes('lost') || idStr.includes('unfinished')) continue;
                
                const placement = this.listOrderMap[levelData.path];
                
                const points = this.score(placement !== undefined ? placement + 1 : 999, 100, parseFloat(String(level.percentToQualify).replace('*', '')));
                sum += points;
            }
            // decimal digits
            const total = sum / 2;
            const rounded = Math.round(total * 100) / 100;
            return rounded % 1 === 0 ? Math.floor(rounded) : rounded;
        }
    },
    async mounted() {
        this.packs = await fetchPacks();
        this.selectedPackLevels = await fetchPackLevels(this.packs[this.selected].name, this.packs);

        const mainList = await fetchList();
        this.listOrderMap = {};
        mainList.forEach(([level], idx) => {
            if (level && level.path) this.listOrderMap[level.path] = idx;
        });

        this.loading = false;

        this.$nextTick(() => {
            const nav = this.$el.querySelector('.packs-nav');
            if (!nav) return;
            
            let isDown = false;
            let startX = 0;
            let startScroll = 0;
            let moved = false;

            const onPointerMove = (e) => {
                if (!isDown) return;
                const dx = e.clientX - startX;
                if (Math.abs(dx) > 10) moved = true;
                nav.scrollLeft = startScroll - dx;
            };
            const onPointerUp = () => {
                if (!isDown) return;
                isDown = false;
                document.body.style.userSelect = '';
                nav.style.scrollBehavior = '';
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
                window.removeEventListener('pointercancel', onPointerUp);
                if (moved) {
                    const stopClick = (ev) => {
                        ev.stopImmediatePropagation();
                        ev.preventDefault();
                        nav.removeEventListener('click', stopClick, true);
                    };
                    nav.addEventListener('click', stopClick, true);
                }
            };
            const onPointerDown = (e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                isDown = true;
                moved = false;
                startX = e.clientX;
                startScroll = nav.scrollLeft;
                document.body.style.userSelect = 'none';
                nav.style.scrollBehavior = 'auto';
                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', onPointerUp);
                window.addEventListener('pointercancel', onPointerUp);
            };
            nav.addEventListener('pointerdown', onPointerDown);
        });
        
        window.addEventListener('add-toast', this.handleToastEvent);
    },
    methods: {
        async switchLevels(i) {
            this.selected = i;
            this.viewMode = 'overview';
            this.selectedLevel = null;
            const newLevels = await fetchPackLevels(this.packs[this.selected].name, this.packs);
            this.selectedPackLevels = newLevels;
        },
        viewLevels() {
            this.viewMode = 'levels';
            if (this.filteredPackLevels.length > 0) {
                this.selectedLevel = this.filteredPackLevels[0][0];
            }
        },
        selectLevel(level) {
            this.selectedLevel = level;
            this.viewMode = 'levels';
        },
        handleToastEvent(e) {
            const toast = { id: Date.now() + Math.random(), message: e.detail.message };
            this.toasts.push(toast);
            setTimeout(() => this.removeToastById(toast.id), 4000);
        },
        removeToastById(id) { 
            this.toasts = this.toasts.filter(t => t.id !== id); 
        },
        closeFilterMenu() { 
            this.showTagMenu = false; 
        },
        toggleTag(tag) {
            const currentState = this.selectedTags[tag];
            const newTags = { ...this.selectedTags };
            if (!currentState) newTags[tag] = 'include';
            else if (currentState === 'include') newTags[tag] = 'exclude';
            else delete newTags[tag];
            this.selectedTags = newTags;
            localStorage.setItem('packSelectedTags', JSON.stringify(newTags));
        },
        getTagState(tag) { 
            return this.selectedTags[tag] || null; 
        },
        resetFilters() {
            this.selectedTags = {};
            localStorage.removeItem('packSelectedTags');
        },
        matchesSearchQuery(level, query) {
            if (!query) return true;
            const q = query.toLowerCase();
            return [level?.name, level?.subtitle, level?.id].some(field => String(field ?? '').toLowerCase().includes(q));
        },
        matchesTagFilters(level) {
            const levelTags = new Set(getTags(level));
            return Object.entries(this.selectedTags).every(([tag, state]) => 
                state === 'include' ? levelTags.has(tag) : !levelTags.has(tag)
            );
        },
        getIdClass(id) {
            const idStr = String(id ?? '');
            if (idStr.includes("cancelled") || idStr.includes("lost")) return "red-id";
            if (idStr.includes("unfinished")) return "yellow-id";
            return "";
        },
        async copyId(id) {
            const cleaned = String(id ?? "").replace(/\([^)]*\)/g, "").replace(/\D+/g, "");
            if (/^\d+$/.test(cleaned)) {
                try {
                    await navigator.clipboard.writeText(cleaned);
                    addToast(`Copied ID ${cleaned} to clipboard`);
                } catch {
                    addToast("Failed to copy ID");
                }
            } else {
                addToast("Failed to copy to clipboard: Invalid ID");
            }
        },
        parseDescription(text) {
            const urlRegex = /((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-z]{2,}(\/\S*)?)/gi;
            const parts = [];
            let last = 0;
            text.replace(urlRegex, (match, _m, _p, _q, _r, offset) => {
                if (offset > last) parts.push({ type: "text", text: text.slice(last, offset) });
                parts.push({ type: "link", text: match, href: /^https?:\/\//i.test(match) ? match : `https://${match}` });
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
        getSelectedVideoUrl() {
            return this.level?.videos?.[this.selectedVideoIndex]?.url ?? this.level?.verification;
        },
        score,
        embed,
        getFontColour,
    },
    watch: {
        selectedLevel() {
            this.selectedVideoIndex = 0;
            this.showFullDesc = false;
            this.checkDescriptionOverflow();
        }
    },
};
        