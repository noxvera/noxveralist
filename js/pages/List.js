import { store } from '../main.js';
import { embed, getFontColour } from '../util.js';
import { score } from '../score.js';
import { fetchEditors, fetchList } from '../content.js';

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
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <table class="list" v-if="list">
                    <tr v-for="([level, err], i) in list">
                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level}">
                            <button @click="selected = i" :class="{ 'highlight-higheffort': level?.higheffort === true}">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                                <span v-if="level.subtitle" class="subtitle">{{ level?.subtitle || ""}}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <div class="packs" v-if="level.packs.length > 0">
                        <div v-for="pack in level.packs" class="tag" :style="{background:pack.colour, color: getFontColour(pack.colour) || '#000000'}">
                            <p>{{pack.name}}</p>
                        </div>
                    </div>
                    <iframe class="video" :src="embed(level.verification)" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p :class="{ 'red-id': ['cancelled', 'lost'].includes(level.id), 'yellow-id': ['unfinished'].includes(level.id) }">
                                {{ level.id }}
                            </p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 150"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>Someone forgot to add .json to the end of a file name, Ping a Staff Member</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Original Layout by <a href="https://tsl.pages.dev/#/" target="_blank">The Shitty List</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Important Notes (please read!!!)</h3>
                    <p>
                        - Levels on the list highlighted <span style="color:#ffd700;">Gold</span> are levels I consider to have actual effort put into them (though they might still be bad)
                    </p>
                    <p>
                        - If you would like a copy of an <u>unreleased</u> level, feel free to contact me on Discord (username: 2894)
                    </p>
                    <p> 
                        - aelt, Cyrobyte, and someone (green user) are all accounts belonging to me.
                    </p>
                    <p> 
                        - Levels above [placeholder] are all most likely harder than top 1 (basically, Impossible Levels List difficulty).
                    </p>
                    <p>
                        - Levels that are very low effort and/or under 10 seconds are not included here (or else this list would have like 500 levels). There may be some exceptions.
                    </p>
                    <br/>
                    <h3>Submission Requirements</h3>
                    <p>
                        - Achieved the record without using hacks (CBF is fine, FPS bypass while using 2.1 is fine as long as it's under 360fps).
                    </p>
                    <p>
                        - Achieved the record on the level that is listed on the site - please check the level ID before you submit a record.
                    </p>
                    <p>
                        - Have either source audio or clicks/taps in the video. Edited audio only does not count.
                    </p>
                    <p>
                        - The recording must have a previous attempt and entire death animation shown before the completion, unless the completion is on the first attempt.
                    </p>
                    <p>
                        - The recording must also show the player hit the endwall, or the completion will be invalidated.
                    </p>
                    <p>
                        - Taking secret ways that were built into the level is allowed, as well as any small skips (either intentional or unintentional). Taking large unintentional secret ways is not allowed.
                    </p>
                    <p>
                        - Globed 2P completions are not allowed.
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store,
    }),
    computed: {
        level() {
            return this.list[this.selected][0];
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list) {
            this.errors = [
                'Failed to load list. Retry in a few minutes or notify list staff.',
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    }),
            );
            if (!this.editors) {
                this.errors.push('Failed to load list editors.');
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
        getFontColour,
    },
};
