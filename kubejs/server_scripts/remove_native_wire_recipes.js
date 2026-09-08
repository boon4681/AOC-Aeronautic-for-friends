const AOC_REMOVED_WIRE_RECIPES = [
    // Create Crafts & Additions — finished spools.
    'createaddition:crafting/copper_spool',
    'createaddition:crafting/gold_spool',
    'createaddition:crafting/electrum_spool',
    'createaddition:crafting/festive_spool',
    // Loose wire, including the charging step that upgrades gold to electrum.
    'createaddition:charging/electrify_gold_wire',

    // Create: Electro Energetics — finished spools.
    'electroenergetics:crafting/copper_wire_spool',
    'electroenergetics:crafting/iron_wire_spool',
    'electroenergetics:crafting/electrum_wire_spool',
    'electroenergetics:crafting/wire_spool',
    'electroenergetics:crafting/heavily_insulated_wire_spool',
    // Loose wire.
    'electroenergetics:crafting/copper_wire',
    'electroenergetics:crafting/iron_wire',
    'electroenergetics:crafting/iron_wire_strand',
    'electroenergetics:crafting/electrum_wire',
    'electroenergetics:crafting/insulated_wire',
    'electroenergetics:crafting/heavily_insulated_wire',

    // Create: Power Grid.
    'powergrid:crafting/insulated_copper_wire',
    'powergrid:cutting/copper_wire_cutting',
    'powergrid:cutting/gold_wire_cutting',
    'powergrid:cutting/iron_wire_cutting',

    // Create: New Age.
    'create_new_age:cutting/copper_wire',
    'create_new_age:cutting/overcharged_golden_wire',
    'create_new_age:cutting/overcharged_iron_wire',
    'create_new_age:sequenced_assembly/overcharged_diamond_wire',
    'create_new_age:shapeless/copper_wire',
    'create_new_age:shapeless/overcharged_golden_wire',
    'create_new_age:shapeless/overcharged_iron_wire',
    'create_new_age:shapeless/overcharged_diamond_wire',

    // No universal tier maps onto overcharged iron, so this block is dropped
    // rather than rebuilt; the other three wire blocks are rebuilt below.
    'create_new_age:shaped/overcharged_iron_wire_block'
]

// Recipes that name a native wire item directly instead of a #c:wires/* tag.
// Tag membership cannot reach these, so each is rebuilt on the universal spool.
const AOC_REBUILT_WIRE_BLOCKS = [
    {
        id: 'create_new_age:shaped/copper_wire_block',
        block: 'create_new_age:copper_wire_block',
        spool: 'kubejs:wire_spool'
    },
    {
        id: 'create_new_age:shaped/overcharged_golden_wire_block',
        block: 'create_new_age:overcharged_golden_wire_block',
        spool: 'kubejs:gold_wire_spool'
    },
    {
        id: 'create_new_age:shaped/overcharged_diamond_wire_block',
        block: 'create_new_age:overcharged_diamond_wire_block',
        spool: 'kubejs:electrum_wire_spool'
    }
]

const AOC_REBUILT_WIRE_CONSUMERS = [
    { id: 'create_new_age:deploying/copper_circuit', remove: true },
    { id: 'powergrid:crafting/copper_cord', remove: true }
]

ServerEvents.recipes(event => {
    AOC_REMOVED_WIRE_RECIPES.forEach(id => event.remove({ id: id }))
    AOC_REBUILT_WIRE_CONSUMERS.forEach(entry => event.remove({ id: entry.id }))

    // Create: New Age circuits are deployed with wire; use the copper spool.
    event.recipes.create.deploying('create_new_age:copper_circuit', [
        'create_new_age:blank_circuit',
        'kubejs:wire_spool'
    ]).id('aoc:deploying/copper_circuit')

    // Power Grid's cord: two insulated wires plus dried kelp natively.
    event.shapeless('powergrid:copper_cord', [
        'kubejs:insulated_wire_spool',
        'kubejs:insulated_wire_spool',
        'minecraft:dried_kelp'
    ]).id('aoc:crafting/copper_cord')

    event.remove({ id: 'electroenergetics:crafting/current_transformer' })
    event.shaped('electroenergetics:current_transformer', [
        'CAC',
        'TwT',
        'CSC'
    ], {
        A: 'create:andesite_alloy_block',
        C: 'electroenergetics:connector',
        S: 'kubejs:insulated_wire_spool',
        T: '#minecraft:terracotta',
        w: 'kubejs:wire_spool'
    }).id('aoc:crafting/current_transformer')

    event.remove({ id: 'electroenergetics:sequenced_assembly/miniature_circuit_breaker' })
    const breaker = 'electroenergetics:incomplete_miniature_circuit_breaker'
    event.recipes.create.sequenced_assembly(
        ['electroenergetics:miniature_circuit_breaker'],
        '#minecraft:terracotta',
        [
            event.recipes.create.deploying(breaker, [breaker, 'create:precision_mechanism']),
            event.recipes.create.deploying(breaker, [breaker, Ingredient.of('#c:nuggets/copper')]),
            event.recipes.create.deploying(breaker, [breaker, 'kubejs:wire_spool']),
            event.recipes.create.deploying(breaker, [breaker, 'kubejs:wire_spool']),
            event.recipes.create.pressing(breaker, breaker)
        ]
    ).transitionalItem(breaker).loops(1).id('aoc:sequenced_assembly/miniature_circuit_breaker')

    AOC_REBUILT_WIRE_BLOCKS.forEach(entry => {
        event.remove({ id: entry.id })
        event.shaped(entry.block, ['WW', 'WW'], { W: entry.spool })
            .id(`aoc:crafting/${entry.block.split(':')[1]}`)
    })
})
