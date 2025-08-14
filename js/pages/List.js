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
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list shared-list">
            <div class="list-container">
            ${/*
                <div class="filter-bar"
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="hideUnverified"/>
                            Hide unverified levels
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="hideUnfinished"/>
                            Hide unfinished/cancelled levels
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="hideChallenges"/>
                            Hide challenge levels
                    </label>
                </div>*/''}
                <div class="search-bar search-container">
                    <img :src="'/assets/search' + (store.dark ? '-dark' : '') + '.svg'" alt="Search icon">
                    <input v-model="searchQuery" type="text" placeholder="Search map (e.g., 'zick')" />
                    <button class="filter-button" @click="showTagMenu = true">
                        <img src=/assets/funnel.svg alt="Filter" class="filter-icon" /> ${/* https://lucide.dev/icons/funnel */''}
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
                                        <input type="checkbox" :value="tag" v-model="selectedTags" />
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
                <table class="list" v-if="list">
                    <tr v-for="([level, err], i) in filteredList">
                        <td class="rank">
                            <p v-if="level?.originalIndex + 1 <= 200" class="type-label-lg">#{{ level?.originalIndex + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                    <td class="level" :class="{ 'error': !level }">
                        <div :class="{ active: selectedLevel === level }">
                            <button @click="selectedLevel = level" :class="{ 'highlight-higheffort': level?.higheffort === true }">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                                <span v-if="level.subtitle" class="subtitle">{{ level?.subtitle || "" }}</span>
                            </button>
                        </div>
                    </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <div class="divider-line"></div>
                    <p v-if="level.description" class="level-description">{{ level.description }}</p>
                    <p v-else class="level-description">No description has been added yet.</p>
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
                            <p>{{ score(level.originalIndex + 1, 100, parseFloat(String(level.percentToQualify).replace('*', ''))) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                                <p :class="getIdClass(level.id)">
                                    ${/* 
                                        The following is commented out because gdbrowser cant display unlisted levels for some reason
                                        <template v-if="/^[0-9]+$/.test(level.id)">
                                        <a :href="'https://gdbrowser.com/' + level.id" target="_blank" rel="noopener noreferrer"> */''}
                                            {{ level.id }}
                                        ${/* </a>
                                    </template>
                                    <template v-else>
                                        {{ level.id }}
                                    </template> */''}
                                </p>
                        </li>
                        <li>
                            <div class="type-title-sm">Song ID</div>
                            <p>
                                <template v-if="/^[0-9]+$/.test(level.songID)">
                                    <a :href="'https://www.newgrounds.com/audio/listen/' + level.songID" target="_blank" rel="noopener noreferrer">
                                        {{ level.songID }}
                                    </a>
                                </template>
                                <template v-else>
                                    {{ level.songID || 'Free to Copy' }}
                                </template>
                            </p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 200">
                        <strong>{{ parseFloat(String(level.percentToQualify).replace('*', '')) }}%<span v-if="String(level.percentToQualify).includes('*')">*</span></strong> or better to qualify
                    </p>
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
                    <p>No results</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Original Layout by <a class="link-hover-underline" href="https://tsl.pages.dev/#/" target="_blank">TSL</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link-hover-underline" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    
                    <h3>Important Notes (please read!!)</h3>
                    <p>
                        - Maps on the list highlighted <span style="color:#ffd700;">Gold</span> are maps I consider to have actual effort put into them (though they might still be bad).
                    </p>
                    <p>
                        - Qualifying percentages with an asterisk (*) indicate that it is a 2.1 percentage. 
                        You can use the <a href="https://geode-sdk.org/mods/zsa.percentage-toggle" class="link-hover-underline" target="_blank">percentage toggle mod</a> to view 2.1 percentages in-game.
                    </p>
                    <p> 
                        - <a href="https://gdbrowser.com/u/1kv" class="link-hover-underline" target="_blank">1kV</a>, 
                        <a href="https://gdbrowser.com/u/cyrobyte" class="link-hover-underline" target="_blank">Cyrobyte</a>, 
                        and <a href="https://gdbrowser.com/search/19952001?user" class="link-hover-underline" target="_blank">someone (green user)</a> are all accounts belonging to me.
                    </p>
                    <p> 
                        - Maps above average icedcave lvl (#18) are all most likely harder than top 1 (<a href="https://impossiblelevels.com/" class="link-hover-underline" target="_blank" >ILL difficulty</a>).
                    </p>
                    <h3 style="color: #4fb6fcff"><u><a href="/guidelines.pdf" target="_blank">Submission Requirements</a></u></h3>
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
        searchQuery: '',
        /*
        hideChallenges: false,
        hideUnverified: false,
        hideUnfinished: false,
        */
        selectedLevel: null,
        selectedTags: JSON.parse(localStorage.getItem('selectedTags')) || [],
        showTagMenu: false,
        showFilterMenu: false,
        availableTags,
    }),

    computed: {
        level() {
            return this.selectedLevel;
        },
    filteredList() {
        return this.list.filter(([level]) => {
            const tags = getTags(level);

            const matchesSearch =
                this.searchQuery === "" ||
                level.name.toLowerCase().includes(this.searchQuery.toLowerCase());

            const matchesTags =
                this.selectedTags.length === 0 ||
                this.selectedTags.every(tag => tags.includes(tag));

            return matchesSearch && matchesTags;
        });
    }
    },
    
    async mounted() {
        // Hide loading spinner
        //this.list = await fetchList();
        const rawList = await fetchList();
        this.list = rawList.map((entry, index) => {
            entry[0].originalIndex = index;
            return entry;
        });
        this.editors = await fetchEditors();
        
        // initialize selectedLevel
        if (this.filteredList.length > 0) {
            this.selectedLevel = this.filteredList[0][0];
        }

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
        getIdClass(id) {
            const idStr = typeof id === 'string' ? id : String(id);
            if (idStr.includes('cancelled') || idStr.includes('lost')) return 'red-id';
            if (idStr.includes('unfinished')) return 'yellow-id';
            return '';
        },
        embed,
        score,
        getFontColour,
        /*
        toggleTag(tag) {
            if (this.selectedTags.includes(tag)) {
                this.selectedTags = this.selectedTags.filter(t => t !== tag);
            } else {
                this.selectedTags.push(tag);
            }
        }
        */
        toggleTag(tag) {
            const i = this.selectedTags.indexOf(tag);
            if (i === -1) {
                this.selectedTags.push(tag);
            } else {
                this.selectedTags.splice(i, 1);
            }
            localStorage.setItem('selectedTags', JSON.stringify(this.selectedTags));
        },
        closeFilterMenu() {
            this.showTagMenu = false;
        }     
    },
};