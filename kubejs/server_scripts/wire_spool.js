// Treat the other copper conductors as equivalent crafting wire. Create Crafts
// & Additions and Electroenergetics already add their copper wire to this tag.
ServerEvents.tags('item', event => {
    event.add('c:wires/copper', [
        'create_new_age:copper_wire',
        'powergrid:wire'
    ])

    event.add('c:wires/gold', 'powergrid:golden_wire')
})

ServerEvents.recipes(event => {
    // Eight copper wires wrapped around Create Crafts & Additions' empty spool.
    // The 3x3 pattern intentionally differs from that mod's copper-spool recipe.
    event.shaped('kubejs:wire_spool', [
        'WWW',
        'WSW',
        'WWW'
    ], {
        W: '#c:wires/copper',
        S: 'createaddition:spool'
    }).id('aoc:universal_wire_spool')

    // Tier 2: upgrade the copper spool with gold wire.
    event.shaped('kubejs:gold_wire_spool', [
        'WWW',
        'WSW',
        'WWW'
    ], {
        W: '#c:wires/gold',
        S: 'kubejs:wire_spool'
    }).id('aoc:universal_gold_wire_spool')

    // Tier 3: upgrade the gold spool with electrum wire.
    event.shaped('kubejs:electrum_wire_spool', [
        'WWW',
        'WSW',
        'WWW'
    ], {
        W: '#c:wires/electrum',
        S: 'kubejs:gold_wire_spool'
    }).id('aoc:universal_electrum_wire_spool')

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
