// Original recipes for this pack; these are not copied from CABIN.
ServerEvents.tags('item', event => {
    event.add('kubejs:strainer/sands', 'minecraft:sand')
    event.add('kubejs:strainer/sands', 'minecraft:red_sand')
    event.add('kubejs:strainer/sands', 'minecraft:gravel')
})

ServerEvents.recipes(event => {
    event.shaped('mbd2:strainer', [
        'ABA',
        'CWC',
        'ABA'
    ], {
        A: 'create:andesite_alloy',
        B: 'minecraft:iron_bars',
        C: 'minecraft:stripped_oak_log',
        W: 'minecraft:water_bucket'
    }).id('aoc:crafting/sediment_strainer')

    event.shaped('kubejs:strainer_filter', [
        'SCS',
        'CBC',
        'SCS'
    ], {
        S: 'minecraft:string',
        C: 'farmersdelight:canvas',
        B: 'minecraft:iron_bars'
    }).id('aoc:crafting/sediment_filter')

    // The filter sits in the machine and wears down while the strainer pulls
    // sediment out of the water, so it is a durability input rather than a
    // consumed one.
    const straining = (id, duration, configureOutputs) => {
        const recipe = event.recipes.mbd2.strainer()
            .id(id)
            .duration(duration)
            .inputItemsDurability('1x kubejs:strainer_filter')
        configureOutputs(recipe)
    }

    straining('aoc:straining/sediment', 600, r => {
        r.uiName('output1', builder => builder.chance(0.75, chance => chance.outputItems('#kubejs:strainer/sands')))
        r.uiName('output2', builder => builder.chance(0.25, chance => chance.outputItems('minecraft:clay_ball')))
        r.uiName('output3', builder => builder.chance(0.12, chance => chance.outputItems('minecraft:kelp')))
        r.uiName('output4', builder => builder.chance(0.03, chance => chance.outputItems('minecraft:nautilus_shell')))
    })
})

ServerEvents.tags('block', event => {
    event.add('minecraft:mineable/pickaxe', 'mbd2:strainer')
    event.add('create:wrench_pickup', 'mbd2:strainer')
})
