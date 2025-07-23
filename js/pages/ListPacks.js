import { fetchPacks, fetchPackLevels } from "../content.js";
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
                    <button @click="switchLevels(i)" v-for="(pack, i) in packs" :style="{background: pack.colour}" class="type-label-lg">
                        <p>{{pack.name}}</p>
                    </button>
                </div>
            </div>
            <div class="list-container">
                <table class="list" v-if="selectedPackLevels">
                    <tr v-for="(level, i) in selectedPackLevels">
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
                <div class="level" v-if="selectedPackLevels[selectedLevel]">
                    <h1>{{ selectedPackLevels[selectedLevel][0].level.name }}</h1>
                    <LevelAuthors :author="selectedPackLevels[selectedLevel][0].level.author" 
                        :creators="selectedPackLevels[selectedLevel][0].level.creators" 
                        :verifier="selectedPackLevels[selectedLevel][0].level.verifier"></LevelAuthors>
                    <div style="display:flex">
                        <div v-for="pack in selectedPackLevels[selectedLevel][0].level.packs" class="tag" 
                        :style="{background:pack.colour, color:getFontColour(pack.colour)}">{{pack.name}}</div>
                    </div>
                    <iframe class="video" :src="embed(selectedPackLevels[selectedLevel][0].level.verification)" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p :class="getIdClass(selectedPackLevels[selectedLevel][0].level.id)">
                                {{ selectedPackLevels[selectedLevel][0].level.id }}
                            </p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ selectedPackLevels[selectedLevel][0].level.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 200"><strong>{{ selectedPackLevels[selectedLevel][0].level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else>100% or better to qualify</p>
                    <table class="records">
                        <tr v-for="record in selectedPackLevels[selectedLevel][0].level.records" class="record">
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
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <h3>About the packs</h3>
                    <p>
                        These packs are basically "level series". Some levels not made by me might be included here, as well as levels not on the list.
                    </p>
                    <h3>How can I get these packs?</h3>
                    <p>
                        Packs will automatically appear on your profile when all levels in the pack have been completed. (Note that it is impossible to complete some packs due to some levels not being on the list)
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
    }),
    computed: {
        pack() {
            return this.packs[this.selected];
        },
    },
    async mounted() {
        this.packs = await fetchPacks();
        this.selectedPackLevels = await fetchPackLevels(
            this.packs[this.selected].name
        );

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

            this.selected = i;
            this.selectedLevel = 0;
            this.selectedPackLevels = await fetchPackLevels(
                this.packs[this.selected].name
            );

            this.loadingPack = false;
        },
        // too lazy to put this into another file
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
};
