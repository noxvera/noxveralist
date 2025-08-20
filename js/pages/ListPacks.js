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
                <table class="list" v-if="displayedPackLevels">
                    <tr v-for="(level, i) in displayedPackLevels">
                        <td class="rank">
                            <p class="type-label-lg">#{{ i + 1 }}</p>
                        </td>
                        <td class="level" :class="{ 'active': selectedLevel == i, 'error': !level }">
                            <button
                            @click="selectedLevel = i"
                            :class="{
                                'highlight-higheffort': level[0]?.level?.higheffort === true,
                                'selected': selectedLevel === i}"
                                :style="selectedLevel === i ? { background: pack.colour } : {}">
                                <span class="type-label-lg">{{ level[0].level.name || \`Error (\.json)\` }}</span>
                                <span v-if="level[0].level.subtitle" class="subtitle">{{ level[0].level.subtitle }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="displayedPackLevels[selectedLevel]">
                    <h1>
                        {{ displayedPackLevels[selectedLevel][0].level.name }}
                        <span class="mainlist-placement">
                            (#{{ selectedLevelPlacement ?? 'N/A' }})
                        </span>
                    </h1>
                    <LevelAuthors :publisher="displayedPackLevels[selectedLevel][0].level.publisher" 
                        :creators="displayedPackLevels[selectedLevel][0].level.creators" 
                        :verifier="displayedPackLevels[selectedLevel][0].level.verifier"></LevelAuthors>
                    <div style="display:flex">
                        <div v-for="pack in displayedPackLevels[selectedLevel][0].level.packs" class="tag" 
                        :style="{background:pack.colour, color:getFontColour(pack.colour)}">{{pack.name}}</div>
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
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store?.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    ${/* <p>(ノಠ益ಠ)ノ彡┻━┻</p> */''}
                    <p> Failed to load pack. Retry in a few minutes or notify list staff. </p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <p class="scroll-indicator">You can scroll sideways to see more packs</p>
                    <h3>About the packs</h3>
                    <p>
                        These packs are basically "map series". Maps not made by me as well as maps not on the list are included here.
                    </p>
                    <h3>How can I get these packs?</h3>
                    <p>
                        Packs will automatically appear on your profile when all maps in the pack have been cleared. (Note that it is impossible to clear some packs due to some maps not being on the list)
                    </p>
                    <h3>About individual packs</h3>
                        <p>
                        [placeholder]
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
    }),
    computed: {
        pack() {
            return this.packs[this.selected];
        },
        displayedPackLevels() {
        if (!this.selectedPackLevels) return [];
        if (!this.sortByMainListOrder) {
            return this.selectedPackLevels; // natural pack order
        }
        // Sort by list order (difficulty)
        return [...this.selectedPackLevels].sort((a, b) => {
            // Defensive fallback: If no id found, sort to end
            const idA = a?.[0]?.level?.id;
            const idB = b?.[0]?.level?.id;
            const indexA = idA in this.listOrderMap ? this.listOrderMap[idA] : Infinity;
            const indexB = idB in this.listOrderMap ? this.listOrderMap[idB] : Infinity;
            return indexA - indexB;
        });
    },
    selectedLevelPlacement() {
        const level = this.displayedPackLevels[this.selectedLevel]?.[0]?.level;
        if (!level) return null;
        const placement = this.listOrderMap[level.id];
        return placement !== undefined ? placement + 1 : null; // index
    }
    },
    async mounted() {
        this.packs = await fetchPacks();
        this.selectedPackLevels = await fetchPackLevels(
            this.packs[this.selected].name
        );

            const mainList = await fetchList();

    this.listOrderMap = {};
    mainList.forEach(([level], idx) => {
        if (level && level.id)
            this.listOrderMap[level.id] = idx;
    });

    this.loading = false;
    this.loadingPack = false;

        // Error handling todo: make error handling
        // if (!this.packs) {
        //     this.errors = [
        //         "Failed to load list. Retry in a few minutes or notify list staff.",
        //     ];
        // } else {
        //     this.errors.push(
        //         ...this.packs
        //             .filter(([_, err]) => err)
        //             .map(([_, err]) => {
        //                 return `Failed to load level. (${err}.json)`;
        //             })
        //     );
        // }

        // Hide loading spinner
        this.loading = false;
        this.loadingPack = false;
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

            //stay on the same level if found
            this.selectedLevel = matchingIndex !== -1 ? matchingIndex : 0;
            this.loadingPack = false;
        },

        getIdClass(id) {
            const idStr = typeof id === 'string' ? id : String(id);
            if (idStr.includes('cancelled') || idStr.includes('lost')) return 'red-id';
            if (idStr.includes('unfinished')) return 'yellow-id';
            return '';
        },
        score,
        embed,
        getFontColour,
    },
    watch: {
        sortByMainListOrder(newVal, oldVal) {
            // Always get ID from original unsorted list
            const currentLevelId = this.selectedPackLevels[this.selectedLevel]?.[0]?.level?.id;

            this.$nextTick(() => {
                const newIndex = this.displayedPackLevels.findIndex(
                    level => level?.[0]?.level?.id === currentLevelId
                );
                this.selectedLevel = newIndex !== -1 ? newIndex : 0;
            });
        }
    }
};
