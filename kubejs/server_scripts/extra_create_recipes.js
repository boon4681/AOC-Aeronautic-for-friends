// Migrated from ExtraCreateRecipes.zip for Minecraft 1.21.1.
ServerEvents.recipes(event => {
    event.recipes.create.compacting(
        'minecraft:amethyst_shard',
        [
            'quark:purple_shard',
            'quark:purple_shard',
            'quark:purple_shard'
        ]
    ).id('create:compacting/amethyst')

    event.shapeless(
        '4x create:rose_quartz',
        ['create:rose_quartz_block']
    ).id('create:crafting/materials/rose_quartz_compress')

    event.recipes.create.crushing(
        'minecraft:popped_chorus_fruit',
        'minecraft:purpur_block'
    ).processingTime(250).id('create:crushing/purpurblock_poppedfruit')

    event.recipes.create.mixing(
        'minecraft:blaze_rod',
        [
            'minecraft:slime_ball',
            'minecraft:blaze_powder',
            'minecraft:blaze_powder'
        ]
    ).id('create:mixing/blaze_rod_mixing')

    const shardColors = [
        'black',
        'blue',
        'brown',
        'cyan',
        'gray',
        'green',
        'light_blue',
        'light_gray',
        'lime',
        'magenta',
        'orange',
        'pink',
        'purple',
        'red',
        'white',
        'yellow'
    ]

    shardColors.forEach(color => {
        event.recipes.create.mixing(
            `4x quark:${color}_shard`,
            [
                Ingredient.of('#quark:shards'),
                Ingredient.of('#quark:shards'),
                Ingredient.of('#quark:shards'),
                Ingredient.of('#quark:shards'),
                `minecraft:${color}_dye`
            ]
        ).id(`create:mixing/glasses/${color}`)
    })

    event.recipes.create.mixing(
        'quark:myalite',
        ['minecraft:chorus_fruit', 'minecraft:stone']
    ).heated().id('create:mixing/quark_myalite')

    event.recipes.create.mixing(
        'quark:shale',
        ['minecraft:snow_block', 'minecraft:stone']
    ).heated().id('create:mixing/quark_shale')
})
