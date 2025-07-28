import Spinner from '../components/Spinner.js';
import Btn from '../components/Btn.js';
import { fetchChangelog } from '../content.js';

export default {
    components: { Spinner, Btn },
    data() {
        return {
            loading: true,
            changelog: [],
        };
    },
    async mounted() {
        this.changelog = await fetchChangelog();
        this.loading = false;
    },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-changelog-wrapper">
        <div class="page-changelog-content">
            <div class="page-changelog">
                <h1>Changelog</h1>
                <p class="changelog-subtitle">
                    This is the list changelog. For the website changelog, 
                    <a href="https://github.com/noxvera/noxveralist/releases" class="link-hover-underline" target="_blank">click here</a>.
                </p>
                <p class="changelog-subtitle">Each entry under each date is listed from oldest to newest.</p>
                <template v-for="entry in changelog">
                    <p class="changelog-date">{{ entry.date }}</p>
                    <p v-for="line in entry.entries">- {{ line }}</p>
                </template>
            </div>
        </div>
        </main>
    `
};