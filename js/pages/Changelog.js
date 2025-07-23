import Spinner from '../components/Spinner.js';
import Btn from '../components/Btn.js';

export default {
    components: { Spinner, Btn },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-changelog-wrapper">
            <div class="page-changelog">
                <h1>Changelog</h1>
                <p class="changelog-subtle">
                    This is the list changelog. For the website changelog, click <a href="https://github.com/noxvera/noxveralist/releases" class="link-hover-underline" target="_blank">here</a>.
                </p>
               
                <p class="changelog-date">22 July 2025</p>
                <p>- zick 6 moved from #50 to #55 </p>

                <p class="changelog-date">21 July 2025</p>
                <p>- old fifa cup SOCER renamed to "fifa cup SOCER"</p>
                <p>- fifa cup SOCER renamed to "fifa cup SOCER v2"</p>
                <p>- average icedcave lvl moved from #12 to #16 due to a nerfdate</p>

                <p class="changelog-date">18 July 2025</p>
                <p>- version 2 v2 placed at #16</p>
                <p>- Added IDs for 1c46, average icedcave lvl, guranteed seex, joseph revolution, the ten, and thuginton prevd13 jo</p>
                <p>- Fixed ID for solid piss layout</p>
                
                <p class="changelog-date">17 July 2025</p>
                <p>- i am dylan secretway placed at #10</p>
                <p>- wenis and ballsk placed at #63 (list now has 75 levels)</p>

                <p class="changelog-date">12 May 2025</p>
                <p>- noxvera List created (I didn't write down a changelog between then and 17 July 2025) </p>
            </div>
        </main>
    `,
};
