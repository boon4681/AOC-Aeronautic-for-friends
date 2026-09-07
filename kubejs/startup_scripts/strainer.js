// The machine and recipe type are loaded from the ported MBD2 projects in
// ldlib/assets/mbd2. KubeJS only owns the pack-specific filter item.
StartupEvents.registry('item', event => {
    event.create('strainer_filter')
        .displayName('Sediment Filter')
        .texture('waterstrainer:items/strainer_survivalist')
        .maxDamage(384)
        .unstackable()
})
