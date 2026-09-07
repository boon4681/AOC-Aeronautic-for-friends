// Bridges Ex Deorum sifting into Create's automation. Ex Deorum's own
// Mechanical Sieve/Hammer run on FE, which Create does not produce, so both are
// removed; sieving is automated with a Deployer right-clicking a normal sieve
// instead, which keeps the whole chain on rotational power.

// Mesh tiers in ascending order, each upgraded from the one below it by a
// Deployer applying the listed material.
const MESH_UPGRADES = [
    { from: 'exdeorum:string_mesh', to: 'exdeorum:flint_mesh', material: 'minecraft:flint' },
    { from: 'exdeorum:flint_mesh', to: 'exdeorum:iron_mesh', material: 'minecraft:iron_ingot' },
    { from: 'exdeorum:iron_mesh', to: 'exdeorum:golden_mesh', material: 'minecraft:gold_ingot' },
    { from: 'exdeorum:golden_mesh', to: 'exdeorum:diamond_mesh', material: 'minecraft:diamond' },
    { from: 'exdeorum:diamond_mesh', to: 'exdeorum:netherite_mesh', material: 'minecraft:netherite_ingot' }
]

ServerEvents.recipes(event => {
    // --- Ex Deorum FE machines out, Create-powered path in ---------------
    event.remove({ output: 'exdeorum:mechanical_sieve' })
    event.remove({ output: 'exdeorum:mechanical_hammer' })

    // --- Create: producing sieve feedstock without a shovel --------------
    // Crushing wheels take the place of hammering for the bulk-rock steps.
    event.recipes.create.crushing(
        ['exdeorum:crushed_deepslate'],
        'minecraft:cobbled_deepslate'
    ).processingTime(200).id('aoc:crushing/crushed_deepslate')

    event.recipes.create.crushing(
        ['exdeorum:crushed_netherrack'],
        'minecraft:netherrack'
    ).processingTime(150).id('aoc:crushing/crushed_netherrack')

    event.recipes.create.crushing(
        ['exdeorum:crushed_end_stone'],
        'minecraft:end_stone'
    ).processingTime(200).id('aoc:crushing/crushed_end_stone')

    event.recipes.create.crushing(
        ['exdeorum:dust'],
        'minecraft:sand'
    ).processingTime(250).id('aoc:crushing/dust')

    // --- Mesh tier upgrades, automatable on a Deployer --------------------
    MESH_UPGRADES.forEach(({ from, to, material }) => {
        event.recipes.create.deploying(to, [from, material])
            .id(`aoc:deploying/${to.replace('exdeorum:', '')}`)
    })

    // --- Full sieve table -------------------------------------------------
    // Ex Deorum's 846 stock sieve recipes are dropped and replaced wholesale so
    // drops stay inside what this pack actually has. The stock table hands out
    // ore chunks for osmium, iridium, thorium, uranium and boron, none of which
    // resolve to anything without a tech mod installed; here the metals are
    // limited to iron/gold/copper/zinc, which keeps every chunk smeltable.
    event.remove({ type: 'exdeorum:sieve' })

    const binomial = (n, p) => ({ type: 'minecraft:binomial', n: n, p: p })

    // Mesh tiers, cheapest first. A drop listed at tier i is also produced by
    // every tier above it at a rate scaled by MESH_BONUS, so upgrading a mesh
    // never loses access to a drop it used to give.
    const MESH_TIERS = [
        'exdeorum:string_mesh',
        'exdeorum:flint_mesh',
        'exdeorum:iron_mesh',
        'exdeorum:golden_mesh',
        'exdeorum:diamond_mesh',
        'exdeorum:netherite_mesh'
    ]

    // Applied per mesh tier above a drop's minimum, capped at 0.95 so no drop
    // becomes guaranteed.
    const MESH_BONUS = 1.15

    // input -> drops. `min` is the cheapest mesh index that yields the drop,
    // `n`/`p` the binomial roll at that tier.
    const SIEVE_TABLE = {
        // Dirt is intentionally empty: seeds and saplings come from farming and
        // leaf decay, not from sifting.
        'minecraft:gravel': [
            { result: 'minecraft:flint', min: 0, n: 1, p: 0.6 },
            { result: 'exdeorum:stone_pebble', min: 0, n: 7, p: 0.84 },
            { result: 'exdeorum:copper_ore_chunk', min: 1, n: 1, p: 0.3 },
            { result: 'exdeorum:iron_ore_chunk', min: 2, n: 1, p: 0.3 },
            { result: 'exdeorum:zinc_ore_chunk', min: 2, n: 1, p: 0.3 },
            { result: 'exdeorum:gold_ore_chunk', min: 3, n: 1, p: 0.225 }
        ],
        'minecraft:sand': [
            { result: 'minecraft:flint', min: 0, n: 1, p: 0.4 },
            { result: 'minecraft:kelp', min: 0, n: 1, p: 0.25 },
            { result: 'minecraft:iron_nugget', min: 2, n: 2, p: 0.375 },
            { result: 'minecraft:gold_nugget', min: 3, n: 2, p: 0.3 }
        ],
        'minecraft:red_sand': [
            { result: 'minecraft:dead_bush', min: 0, n: 1, p: 0.25 },
            { result: 'minecraft:redstone', min: 1, n: 2, p: 0.36 },
            { result: 'minecraft:iron_nugget', min: 2, n: 2, p: 0.375 },
            { result: 'minecraft:gold_nugget', min: 3, n: 2, p: 0.3 }
        ],
        'exdeorum:dust': [
            { result: 'minecraft:redstone', min: 1, n: 2, p: 0.4 },
            { result: 'minecraft:glowstone_dust', min: 2, n: 1, p: 0.25 },
            { result: 'minecraft:blaze_powder', min: 3, n: 1, p: 0.15 },
            { result: 'minecraft:sugar', min: 0, n: 2, p: 0.5 },
            { result: 'create:powdered_obsidian', min: 4, n: 1, p: 0.2 }
        ],
        'exdeorum:crushed_netherrack': [
            { result: 'minecraft:netherrack', min: 0, n: 1, p: 0.375 },
            { result: 'minecraft:quartz', min: 1, n: 1, p: 0.35 },
            { result: 'minecraft:gold_nugget', min: 2, n: 4, p: 0.44 },
            { result: 'minecraft:glowstone_dust', min: 2, n: 1, p: 0.3 },
            { result: 'minecraft:magma_cream', min: 3, n: 1, p: 0.225 },
            { result: 'minecraft:ancient_debris', min: 5, n: 1, p: 0.12 }
        ],
        'exdeorum:crushed_end_stone': [
            { result: 'exdeorum:stone_pebble', min: 0, n: 4, p: 0.56 },
            { result: 'minecraft:ender_pearl', min: 3, n: 1, p: 0.175 },
            { result: 'minecraft:popped_chorus_fruit', min: 2, n: 1, p: 0.25 },
            { result: 'create:experience_nugget', min: 4, n: 2, p: 0.375 },
            { result: 'minecraft:shulker_shell', min: 5, n: 1, p: 0.06 }
        ],
        'exdeorum:crushed_deepslate': [
            { result: 'exdeorum:deepslate_pebble', min: 0, n: 4, p: 0.7 },
            { result: 'exdeorum:iron_ore_chunk', min: 1, n: 1, p: 0.325 },
            { result: 'exdeorum:copper_ore_chunk', min: 1, n: 1, p: 0.275 },
            { result: 'exdeorum:zinc_ore_chunk', min: 1, n: 1, p: 0.275 },
            { result: 'exdeorum:gold_ore_chunk', min: 2, n: 1, p: 0.225 },
            { result: 'minecraft:lapis_lazuli', min: 2, n: 1, p: 0.2 },
            { result: 'minecraft:amethyst_shard', min: 3, n: 1, p: 0.175 },
            { result: 'minecraft:diamond', min: 4, n: 1, p: 0.15 },
            { result: 'minecraft:emerald', min: 4, n: 1, p: 0.15 }
        ],
        'exdeorum:crushed_blackstone': [
            { result: 'exdeorum:blackstone_pebble', min: 0, n: 4, p: 0.84 },
            { result: 'exdeorum:basalt_pebble', min: 0, n: 3, p: 0.7 },
            { result: 'minecraft:gold_nugget', min: 1, n: 4, p: 0.4 },
            { result: 'minecraft:gunpowder', min: 1, n: 1, p: 0.2 },
            { result: 'minecraft:magma_cream', min: 2, n: 1, p: 0.225 },
            { result: 'minecraft:ancient_debris', min: 4, n: 1, p: 0.15 }
        ],
        'minecraft:soul_sand': [
            { result: 'minecraft:quartz', min: 1, n: 1, p: 0.3 },
            { result: 'minecraft:nether_wart', min: 2, n: 1, p: 0.25 },
            { result: 'minecraft:bone_meal', min: 0, n: 2, p: 0.375 },
            { result: 'minecraft:ghast_tear', min: 4, n: 1, p: 0.09 }
        ],
        'minecraft:moss_block': [
            { result: 'minecraft:moss_carpet', min: 0, n: 1, p: 0.4 },
            { result: 'minecraft:glow_lichen', min: 1, n: 1, p: 0.25 },
            { result: 'minecraft:azalea', min: 2, n: 1, p: 0.2 },
            { result: 'minecraft:spore_blossom', min: 3, n: 1, p: 0.12 }
        ]
    }

    Object.entries(SIEVE_TABLE).forEach(([input, drops]) => {
        const inputName = input.replace(/^[a-z_]+:/, '')

        drops.forEach(drop => {
            MESH_TIERS.forEach((mesh, tier) => {
                if (tier < drop.min) return

                const chance = Math.min(0.95, drop.p * Math.pow(MESH_BONUS, tier - drop.min))
                const meshName = mesh.replace('exdeorum:', '').replace('_mesh', '')
                const resultName = drop.result.replace(/^[a-z_]+:/, '')

                event.recipes.exdeorum.sieve(
                    drop.result,
                    input,
                    mesh,
                    binomial(drop.n, Number(chance.toFixed(4)))
                ).id(`aoc:sieve/${inputName}/${meshName}/${resultName}`)
            })
        })
    })

    // Sieving Create's crushed raw ore is a deliberately lossy fallback for
    // setups without washing: ~2 nuggets a block against the 9 washing gives.
    const CRUSHED_ORES = [
        { ore: 'iron', nugget: 'minecraft:iron_nugget' },
        { ore: 'gold', nugget: 'minecraft:gold_nugget' },
        { ore: 'copper', nugget: 'create:copper_nugget' },
        { ore: 'zinc', nugget: 'create:zinc_nugget' }
    ]

    CRUSHED_ORES.forEach(({ ore, nugget }) => {
        event.recipes.exdeorum.sieve(
            nugget,
            `create:crushed_raw_${ore}`,
            'exdeorum:iron_mesh',
            binomial(5, 0.6)
        ).id(`aoc:sieve/crushed_raw_${ore}_nugget`)
    })
})
