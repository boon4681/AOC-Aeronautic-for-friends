const CreateScene = Java.loadClass('com.simibubi.create.foundation.ponder.CreateSceneBuilder')

const PONDER_WOODS = [
    'oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak',
    'mangrove', 'cherry', 'bamboo', 'crimson', 'warped'
]

const PONDER_SIEVES = PONDER_WOODS.map(wood => `exdeorum:${wood}_sieve`)

Ponder.registry(event => {
    // One scene registered against every sieve variant at once.
    event.create(Ingredient.of(PONDER_SIEVES))
        .scene('deployer_sieving', 'Automating the Sieve', 'kubejs:deployer_sieve', (scene, util) => {
            const create = new CreateScene(scene)
            const pos = new BlockPos(2, 3, 2)

            const SIEVE = [2, 1, 2, 2, 1, 2]

            // Ex Deorum stores the sieve's mesh and its current material as
            // plain ItemStack tags, so the scene can dress the sieve directly.
            const setSieve = (mesh, contents) => {
                scene.world.modifyBlockEntityNBT(SIEVE, nbt => {
                    nbt.put('mesh', NBT.compoundTag({ id: mesh, count: 1 }))
                    if (contents) {
                        nbt.put('contents', NBT.compoundTag({ id: contents, count: 1 }))
                    } else {
                        nbt.remove('contents')
                    }
                    nbt.putFloat('progress', 0)
                })
            }

            // One full cycle: the Deployer reaches in with gravel, the sieve
            // takes it, and a drop falls out as the arm pulls back.
            const poke = drop => {
                setSieve('exdeorum:string_mesh', 'minecraft:gravel')
                create.world.moveDeployer(pos, 1, 8)
                scene.idle(9)
                scene.world.createItemEntity([2.5, 1.9, 2.5], [0.03, 0.06, 0], Item.of(drop))
                setSieve('exdeorum:string_mesh', null)
                create.world.moveDeployer(pos, -1, 8)
                scene.idle(9)
            }

            scene.showBasePlate()
            scene.idle(5)

            scene.world.showSection([0, 1, 0, 4, 3, 4], Facing.DOWN)
            scene.idle(10)

            // Kinetic blocks start unpowered in a scene, and an unpowered
            // Deployer never animates.
            create.world.setKineticSpeed(util.select.fromTo(2, 3, 2, 4, 3, 2), 64)

            scene.text(30, 'Put a mesh in the sieve by hand.', [2.5, 1.5, 2.5])
                .colored(PonderPalette.RED)
                .attachKeyFrame()
            setSieve('exdeorum:string_mesh', null)
            scene.idle(20)

            scene.text(30, 'A Deployer holding gravel then does the clicking.', [2.5, 3.5, 2.5])
                .attachKeyFrame()
            scene.idle(15)

            poke('minecraft:flint')

            poke('exdeorum:stone_pebble')

            scene.text(30, 'Drops land under the sieve.', [2.5, 1.5, 2.5])
                .colored(PonderPalette.GREEN)
                .attachKeyFrame()
            scene.idle(15)

            poke('exdeorum:iron_ore_chunk')

            scene.text(30, 'Better meshes, better drops.', [2.5, 1.5, 2.5])
                .colored(PonderPalette.BLUE)
                .attachKeyFrame()
            scene.idle(15)

            scene.markAsFinished()
        })
})
