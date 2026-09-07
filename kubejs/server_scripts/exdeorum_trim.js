// Trims Ex Deorum down to the parts this pack actually uses. Sieving is the
// only mechanic kept; the rest is replaced by Create machines, so their
// recipes are removed to stop them showing as a parallel progression.

// Ex Deorum defines these for every wood type it supports, but the mod-gated
// variants (Ars Nouveau, Blue Skies, Biomes O' Plenty, Aether) do not exist
// without those mods installed.
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
    .concat(STONE_BARRELS.map(s => `exdeorum:${s}_barrel`))
    .concat(STONE_BARRELS.map(s => `exdeorum:${s}_crucible`))
    .concat(COMPRESSED.map(c => `exdeorum:compressed_${c}`))
    .concat(HAMMER_MATERIALS.map(m => `exdeorum:${m}_hammer`))
    .concat(HAMMER_MATERIALS.map(m => `exdeorum:compressed_${m}_hammer`))
    .concat([
        'exdeorum:mechanical_hammer',
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
    event.remove({ type: 'exdeorum:crook' })

    REMOVED_ITEMS.forEach(id => event.remove({ output: id }))

    // Compressed blocks also uncompress back into their loose form.
    COMPRESSED.forEach(c => event.remove({ input: `exdeorum:compressed_${c}` }))
})
