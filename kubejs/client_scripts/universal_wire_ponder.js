// Ponder tags that document which native mod wire each universal spool tier
// proxies to. Mirrors AOC_WIRE_PROXIES in server_scripts/universal_wire_proxy.js.
const AOC_WIRE_PONDER_TIERS = [
    {
        id: 'kubejs:universal_copper_wire',
        sceneId: 'universal_copper_wire',
        spool: 'kubejs:wire_spool',
        title: 'Universal Copper Wire Spool',
        natives: [
            'createaddition:copper_spool',
            'electroenergetics:copper_wire_spool',
            'powergrid:wire',
            'create_new_age:copper_wire'
        ]
    },
    {
        id: 'kubejs:universal_gold_wire',
        sceneId: 'universal_gold_wire',
        spool: 'kubejs:gold_wire_spool',
        title: 'Universal Gold Wire Spool',
        natives: [
            'createaddition:gold_spool',
            'electroenergetics:iron_wire_spool',
            'powergrid:golden_wire',
            'create_new_age:overcharged_golden_wire'
        ]
    },
    {
        id: 'kubejs:universal_electrum_wire',
        sceneId: 'universal_electrum_wire',
        spool: 'kubejs:electrum_wire_spool',
        title: 'Universal Electrum Wire Spool',
        natives: [
            'createaddition:electrum_spool',
            'electroenergetics:electrum_wire_spool',
            'powergrid:golden_wire',
            'create_new_age:overcharged_diamond_wire'
        ]
    },
    {
        id: 'kubejs:universal_insulated_wire',
        sceneId: 'universal_insulated_wire',
        spool: 'kubejs:insulated_wire_spool',
        title: 'Universal Insulated Wire Spool',
        natives: [
            'createaddition:electrum_spool',
            'electroenergetics:wire_spool',
            'powergrid:insulated_copper_wire',
            'create_new_age:overcharged_diamond_wire'
        ]
    },
    {
        id: 'kubejs:universal_heavily_insulated_wire',
        sceneId: 'universal_heavily_insulated_wire',
        spool: 'kubejs:heavily_insulated_wire_spool',
        title: 'Universal Heavily Insulated Wire Spool',
        natives: [
            'createaddition:electrum_spool',
            'electroenergetics:heavily_insulated_wire_spool',
            'powergrid:insulated_copper_wire',
            'create_new_age:overcharged_diamond_wire'
        ]
    }
]

const AOC_WIRE_PONDER_DESCRIPTION =
    'This spool replaces the wire of every electrical mod in the pack. ' +
    'Right click two connectors of the same mod to link them; the spool acts ' +
    'as that mod\'s own wire, listed below.'

Ponder.tags(event => {
    AOC_WIRE_PONDER_TIERS.forEach(tier => {
        const items = [tier.spool]
            .concat(tier.natives)
            .filter(id => Item.exists(id))

        event.createTag(tier.id, builder => {
            builder
                .title(tier.title)
                .description(AOC_WIRE_PONDER_DESCRIPTION)
                .icon(tier.spool)
                .addIconToItems()
                .items(Ingredient.of(items))
        })
    })
})