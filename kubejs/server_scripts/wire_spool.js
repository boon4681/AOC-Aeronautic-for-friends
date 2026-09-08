ServerEvents.tags('item', event => {
    event.add('c:wires/copper', 'kubejs:wire_spool')
    event.add('c:wires/gold', 'kubejs:gold_wire_spool')
    event.add('c:wires/iron', 'kubejs:gold_wire_spool')
    event.add('c:wires/electrum', 'kubejs:electrum_wire_spool')
})

ServerEvents.recipes(event => {
    // Tier 1: copper sheet cut straight into a spool.
    event.recipes.create.cutting('2x kubejs:wire_spool', Ingredient.of('#c:plates/copper'))
        .processingTime(50)
        .id('aoc:cutting/universal_wire_spool')

    // Tier 2: two cuts — gold sheet to rod, then rod to spool.
    event.recipes.create.cutting('2x createaddition:gold_rod', Ingredient.of('#c:plates/gold'))
        .processingTime(50)
        .id('aoc:cutting/gold_rod_from_sheet')

    event.recipes.create.cutting('2x kubejs:gold_wire_spool', 'createaddition:gold_rod')
        .processingTime(50)
        .id('aoc:cutting/universal_gold_wire_spool')

    // Tier 3: diamond compacted with gold rods, energized, then cut into
    event.recipes.create.compacting('kubejs:uncharged_electrum_compound', [
        'minecraft:diamond',
        'createaddition:gold_rod',
        'createaddition:gold_rod'
    ]).id('aoc:compacting/uncharged_electrum_compound')

    event.custom({
        type: 'createaddition:charging',
        energy: 3000,
        max_charge_rate: 360,
        ingredients: [{ item: 'kubejs:uncharged_electrum_compound' }],
        results: [{ id: 'kubejs:electrum_compound' }]
    }).id('aoc:charging/electrum_compound')

    event.recipes.create.cutting('2x kubejs:electrum_wire_spool', 'kubejs:electrum_compound')
        .processingTime(50)
        .id('aoc:cutting/universal_electrum_wire_spool')

    // Tier 4: insulate the electrum spool with Rubberworks rubber.
    event.shaped('kubejs:insulated_wire_spool', [
        'KKK',
        'KSK',
        'KKK'
    ], {
        K: 'rubberworks:rubber',
        S: 'kubejs:electrum_wire_spool'
    }).id('aoc:universal_insulated_wire_spool')

    // Tier 5: add a second paper-and-rubber insulation layer.
    event.shaped('kubejs:heavily_insulated_wire_spool', [
        'PKP',
        'KSK',
        'PKP'
    ], {
        P: 'minecraft:paper',
        K: 'rubberworks:rubber',
        S: 'kubejs:insulated_wire_spool'
    }).id('aoc:universal_heavily_insulated_wire_spool')
})
