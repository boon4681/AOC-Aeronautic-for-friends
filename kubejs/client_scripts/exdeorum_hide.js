const WOODS = [
    'oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak',
    'mangrove', 'cherry', 'bamboo', 'crimson', 'warped'
]

const STONE = ['stone', 'andesite', 'diorite', 'granite', 'deepslate', 'blackstone']

const COMPRESSED = [
    'andesite', 'blackstone', 'cobbled_deepslate', 'cobblestone',
    'crushed_blackstone', 'crushed_deepslate', 'crushed_end_stone',
    'crushed_netherrack', 'deepslate', 'diorite', 'dirt', 'dust',
    'end_stone', 'granite', 'gravel', 'moss_block', 'netherrack',
    'red_sand', 'sand', 'soul_sand'
]

const HAMMERS = ['wooden', 'stone', 'iron', 'golden', 'diamond', 'netherite']

// Rhino has no spread operator, so the lists are joined with concat.
const HIDDEN = []
    .concat(WOODS.map(w => `exdeorum:${w}_barrel`))
    .concat(WOODS.map(w => `exdeorum:${w}_crucible`))
    .concat(WOODS.map(w => `exdeorum:${w}_compressed_sieve`))
    .concat(STONE.map(s => `exdeorum:${s}_barrel`))
    .concat(STONE.map(s => `exdeorum:${s}_crucible`))
    .concat(COMPRESSED.map(c => `exdeorum:compressed_${c}`))
    .concat(HAMMERS.map(m => `exdeorum:${m}_hammer`))
    .concat(HAMMERS.map(m => `exdeorum:compressed_${m}_hammer`))
    .concat([
        'exdeorum:mechanical_hammer',
        'exdeorum:mechanical_sieve',
        'exdeorum:crook',
        'exdeorum:bone_crook'
    ])

RecipeViewerEvents.removeEntriesCompletely('item', event => {
    HIDDEN.forEach(id => {
        if (Item.exists(id)) event.remove(id)
    })
})
