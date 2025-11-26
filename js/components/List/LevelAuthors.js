export default {
    props: {
        publisher: { type: String, required: true },
        creators: { type: Array, required: true },
        verifier: { type: String, required: true },
    },
    computed: {
        creatorsLabel() {
            return this.creators.length <= 1 ? "Creator" : "Creators";
        },
        creatorsText() {
            return this.creators.length ? this.creators.join(", ") : this.publisher;
        },
    },
    template: `
        <div class="level-publisher">
            <div class="type-title-sm">{{ creatorsLabel }}</div>
            <p class="type-body"><span>{{ creatorsText }}</span></p>
            
            <div class="type-title-sm">Verifier</div>
            <p class="type-body"><span>{{ verifier }}</span></p>
            <div class="type-title-sm">Publisher</div>
            <p class="type-body"><span>{{ publisher }}</span></p>
        </div>
    `,
};
