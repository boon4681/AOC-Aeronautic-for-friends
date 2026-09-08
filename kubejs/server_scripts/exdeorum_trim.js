const WOODS = [
    'oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak',
    'mangrove', 'cherry', 'bamboo', 'crimson', 'warped'
]

const STONE_BARRELS = ['stone', 'andesite', 'diorite', 'granite', 'deepslate', 'blackstone']

const COMPRESSED = [
    'andesite', 'blackstone', 'cobbled_deepslate', 'cobblestone',
    'crushed_blackstone', 'crushed_deepslate', 'crushed_end_stone',
    'crushed_netherrack', 'deepslate', 'diorite', 'dirt', 'dust',
    'end_stone', 'granite', 'gravel', 'moss_block', 'netherrack',
    'red_sand', 'sand', 'soul_sand'
]

const HAMMER_MATERIALS = ['wooden', 'stone', 'iron', 'golden', 'diamond', 'netherite']

// Rhino has no spread operator, so the lists are joined with concat.
const REMOVED_ITEMS = []
    .concat(WOODS.map(w => `exdeorum:${w}_barrel`))
    .concat(WOODS.map(w => `exdeorum:${w}_crucible`))
    .concat(WOODS.map(w => `exdeorum:${w}_compressed_sieve`))
    .concat(STONE_BARRELS.map(s => `exdeorum:${s}_barrel`))
    .concat(STONE_BARRELS.map(s => `exdeorum:${s}_crucible`))
    .concat(COMPRESSED.map(c => `exdeorum:compressed_${c}`))
    .concat(HAMMER_MATERIALS.map(m => `exdeorum:${m}_hammer`))
    .concat(HAMMER_MATERIALS.map(m => `exdeorum:compressed_${m}_hammer`))
    .concat([
        'exdeorum:mechanical_hammer',
        'exdeorum:mechanical_sieve',
        'exdeorum:crook',
        'exdeorum:bone_crook'
    ])

ServerEvents.recipes(event => {
    // Drop the machines' own recipe types outright, so nothing lingers in the
    // viewer pointing at a machine that can no longer be crafted.
    event.remove({ type: 'exdeorum:barrel_compost' })
    event.remove({ type: 'exdeorum:barrel_mixing' })
    event.remove({ type: 'exdeorum:barrel_fluid_mixing' })
    event.remove({ type: 'exdeorum:barrel_fluid_transformation' })
    event.remove({ type: 'exdeorum:lava_crucible' })
    event.remove({ type: 'exdeorum:water_crucible' })
    event.remove({ type: 'exdeorum:crucible_heat_source' })
    event.remove({ type: 'exdeorum:hammer' })
    event.remove({ type: 'exdeorum:compressed_hammer' })
    event.remove({ type: 'exdeorum:compressed_sieve' })
    event.remove({ type: 'exdeorum:crook' })

    REMOVED_ITEMS.forEach(id => event.remove({ output: id }))

    // Compressed blocks also uncompress back into their loose form.
    COMPRESSED.forEach(c => event.remove({ input: `exdeorum:compressed_${c}` }))
})

// Send the hidden entries from the server as well, so multiplayer clients use
// the pack's list even if they have no local client-side override loaded.
RecipeViewerEvents.removeEntriesCompletely('item', event => {
    REMOVED_ITEMS.forEach(id => {
        if (Item.exists(id)) event.remove(id)
    })
})
