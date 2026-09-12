
MBDRecipeTypeEvents.onRecipeUI('aoc:fluid_block_generation', event => {
    var Scene = Java.loadClass('com.lowdragmc.lowdraglib2.gui.ui.elements.Scene')
    var DummyWorld = Java.loadClass('com.lowdragmc.lowdraglib2.utils.virtuallevel.DummyWorld')
    var Minecraft = Java.loadClass('net.minecraft.client.Minecraft')
    var BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
    var Blocks = Java.loadClass('net.minecraft.world.level.block.Blocks')
    var Block = Java.loadClass('net.minecraft.world.level.block.Block')
    var ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
    var Items = Java.loadClass('net.minecraft.world.item.Items')
    var FlowingFluid = Java.loadClass('net.minecraft.world.level.material.FlowingFluid')
    var JInteger = Java.loadClass('java.lang.Integer')
    var JBoolean = Java.loadClass('java.lang.Boolean')
    var FluidStack = Java.loadClass('net.neoforged.neoforge.fluids.FluidStack')
    var ClipFluid = Java.loadClass('net.minecraft.world.level.ClipContext$Fluid')
    var Component = Java.loadClass('net.minecraft.network.chat.Component')
    var HoverTooltips = Java.loadClass('com.lowdragmc.lowdraglib2.gui.ui.event.HoverTooltips')
    var DrawerHelper = Java.loadClass('com.lowdragmc.lowdraglib2.gui.util.DrawerHelper')
    var LDLibJEIPlugin = Java.loadClass('com.lowdragmc.lowdraglib2.integration.xei.jei.LDLibJEIPlugin')
    var VanillaTypes = Java.loadClass('mezz.jei.api.constants.VanillaTypes')
    var NeoForgeTypes = Java.loadClass('mezz.jei.api.neoforge.NeoForgeTypes')
    var Vector3f = Java.loadClass('org.joml.Vector3f')
    var BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
    var ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
    var ArrayList = Java.loadClass('java.util.ArrayList')
    var Size = Java.loadClass('com.lowdragmc.lowdraglib2.math.Size')
    var YogaOverflow = Java.loadClass('org.appliedenergistics.yoga.YogaOverflow')

    var ui = event.event.ui
    if (ui === null) return

    var clientLevel = Minecraft.getInstance().level
    if (clientLevel === null) return

    var sceneSlot = ui.selectId('scene_slot').findFirst().orElse(null)
    if (sceneSlot === null) return
    if (sceneSlot.getChildren().size() > 0) return

    var valueOf = slotId => {
        var found = ui.selectId(slotId).findFirst().orElse(null)
        if (found === null) return null
        return found.getValue()
    }

    var fluidBlockOf = fluidSlotId => {
        var fluidStack = valueOf(fluidSlotId)
        if (fluidStack === null || fluidStack.isEmpty()) return null
        return fluidStack.getFluid().defaultFluidState().createLegacyBlock()
    }

    var itemBlockOf = itemSlotId => {
        var itemStack = valueOf(itemSlotId)
        if (itemStack === null || itemStack.isEmpty()) return null
        var itemBlock = Block.byItem(itemStack.getItem())
        if (itemBlock === Blocks.AIR) return null
        return itemBlock.defaultBlockState()
    }


    var data = event.event.recipe === null ? null : event.event.recipe.data

    var dataString = key => {
        if (data === null || !data.contains(key)) return null
        var value = data.getString(key)
        return value === '' ? null : value
    }

    var dataInt = (key, fallback) => {
        if (data === null || !data.contains(key)) return fallback
        return data.getInt(key)
    }

    var fluidStateFrom = (fluidId, isFlowing) => {
        var found = BuiltInRegistries.FLUID.get(ResourceLocation.parse(fluidId))
        if (found === null) return null
        var state = found.defaultFluidState()
        if (isFlowing && found instanceof FlowingFluid) {
            state = found.getFlowing().defaultFluidState()
                .trySetValue(FlowingFluid.LEVEL, JInteger.valueOf(1))
                .trySetValue(FlowingFluid.FALLING, JBoolean.FALSE)
        }
        if (state.isEmpty()) return null
        return state.createLegacyBlock()
    }

    var blockStateFrom = blockId => {
        var found = BuiltInRegistries.BLOCK.get(ResourceLocation.parse(blockId))
        if (found === null || found === Blocks.AIR) return null
        return found.defaultBlockState()
    }

    var itemFromState = state => {
        if (state === null || state.isAir()) return null
        var item = state.getBlock().asItem()
        if (item === null || item === Items.AIR) return null
        return new ItemStack(item)
    }

    var sourceState = null
    var originFluid = dataString('scene_origin_fluid')
    var originFlowing = data !== null && data.getBoolean('scene_origin_flowing')
    if (originFluid !== null) {
        sourceState = fluidStateFrom(originFluid, originFlowing)
    }
    if (sourceState === null) sourceState = fluidBlockOf('first')

    var neighborState = null
    var neighborFluid = dataString('scene_neighbor_fluid')
    var neighborBlock = dataString('scene_neighbor_block')
    var neighborFlowing = data !== null && data.getBoolean('scene_neighbor_flowing')
    if (neighborFluid !== null) {
        neighborState = fluidStateFrom(neighborFluid, neighborFlowing)
    } else if (neighborBlock !== null) {
        neighborState = blockStateFrom(neighborBlock)
    }
    if (neighborState === null) neighborState = fluidBlockOf('second')
    if (neighborState === null) neighborState = itemBlockOf('second_block')

    if (sourceState === null && neighborState === null) return

    try {
        var ORIGIN = new BlockPos(0, 0, 0)
        var NEIGHBOR = ORIGIN.offset(
            dataInt('scene_neighbor_dx', 1),
            dataInt('scene_neighbor_dy', 0),
            dataInt('scene_neighbor_dz', 0)
        )

        var sceneWorld = new DummyWorld(clientLevel.registryAccess())
        var core = new ArrayList()
        if (sourceState !== null) {
            sceneWorld.setBlock(ORIGIN, sourceState, 0)
            core.add(ORIGIN)
        }
        if (neighborState !== null) {
            sceneWorld.setBlock(NEIGHBOR, neighborState, 0)
            core.add(NEIGHBOR)
        }
        var contextCount = dataInt('scene_context_count', 0)
        for (var contextIndex = 0; contextIndex < contextCount; contextIndex++) {
            var prefix = `scene_context_${contextIndex}_`
            var contextState = null
            var contextFluid = dataString(`${prefix}fluid`)
            var contextBlock = dataString(`${prefix}block`)
            if (contextFluid !== null) {
                contextState = fluidStateFrom(contextFluid, data.getBoolean(`${prefix}flowing`))
            } else if (contextBlock !== null) {
                contextState = blockStateFrom(contextBlock)
            }
            if (contextState !== null) {
                var contextPos = ORIGIN.offset(
                    dataInt(`${prefix}dx`, 0),
                    dataInt(`${prefix}dy`, -1),
                    dataInt(`${prefix}dz`, 0)
                )
                sceneWorld.setBlock(contextPos, contextState, 0)
                core.add(contextPos)
            }
        }
        // Compatibility with recipes generated by the earlier script.
        if (contextCount === 0) {
            var legacyUnder = dataString('scene_under_block')
            var legacyState = legacyUnder === null ? itemBlockOf('under') : blockStateFrom(legacyUnder)
            if (legacyState !== null) {
                var legacyPos = new BlockPos(0, -1, 0)
                sceneWorld.setBlock(legacyPos, legacyState, 0)
                core.add(legacyPos)
            }
        }

        // A flowing block by itself looks like a disconnected puddle. JEFI
        // places its matching source one block farther away from the contact:
        // [source -> flow][flow <- source]. This is the recognizable in-world
        // generator arrangement and also gives the fluid renderer a flow vector.
        if (NEIGHBOR.getY() === 0) {
            var addFeed = (flowPos, awayX, awayY, awayZ, fluidId) => {
                if (fluidId === null) return
                var feedPos = flowPos.offset(awayX, awayY, awayZ)
                if (!sceneWorld.getBlockState(feedPos).isAir()) return
                var feedState = fluidStateFrom(fluidId, false)
                if (feedState === null) return
                sceneWorld.setBlock(feedPos, feedState, 0)
                core.add(feedPos)
            }
            if (originFlowing) {
                addFeed(ORIGIN, -NEIGHBOR.getX(), -NEIGHBOR.getY(), -NEIGHBOR.getZ(), originFluid)
            }
            if (neighborFlowing) {
                addFeed(NEIGHBOR, NEIGHBOR.getX(), NEIGHBOR.getY(), NEIGHBOR.getZ(), neighborFluid)
            }
        }

        var scene = new Scene().addClasses('fluid-block-generation-scene')
        scene.getLayout().width(120).minWidth(120).maxWidth(120).height(72).minHeight(72).maxHeight(72).flexGrow(0).flexShrink(0).overflow(YogaOverflow.HIDDEN)
        scene.getStyle().overflowVisible(false)
        scene.setRenderFacing(false)
        scene.setRenderSelect(false)
        scene.setIntractable(true)
        scene.setShowHoverBlockTips(false)
        scene.setAllowXEILookup(true)
        scene.setClipContext(scene.getClipBlock(), ClipFluid.ANY)
        scene.useOrtho()
        scene.useCacheBuffer()
        scene.createScene(sceneWorld, false, Size.of(120, 72))
        try {
        var hoveredIngredient = () => {
            var hovered = scene.getLastHoverPosFace()
            if (hovered === null) return null
            var hoveredState = sceneWorld.getBlockState(hovered.pos())
            var hoveredFluidState = hoveredState.getFluidState()
            if (!hoveredFluidState.isEmpty()) {
                var hoveredFluid = hoveredFluidState.getType()
                if (hoveredFluid instanceof FlowingFluid) hoveredFluid = hoveredFluid.getSource()
                var stack = new FluidStack(hoveredFluid, 1000)
                return LDLibJEIPlugin.createTypedIngredient(NeoForgeTypes.FLUID_STACK, stack).orElse(null)
            }
                var item = itemFromState(hoveredState)
                if (item === null || item.isEmpty()) return null
            return LDLibJEIPlugin.createTypedIngredient(VanillaTypes.ITEM_STACK, item).orElse(null)
        }

        scene.addEventListener('hoverTooltips', tooltipEvent => {
            var hovered = scene.getLastHoverPosFace()
            if (hovered === null) return
            var hoveredState = sceneWorld.getBlockState(hovered.pos())
            var hoveredFluidState = hoveredState.getFluidState()
            if (!hoveredFluidState.isEmpty()) {
                var hoveredFluid = hoveredFluidState.getType()
                if (hoveredFluid instanceof FlowingFluid) hoveredFluid = hoveredFluid.getSource()
                var fluidStack = new FluidStack(hoveredFluid, 1000)
                var fluidTips = new ArrayList()
                fluidTips.add(fluidStack.getDisplayName())
                fluidTips.add(Component.literal('1000 mB'))
                tooltipEvent.hoverTooltips = new HoverTooltips(fluidTips, null, null, null)
                return
            }
            var item = itemFromState(hoveredState)
            if (item !== null && !item.isEmpty()) {
                tooltipEvent.hoverTooltips = new HoverTooltips(DrawerHelper.getItemToolTip(item), null, null, item)
            }
        })
        LDLibJEIPlugin.clickableIngredient(scene, hoveredIngredient)
        } catch (hoverSetupError) {
            console.warn(`[Fluid Block Generation] Preview loaded without enhanced hover support: ${hoverSetupError}`)
        }
        scene.setRenderedCore(core)
        var minX = 0
        var minY = 0
        var minZ = 0
        var maxX = 0
        var maxY = 0
        var maxZ = 0
        for (var coreIndex = 0; coreIndex < core.size(); coreIndex++) {
            var corePos = core.get(coreIndex)
            minX = Math.min(minX, corePos.getX())
            minY = Math.min(minY, corePos.getY())
            minZ = Math.min(minZ, corePos.getZ())
            maxX = Math.max(maxX, corePos.getX())
            maxY = Math.max(maxY, corePos.getY())
            maxZ = Math.max(maxZ, corePos.getZ())
        }
        scene.setCenter(new Vector3f((minX + maxX + 1) / 2, (minY + maxY + 1) / 2, (minZ + maxZ + 1) / 2))
        // setCameraOrtho uses range * zoom, and zoom defaults to 5.
        scene.setZoom(1.0)
        var spanX = maxX - minX + 1
        var spanY = maxY - minY + 1
        var spanZ = maxZ - minZ + 1
        // Half the AABB diagonal is the theoretical minimum. Leave generous
        // room for the angled projection, fluid faces and the panel border so
        // no part of a tall or four-block generator is clipped.
        scene.setOrthoRange(Math.max(1.55, Math.sqrt(spanX * spanX + spanY * spanY + spanZ * spanZ) * 0.68))
        scene.setCameraYawAndPitch(-30.0, 25.0)
        scene.needCompileCache()

        sceneSlot.addChild(scene)
    } catch (sceneError) {
        // The slot row is hidden by default, so reveal it as the fallback.
        sceneSlot.getLayout().width(0)
        var inputs = ui.selectId('inputs').findFirst().orElse(null)
        if (inputs !== null) {
            inputs.removeClass('fluid-block-generation-inputs')
            inputs.addClasses('fluid-block-generation-inputs-shown')
        }
        console.warn(`[Fluid Block Generation] Could not build the recipe scene: ${sceneError}`)
    }
})

var fluidInteractionIconPatched = false
var fluidInteractionIconErrorLogged = false
ClientEvents.tick(event => {
    if (fluidInteractionIconPatched) return

    try {
        var LDLibJEIPlugin = Java.loadClass('com.lowdragmc.lowdraglib2.integration.xei.jei.LDLibJEIPlugin')
        var ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
        var HighResolutionDrawable = Java.loadClass('mezz.jei.common.gui.elements.HighResolutionDrawable')
        var FieldUtils = Java.loadClass('org.apache.commons.lang3.reflect.FieldUtils')

        var runtime = LDLibJEIPlugin.jeiRuntime
        if (runtime === null) return
        var recipeManager = runtime.getRecipeManager()
        var type = recipeManager.getRecipeType(ResourceLocation.parse('aoc:fluid_block_generation')).orElse(null)
        if (type === null) return
        var category = recipeManager.getRecipeCategory(type)
        if (category === null) return

        var rawIcon = runtime.getJeiHelpers().getGuiHelper()
            .drawableBuilder(ResourceLocation.parse('aoc:textures/gui/fluid-interaction.png'), 0, 0, 32, 32)
            .setTextureSize(32, 32)
            .build()
        var icon = new HighResolutionDrawable(rawIcon, 2)
        FieldUtils.writeDeclaredField(category, 'icon', icon, true)
        fluidInteractionIconPatched = true
        console.info('[Fluid Block Generation] Replaced MBD2 barrier category icon')
    } catch (iconError) {
        if (!fluidInteractionIconErrorLogged) {
            fluidInteractionIconErrorLogged = true
            console.warn(`[Fluid Block Generation] Could not replace the MBD2 category icon: ${iconError}`)
        }
    }
})
