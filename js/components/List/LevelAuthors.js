export default {
    props: {
        publisher: {
            type: String,
            required: true,
        },
        creators: {
            type: Array,
            required: true,
        },
        verifier: {
            type: String,
            required: true,
        },
    },
    template: `
        <div class="level-publisher">
            <template v-if="creators.length === 0">
                <div class="type-title-sm">Creator</div>
                <p class="type-body">
                    <span>{{ publisher }}</span>
                </p>
            </template>
            <template v-else>
                <div class="type-title-sm">{{ creators.length === 1 ? 'Creator' : 'Creators' }}</div>
                <p class="type-body">
                    <template v-for="(creator, index) in creators" :key="'creator-' + creator">
                        <span>{{ creator }}</span><span v-if="index < creators.length - 1">, </span>
                    </template>
                </p>
            </template>

            <div class="type-title-sm">Verifier</div>
            <p class="type-body">
                <span>{{ verifier }}</span>
            </p>
            
            <div class="type-title-sm">Publisher</div>
            <p class="type-body">
                <span>{{ publisher }}</span>
            </p>
        </div>
    `,
};