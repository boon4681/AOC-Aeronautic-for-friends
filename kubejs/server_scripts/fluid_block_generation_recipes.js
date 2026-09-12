ServerEvents.recipes(event => {
    var FluidInteractionRegistryAccessor = Java.loadClass('com.simibubi.create.foundation.mixin.accessor.FluidInteractionRegistryAccessor')
    var BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
    var BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
    var Blocks = Java.loadClass('net.minecraft.world.level.block.Blocks')
    var Items = Java.loadClass('net.minecraft.world.item.Items')
    var Fluids = Java.loadClass('net.minecraft.world.level.material.Fluids')
    var FluidType = Java.loadClass('net.neoforged.neoforge.fluids.FluidType')
    var Function = Java.loadClass('java.util.function.Function')
    var DummyWorld = Java.loadClass('com.lowdragmc.lowdraglib2.utils.virtuallevel.DummyWorld')
    var TrackedDummyWorld = Java.loadClass('com.lowdragmc.lowdraglib2.utils.virtuallevel.TrackedDummyWorld')

    var MAX_FIXED_POSITIONS = 3
    var MAX_SEARCH_CALLS = 4096

    var AIR = Blocks.AIR.defaultBlockState()
    var ORIGIN = new BlockPos(8, 8, 8)
    var NEIGHBOR = ORIGIN.east()
    var SCENE_MIN = ORIGIN.offset(-2, -2, -2)
    var SCENE_MAX = NEIGHBOR.offset(2, 2, 2)
    var ORIGIN_KEY = ORIGIN.asLong()
    var NEIGHBOR_KEY = NEIGHBOR.asLong()

    var baseLevel
    try {
        baseLevel = new DummyWorld(event.registries.access())
    } catch (levelError) {
        console.error(`[Fluid Block Generation] Could not build a sandbox level, no recipes discovered: ${levelError}`)
        return
    }

    // TrackedDummyWorld runs its block filter on every getBlockState and then
    // reads through to the level it proxies, which turns the filter into a
    // record of the positions an interaction predicate actually looked at.
    var readKeys = []
    var recording = false
    var trackedLevel = null
    try {
        trackedLevel = new TrackedDummyWorld(baseLevel)
        trackedLevel.setBlockFilter(readPos => {
            if (recording) readKeys.push(readPos.asLong())
            return true
        })
    } catch (trackedError) {
        trackedLevel = null
        console.warn(`[Fluid Block Generation] No read tracking, context conditions stay undiscovered: ${trackedError}`)
    }

    var stillCandidates = []
    var fluidCandidates = []
    for (var fluid of BuiltInRegistries.FLUID) {
        if (fluid === Fluids.EMPTY) continue
        var stillState = fluid.defaultFluidState()
        if (!stillState.isSource()) continue
        var fluidId = `${BuiltInRegistries.FLUID.getKey(fluid)}`
        var stillEntry = { fluidId: fluidId, itemId: null, blockId: null, flowing: false, state: stillState.createLegacyBlock(), fluidType: stillState.getFluidType(), fluidState: stillState }
        stillCandidates.push(stillEntry)
        fluidCandidates.push(stillEntry)
        var flowing = null
        try {
            flowing = fluid.getFlowing().defaultFluidState()
        } catch (notFlowing) {
            flowing = null
        }
        if (flowing !== null && !flowing.isEmpty() && !flowing.isSource()) {
            fluidCandidates.push({ fluidId: fluidId, itemId: null, blockId: null, flowing: true, state: flowing.createLegacyBlock(), fluidType: flowing.getFluidType(), fluidState: flowing })
        }
    }

    var blockCandidates = []
    for (var block of BuiltInRegistries.BLOCK) {
        var blockState = block.defaultBlockState()
        if (blockState.isAir()) continue
        if (blockState.hasBlockEntity()) continue
        if (!blockState.getFluidState().isEmpty()) continue
        var blockItem = block.asItem()
        if (blockItem === null || blockItem === Items.AIR) continue
        blockCandidates.push({ fluidId: null, itemId: `${BuiltInRegistries.ITEM.getKey(blockItem)}`, blockId: `${BuiltInRegistries.BLOCK.getKey(block)}`, flowing: false, state: blockState })
    }

    var allCandidates = stillCandidates.concat(blockCandidates)


    var sourcesOfType = fluidType =>
        fluidCandidates
            .filter(candidate => candidate.fluidType === fluidType)
            .sort((left, right) => (right.flowing ? 1 : 0) - (left.flowing ? 1 : 0))

    var capturedValue = (object, javaClass) => {
        try {
            for (var capturedField of object.getClass().getDeclaredFields()) {
                try {
                    if (!capturedField.trySetAccessible()) continue
                    var captured = capturedField.get(object)
                    if (javaClass.class.isInstance(captured)) return captured
                } catch (capturedFieldError) {
                    // Try the remaining captured fields.
                }
            }
        } catch (captureError) {
            // Custom predicate/callback; use the sandbox fallback.
        }
        return null
    }

    var resultItemId = resultState => {
        if (resultState === null || resultState.isAir()) return null
        var resultItem = resultState.getBlock().asItem()
        if (resultItem === null || resultItem === Items.AIR) return null
        return `${BuiltInRegistries.ITEM.getKey(resultItem)}`
    }

    var setBoth = (pos, state) => {
        baseLevel.setBlock(pos, state, 0)
        if (trackedLevel !== null) trackedLevel.setBlock(pos, state, 0)
    }

    var sceneDirty = true
    var written = []

    // Clears only what the previous arrangement wrote, falling back to wiping
    // the whole box once an interaction has run and scattered blocks around.
    var applyFixed = (sceneSource, fixedList) => {
        if (sceneDirty) {
            for (var scenePos of BlockPos.betweenClosed(SCENE_MIN, SCENE_MAX)) setBoth(scenePos, AIR)
            sceneDirty = false
        } else {
            for (var oldKey of written) setBoth(BlockPos.of(oldKey), AIR)
        }
        written = []
        setBoth(ORIGIN, sceneSource.state)
        written.push(ORIGIN_KEY)
        for (var placement of fixedList) {
            setBoth(BlockPos.of(placement.key), placement.entry.state)
            written.push(placement.key)
        }
        return baseLevel.getFluidState(ORIGIN).getType() === sceneSource.fluidState.getType()
    }

    // Verdict plus every position the predicate looked at.
    var trackedRun = (readEntry, readSource) => {
        if (trackedLevel === null) return { passed: false, reads: [] }
        readKeys = []
        recording = true
        var passed = false
        try {
            passed = readEntry.predicate().test(trackedLevel, ORIGIN, NEIGHBOR, readSource.fluidState)
        } catch (trackError) {
            passed = false
        } finally {
            recording = false
        }
        var seenKeys = []
        for (var readKey of readKeys) {
            if (readKey === ORIGIN_KEY) continue
            if (seenKeys.indexOf(readKey) < 0) seenKeys.push(readKey)
        }
        return { passed: passed, reads: seenKeys }
    }

    var runInteraction = (runEntry, runSource) => {
        sceneDirty = true
        try {
            runEntry.interaction().interact(baseLevel, ORIGIN, NEIGHBOR, runSource.fluidState)
        } catch (interactError) {
            return null
        }
        try {
            var result = baseLevel.getBlockState(ORIGIN)
            if (result.isAir()) return null
            if (result.getFluidState().getType() === runSource.fluidState.getType()) return null
            var resultAsItem = result.getBlock().asItem()
            if (resultAsItem === null || resultAsItem === Items.AIR) return null
            return `${BuiltInRegistries.ITEM.getKey(resultAsItem)}`
        } catch (readError) {
            return null
        }
    }

    var safePath = rawId => rawId.replaceAll(':', '/').replaceAll('.', '_')
    var added = new Set()
    var discovered = 0
    var unresolved = 0
    var contextFound = 0

    // Whatever sits at the neighbour position drives the second slot; anything
    // else the predicate demanded goes in the context slot under the plus.
    var add = (addSource, fixedList, addResult) => {
        var neighborEntry = null
        var neighborPlacement = null
        var contextPlacements = []
        for (var placement of fixedList) {
            if (placement.key === NEIGHBOR_KEY) {
                neighborEntry = placement.entry
                neighborPlacement = placement
            } else {
                contextPlacements.push(placement)
            }
        }
        if (neighborEntry === null) return

        var secondFluid = neighborEntry.fluidId
        var secondBlock = neighborEntry.itemId
        var firstContext = contextPlacements.length === 0 ? null : contextPlacements[0].entry
        var contextItem = firstContext === null ? null : firstContext.itemId
        var arrangementKey = contextPlacements.map(contextPlacement => `${contextPlacement.key}:${contextPlacement.entry.fluidId}:${contextPlacement.entry.blockId}`).join(',')
        var duplicateKey = `${addSource.fluidId}|${secondFluid}|${secondBlock}|${arrangementKey}|${addResult}`
        if (added.has(duplicateKey)) return
        added.add(duplicateKey)

        var recipeId = `${addSource.fluidId}/${secondFluid === null ? secondBlock : secondFluid}/${contextItem === null ? 'none' : contextItem}/${addResult}`
        try {
            var builder = event.recipes.aoc.fluid_block_generation()
                .id(`aoc:fluid_block_generation/${safePath(recipeId)}`)
                .duration(1)
                .uiName('first', firstBuilder => firstBuilder.inputFluids(Fluid.of(addSource.fluidId, 1000)))
                .uiName('result', resultBuilder => resultBuilder.outputItems(addResult))
            if (secondFluid !== null) {
                builder.uiName('second', secondFluidBuilder => secondFluidBuilder.inputFluids(Fluid.of(secondFluid, 1000)))
            } else if (secondBlock !== null) {
                builder.uiName('second_block', secondBlockBuilder => secondBlockBuilder.inputItems(secondBlock))
            }
            if (contextItem !== null) {
                builder.uiName('under', underBuilder => underBuilder.inputItems(contextItem))
            }

            // The slots cannot express source vs flowing, so the exact scene
            // the probe used is written alongside the recipe for the client.
            builder.addDataString('scene_origin_fluid', addSource.fluidId)
            builder.addDataBoolean('scene_origin_flowing', addSource.flowing)
            var neighborPos = BlockPos.of(neighborPlacement.key)
            builder.addDataNumber('scene_neighbor_dx', neighborPos.getX() - ORIGIN.getX())
            builder.addDataNumber('scene_neighbor_dy', neighborPos.getY() - ORIGIN.getY())
            builder.addDataNumber('scene_neighbor_dz', neighborPos.getZ() - ORIGIN.getZ())
            if (secondFluid !== null) {
                builder.addDataString('scene_neighbor_fluid', secondFluid)
                builder.addDataBoolean('scene_neighbor_flowing', neighborEntry.flowing)
            } else if (neighborEntry.blockId !== null) {
                builder.addDataString('scene_neighbor_block', neighborEntry.blockId)
            }
            builder.addDataNumber('scene_context_count', contextPlacements.length)
            for (var contextIndex = 0; contextIndex < contextPlacements.length; contextIndex++) {
                var contextPlacement = contextPlacements[contextIndex]
                var contextEntry = contextPlacement.entry
                var contextPos = BlockPos.of(contextPlacement.key)
                var prefix = `scene_context_${contextIndex}_`
                builder.addDataNumber(`${prefix}dx`, contextPos.getX() - ORIGIN.getX())
                builder.addDataNumber(`${prefix}dy`, contextPos.getY() - ORIGIN.getY())
                builder.addDataNumber(`${prefix}dz`, contextPos.getZ() - ORIGIN.getZ())
                if (contextEntry.fluidId !== null) {
                    builder.addDataString(`${prefix}fluid`, contextEntry.fluidId)
                    builder.addDataBoolean(`${prefix}flowing`, contextEntry.flowing)
                } else if (contextEntry.blockId !== null) {
                    builder.addDataString(`${prefix}block`, contextEntry.blockId)
                }
            }
            discovered++
        } catch (addError) {
            console.warn(`[Fluid Block Generation] Skipped ${recipeId}: ${addError}`)
        }
    }

    var tryArrangement = (tryEntry, trySource, fixedList) => {
        if (!applyFixed(trySource, fixedList)) return false
        var attempt = trackedRun(tryEntry, trySource)
        if (!attempt.passed) return false
        applyFixed(trySource, fixedList)
        var produced = runInteraction(tryEntry, trySource)
        if (produced === null) return false
        add(trySource, fixedList, produced)
        return true
    }

    // JEFI's greedy search. Each round takes the first position the predicate
    // has read but nothing is fixed at yet. A candidate that satisfies the
    // predicate wins; one that makes the predicate read somewhere new is kept,
    // since short-circuiting only exposes the next clause once the previous
    // one is satisfied.
    var searchContext = (searchEntry, searchSource, seedPlacements) => {
        if (trackedLevel === null) return null
        var fixedList = seedPlacements === null ? [] : seedPlacements.slice()
        if (!applyFixed(searchSource, fixedList)) return null
        var base = trackedRun(searchEntry, searchSource)
        if (base.passed && tryArrangement(searchEntry, searchSource, fixedList)) return fixedList.slice()

        var seenKeys = base.reads.slice()
        var calls = 0

        while (fixedList.length < MAX_FIXED_POSITIONS) {
            var advanced = false
            for (var targetKey of seenKeys.slice()) {
                var alreadyFixed = false
                for (var fixedPlacement of fixedList) {
                    if (fixedPlacement.key === targetKey) alreadyFixed = true
                }
                if (alreadyFixed) continue

                for (var candidate of allCandidates) {
                    calls++
                    if (calls > MAX_SEARCH_CALLS) return null
                    fixedList.push({ key: targetKey, entry: candidate })
                    if (!applyFixed(searchSource, fixedList)) {
                        fixedList.pop()
                        continue
                    }
                    var attempt = trackedRun(searchEntry, searchSource)
                    if (attempt.passed) {
                        if (tryArrangement(searchEntry, searchSource, fixedList)) return fixedList.slice()
                        fixedList.pop()
                        continue
                    }
                    var revealed = false
                    for (var attemptKey of attempt.reads) {
                        if (seenKeys.indexOf(attemptKey) < 0) {
                            seenKeys.push(attemptKey)
                            revealed = true
                        }
                    }
                    if (revealed) {
                        advanced = true
                        break
                    }
                    fixedList.pop()
                }
                if (advanced) break
            }
            if (!advanced) return null
        }
        return null
    }

    var started = Date.now()
    for (var registryEntry of FluidInteractionRegistryAccessor.getInteractions().entrySet()) {
        var sources = sourcesOfType(registryEntry.getKey())
        if (sources.length === 0) continue

        for (var information of registryEntry.getValue()) {
            var resolved = false
            var targetTypeHint = capturedValue(information.predicate(), FluidType)
            var resultFunction = capturedValue(information.interaction(), Function)
            var hintedNeighbors = targetTypeHint === null ? [] : sourcesOfType(targetTypeHint)

            // Fast path for the normal NeoForge constructors. This covers the
            // overwhelming majority of Create/add-on fluid interactions.
            if (resultFunction !== null && hintedNeighbors.length > 0) {
                var displayNeighbor = hintedNeighbors[0]
                for (var fastSource of sources) {
                    try {
                        var fastResult = resultItemId(resultFunction.apply(fastSource.fluidState))
                        if (fastResult !== null) {
                            add(fastSource, [{ key: NEIGHBOR_KEY, entry: displayNeighbor }], fastResult)
                            resolved = true
                        }
                    } catch (fastPathError) {
                        // Fall through to the sandbox path below.
                    }
                }
                if (resolved) continue
            }

            // A predicate's accepted neighbour blocks are normally identical
            // for source and flowing forms. Discover them once, then only
            // re-run the small matching set for the other source forms.
            var matchingBlockNeighbors = null
            var contextArrangement = null
            for (var sourceCandidate of sources) {
                var hitHere = false
                var neighborCandidates = hintedNeighbors.length > 0 ? hintedNeighbors : fluidCandidates
                for (var neighbor of neighborCandidates) {
                    if (tryArrangement(information, sourceCandidate, [{ key: NEIGHBOR_KEY, entry: neighbor }])) hitHere = true
                }
                if (!hitHere && hintedNeighbors.length === 0) {
                    if (matchingBlockNeighbors === null) {
                        matchingBlockNeighbors = []
                        for (var blockNeighbor of blockCandidates) {
                            var blockPlacement = [{ key: NEIGHBOR_KEY, entry: blockNeighbor }]
                            if (!applyFixed(sourceCandidate, blockPlacement)) continue
                            if (!trackedRun(information, sourceCandidate).passed) continue
                            matchingBlockNeighbors.push(blockNeighbor)
                            if (tryArrangement(information, sourceCandidate, blockPlacement)) hitHere = true
                        }
                    } else {
                        for (var matchingBlock of matchingBlockNeighbors) {
                            if (tryArrangement(information, sourceCandidate, [{ key: NEIGHBOR_KEY, entry: matchingBlock }])) hitHere = true
                        }
                    }
                }
                var contextSeed = hintedNeighbors.length > 0
                    ? [{ key: NEIGHBOR_KEY, entry: hintedNeighbors[0] }]
                    : null
                if (!hitHere) {
                    if (contextArrangement !== null) {
                        hitHere = tryArrangement(information, sourceCandidate, contextArrangement)
                    } else {
                        var foundContext = searchContext(information, sourceCandidate, contextSeed)
                        if (foundContext !== null) {
                            contextArrangement = foundContext
                            hitHere = true
                            contextFound++
                        }
                    }
                }
                if (hitHere) resolved = true
            }

            if (!resolved) unresolved++
        }
    }

    console.info(`[Fluid Block Generation] Added ${discovered} JEI display recipes in ${Date.now() - started} ms; ${contextFound} needed a context search; ${unresolved} unresolved`)
})
