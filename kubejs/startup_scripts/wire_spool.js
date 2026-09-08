// Shared crafting component for the pack's electrical mods. Functional wire
// items remain owned by their original mods and keep their connection logic.
StartupEvents.registry('item', event => {
    event.create('wire_spool')
        .displayName('Copper Wire Spool')
        .texture('createaddition:item/copper_spool')
        .maxStackSize(64)

    event.create('gold_wire_spool')
        .displayName('Gold Wire Spool')
        .texture('createaddition:item/gold_spool')
        .maxStackSize(64)

    event.create('electrum_wire_spool')
        .displayName('Electrum Wire Spool')
        .texture('create_new_age:item/overcharged_diamond_wire')
        .maxStackSize(64)

    // Intermediates for the electrum spool: diamond compacted with gold rods,
    // then energized in a Create Crafts & Additions charging station.
    event.create('uncharged_electrum_compound')
        .displayName('Uncharged Electrum Compound')
        .texture('kubejs:item/electrum_compound')
        .maxStackSize(64)

    event.create('electrum_compound')
        .displayName('Electrum Compound')
        .texture('kubejs:item/electrum_compound')
        .maxStackSize(64)

    event.create('insulated_wire_spool')
        .displayName('Insulated Wire Spool')
        .texture('electroenergetics:item/wire_spool')
        .maxStackSize(64)

    event.create('heavily_insulated_wire_spool')
        .displayName('Heavily Insulated Wire Spool')
        .texture('electroenergetics:item/heavily_insulated_wire_spool')
        .maxStackSize(64)
})
