import { fetchPacks, fetchPackLevels, fetchList } from "../content.js";
import { getFontColour, embed } from "../util.js";
import { score } from "../score.js";

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
        <main v-else class="pack-list shared-list">
            <div class="packs-nav">
                <div>
                    <button
                        @click="switchLevels(i)"
                        v-for="(pack, i) in packs"
                        :style="{ background: pack.colour }"
                        :class="['type-label-lg', { selected: selected === i }]"
                    >
                        <p>{{ pack.name }}</p>
                    </button>
                </div>
            </div>
            <div class="list-container">
                <div class="filter-bar">
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="sortByMainListOrder"/>
                        Sort by difficulty
                    </label>
                </div>
                <table class="list" v-if="displayedPackLevels && displayedPackLevels.length">
                    <tr v-for="(level, i) in displayedPackLevels" :key="i">
                        <td class="rank">
                            <p class="type-label-lg">#{{ i + 1 }}</p>
                        </td>
                        <td class="level" :class="{ 'active': selectedLevel == i, 'error': !level || !level[0]?.level }"
                        >
                            <button
                                @click="selectedLevel = i"
                                :disabled="!level || !level[0]?.level"
                                :class="{
                                    'highlight-higheffort': level?.[0]?.level?.higheffort === true,
                                    'selected': selectedLevel === i
                                }"
                                :style="selectedLevel === i ? { background: pack.colour } : {}"
                            >
                                <span class="type-label-lg">{{ level?.[0]?.level?.name || 'Error (.json)' }}</span>
                                <span v-if="level?.[0]?.level?.subtitle" class="subtitle">{{ level[0].level.subtitle }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="displayedPackLevels[selectedLevel] && displayedPackLevels[selectedLevel][0]?.level">
                    <h1>
                        {{ displayedPackLevels[selectedLevel][0].level.name }}
                        <span class="mainlist-placement">
                            (#{{ selectedLevelPlacement ?? 'N/A' }})
                        </span>
                    </h1>
                    <LevelAuthors 
                        :publisher="displayedPackLevels[selectedLevel][0].level.publisher" 
                        :creators="displayedPackLevels[selectedLevel][0].level.creators" 
                        :verifier="displayedPackLevels[selectedLevel][0].level.verifier"
                    />
                    <div style="display:flex">
                        <div 
                            v-for="pack in displayedPackLevels[selectedLevel][0].level.packs" 
                            class="tag" 
                            :style="{background: pack.colour, color: getFontColour(pack.colour)}"
                        >
                            {{ pack.name }}
                        </div>
                    </div>
                    <iframe class="video" :src="embed(displayedPackLevels[selectedLevel][0].level.verification)" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p :class="getIdClass(displayedPackLevels[selectedLevel][0].level.id)">
                                {{ displayedPackLevels[selectedLevel][0].level.id }}
                            </p>
                        </li>
                        <li>
                            <div class="type-title-sm">song</div>
                            <p>{{ displayedPackLevels[selectedLevel][0].level.song || 'default' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 200"><strong>{{ displayedPackLevels[selectedLevel][0].level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else>100% or better to qualify</p>
                    <table class="records">
                        <tr v-for="record in displayedPackLevels[selectedLevel][0].level.records" class="record">
                            <td class="percent"><p>{{ record.percent }}%</p></td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store?.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz"><p>{{ record.hz }}Hz</p></td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p> Failed to load pack. Retry in a few minutes or notify list staff. </p>
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
                        These packs are basically "map series". Maps not made by me as well as maps not on the list are included here.
                    </p>
                    <h3>How can I get these packs?</h3>
                    <p>
                        Packs will automatically appear on your profile when all maps in the pack have been cleared. (Unreleased maps are not counted for pack completion)
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        packs: [],
        errors: [],
        selected: 0,
        selectedLevel: 0,
        selectedPackLevels: [],
        loading: true,
        loadingPack: true,
        listOrderMap: {},
        sortByMainListOrder: false,
        searchquery: ''
        
    }),
    computed: {
        pack() {
            return this.packs[this.selected];
        },
        displayedPackLevels() {
            if (!this.selectedPackLevels) return [];
            if (!this.sortByMainListOrder) return this.selectedPackLevels;
            // Sort by list order (difficulty)
            return [...this.selectedPackLevels].sort((a, b) => {
                const pathA = a?.[0]?.path;
                const pathB = b?.[0]?.path;
                const indexA = pathA in this.listOrderMap ? this.listOrderMap[pathA] : Infinity;
                const indexB = pathB in this.listOrderMap ? this.listOrderMap[pathB] : Infinity;
                return indexA - indexB;
            });
        },
        selectedLevelPlacement() {
            const levelEntry = this.displayedPackLevels[this.selectedLevel]?.[0];
            if (!levelEntry) return null;

            const placement = this.listOrderMap[levelEntry.path];
            return placement !== undefined ? placement + 1 : null;
        }
    },
    async mounted() {
        this.packs = await fetchPacks();
        this.selectedPackLevels = await fetchPackLevels(this.packs[this.selected].name);

        const mainList = await fetchList();
        this.listOrderMap = {};
        mainList.forEach(([level], idx) => {
            if (level && level.path) this.listOrderMap[level.path] = idx;
        });

        this.loading = false;
        this.loadingPack = false;

        /* Error handling todo: make error handling
        if (!this.packs) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.packs
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return \`Failed to load level. (\${err}.json)\`;
                    })
            );
        } */
        // packs-nav drag
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
            if (Math.abs(dx) > 10) moved = true; // click threshold
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
            if (e.pointerType === 'mouse' && e.button !== 0) return; // left button only
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
    },
    methods: {
        async switchLevels(i) {
            this.loadingPack = true;
            const previousLevelId = this.selectedPackLevels[this.selectedLevel]?.[0]?.level?.id;

            this.selected = i;
            const newLevels = await fetchPackLevels(this.packs[this.selected].name);
            this.selectedPackLevels = newLevels;

            const matchingIndex = newLevels.findIndex(
                level => level?.[0]?.level?.id === previousLevelId
            );
            this.selectedLevel = matchingIndex !== -1 ? matchingIndex : 0;
            this.loadingPack = false;
        },
        getIdClass(id) {
            const idStr = typeof id === "string" ? id : String(id);
            if (idStr.includes("cancelled") || idStr.includes("lost")) return "red-id";
            if (idStr.includes("unfinished")) return "yellow-id";
            return "";
        },
        score,
        embed,
        getFontColour,
    },
    /*
    watch: {
        sortByMainListOrder() {
            const currentLevelId = this.selectedPackLevels[this.selectedLevel]?.[0]?.level?.id;
            this.$nextTick(() => {
                const newIndex = this.displayedPackLevels.findIndex(
                    level => level?.[0]?.level?.id === currentLevelId
                );
                this.selectedLevel = newIndex !== -1 ? newIndex : 0;
            });
        }
    }
    */
};
