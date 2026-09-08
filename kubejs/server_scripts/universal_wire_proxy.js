// Proxy native wire interactions through the universal spool items. Each mod
// still performs its own validation and creates its own wire network.
const AOC_WIRE_USE_CONTEXT = Java.loadClass('net.minecraft.world.item.context.UseOnContext')
const AOC_WIRE_DATA_COMPONENTS = Java.loadClass('net.minecraft.core.component.DataComponents')
const AOC_WIRE_CUSTOM_DATA = Java.loadClass('net.minecraft.world.item.component.CustomData')
const AOC_BUILT_IN_REGISTRIES = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const AOC_CREATE_ADDITION_SPOOL = Java.loadClass('com.mrh0.createaddition.item.WireSpool')
const AOC_ELECTRO_COMPONENTS = Java.loadClass('com.george_vi.electroenergetics.CEEDataComponents')
const AOC_ELECTRO_CONFIGS = Java.loadClass('com.george_vi.electroenergetics.config.CEEConfigs')
const AOC_POWERGRID_COMPONENTS = Java.loadClass('org.patryk3211.powergrid.collections.ModdedDataComponents')
const AOC_NEW_AGE_COMPONENTS = Java.loadClass('org.antarcticgardens.cna.CNADataComponents')

const AOC_WIRE_SYSTEM_KEY = 'aoc_wire_system'

// Higher universal tiers use the strongest native conductor available when a
// mod exposes fewer than five wire types.
const AOC_WIRE_PROXIES = {
    'kubejs:wire_spool': {
        createaddition: 'createaddition:copper_spool',
        electroenergetics: 'electroenergetics:copper_wire_spool',
        powergrid: 'powergrid:wire',
        create_new_age: 'create_new_age:copper_wire'
    },
    'kubejs:gold_wire_spool': {
        createaddition: 'createaddition:gold_spool',
        electroenergetics: 'electroenergetics:iron_wire_spool',
        powergrid: 'powergrid:golden_wire',
        create_new_age: 'create_new_age:overcharged_golden_wire'
    },
    'kubejs:electrum_wire_spool': {
        createaddition: 'createaddition:electrum_spool',
        electroenergetics: 'electroenergetics:electrum_wire_spool',
        powergrid: 'powergrid:golden_wire',
        create_new_age: 'create_new_age:overcharged_diamond_wire'
    },
    'kubejs:insulated_wire_spool': {
        createaddition: 'createaddition:electrum_spool',
        electroenergetics: 'electroenergetics:wire_spool',
        powergrid: 'powergrid:insulated_copper_wire',
        create_new_age: 'create_new_age:overcharged_diamond_wire'
    },
    'kubejs:heavily_insulated_wire_spool': {
        createaddition: 'createaddition:electrum_spool',
        electroenergetics: 'electroenergetics:heavily_insulated_wire_spool',
        powergrid: 'powergrid:insulated_copper_wire',
        create_new_age: 'create_new_age:overcharged_diamond_wire'
    }
}

const AOC_SUPPORTED_WIRE_SYSTEMS = {
    createaddition: true,
    electroenergetics: true,
    powergrid: true,
    create_new_age: true
}

// Normalize wire items released when a connection is cut or dismantled. Both
// loose wire and spool forms are included because the four mods do not all use
// the same kind of refund.
const AOC_NATIVE_WIRE_DROPS = {
    // Create Crafts & Additions
    'createaddition:copper_wire': 'kubejs:wire_spool',
    'createaddition:copper_spool': 'kubejs:wire_spool',
    'createaddition:iron_wire': 'kubejs:gold_wire_spool',
    'createaddition:gold_wire': 'kubejs:gold_wire_spool',
    'createaddition:gold_spool': 'kubejs:gold_wire_spool',
    'createaddition:electrum_wire': 'kubejs:electrum_wire_spool',
    'createaddition:electrum_spool': 'kubejs:electrum_wire_spool',

    // Create: Electro Energetics
    'electroenergetics:copper_wire': 'kubejs:wire_spool',
    'electroenergetics:copper_wire_spool': 'kubejs:wire_spool',
    'electroenergetics:iron_wire': 'kubejs:gold_wire_spool',
    'electroenergetics:iron_wire_strand': 'kubejs:gold_wire_spool',
    'electroenergetics:iron_wire_spool': 'kubejs:gold_wire_spool',
    'electroenergetics:electrum_wire': 'kubejs:electrum_wire_spool',
    'electroenergetics:electrum_wire_spool': 'kubejs:electrum_wire_spool',
    'electroenergetics:insulated_wire': 'kubejs:insulated_wire_spool',
    'electroenergetics:wire_spool': 'kubejs:insulated_wire_spool',
    'electroenergetics:heavily_insulated_wire': 'kubejs:heavily_insulated_wire_spool',
    'electroenergetics:heavily_insulated_wire_spool': 'kubejs:heavily_insulated_wire_spool',

    // Create: Power Grid
    'powergrid:wire': 'kubejs:wire_spool',
    'powergrid:iron_wire': 'kubejs:gold_wire_spool',
    'powergrid:golden_wire': 'kubejs:gold_wire_spool',
    'powergrid:insulated_copper_wire': 'kubejs:insulated_wire_spool',

    // Create: New Age
    'create_new_age:copper_wire': 'kubejs:wire_spool',
    'create_new_age:overcharged_iron_wire': 'kubejs:gold_wire_spool',
    'create_new_age:overcharged_golden_wire': 'kubejs:gold_wire_spool',
    'create_new_age:overcharged_diamond_wire': 'kubejs:electrum_wire_spool'
}

const AOC_ELECTRO_LOOSE_WIRES = {
    'electroenergetics:copper_wire': true,
    'electroenergetics:iron_wire': true,
    'electroenergetics:iron_wire_strand': true,
    'electroenergetics:electrum_wire': true,
    'electroenergetics:insulated_wire': true,
    'electroenergetics:heavily_insulated_wire': true
}

function aocUniversalWireDropCount(nativeId, nativeCount) {
    // Power Grid measures both placement cost and refunds in wire-length
    // units. Preserve that count for the universal spool as well.
    if (nativeId.startsWith('powergrid:')) return nativeCount

    // Electro Energetics refunds `wireItemsPerSpool` loose wires when the
    // player has no empty spool. Convert that bundle back into spool units.
    if (AOC_ELECTRO_LOOSE_WIRES[nativeId]) {
        const wiresPerSpool = Number(AOC_ELECTRO_CONFIGS.server().wiresPerSpool.get())
        return Math.max(1, Math.ceil(nativeCount / Math.max(1, wiresPerSpool)))
    }

    // Create Crafts & Additions and Create: New Age already refund one native
    // item per connection, so their count is already in universal-spool units.
    return nativeCount
}

function aocWireCustomTag(stack) {
    return stack.getOrDefault(
        AOC_WIRE_DATA_COMPONENTS.CUSTOM_DATA,
        AOC_WIRE_CUSTOM_DATA.EMPTY
    ).copyTag()
}

function aocWireBoundSystem(stack) {
    const tag = aocWireCustomTag(stack)
    if (tag.contains(AOC_WIRE_SYSTEM_KEY)) {
        return String(tag.getString(AOC_WIRE_SYSTEM_KEY))
    }

    // Power Grid now operates directly on the universal item through its
    // data-driven wire registry, so its native endpoint component is the bind.
    if (stack.has(AOC_POWERGRID_COMPONENTS.CONNECTION_DATA.get())) {
        return 'powergrid'
    }

    return ''
}

function aocSetWireBoundSystem(stack, system) {
    const tag = aocWireCustomTag(stack)
    tag.putString(AOC_WIRE_SYSTEM_KEY, system)
    stack.set(AOC_WIRE_DATA_COMPONENTS.CUSTOM_DATA, AOC_WIRE_CUSTOM_DATA.of(tag))
    stack.set(AOC_WIRE_DATA_COMPONENTS.ENCHANTMENT_GLINT_OVERRIDE, true)
}

function aocClearWireBoundSystem(stack) {
    const tag = aocWireCustomTag(stack)
    tag.remove(AOC_WIRE_SYSTEM_KEY)

    if (tag.isEmpty()) {
        stack.remove(AOC_WIRE_DATA_COMPONENTS.CUSTOM_DATA)
    } else {
        stack.set(AOC_WIRE_DATA_COMPONENTS.CUSTOM_DATA, AOC_WIRE_CUSTOM_DATA.of(tag))
    }

    stack.remove(AOC_WIRE_DATA_COMPONENTS.ENCHANTMENT_GLINT_OVERRIDE)
}

function aocNativeWireHasSelection(system, stack) {
    if (system === 'createaddition') {
        return AOC_CREATE_ADDITION_SPOOL.hasPos(aocWireCustomTag(stack))
    }

    if (system === 'electroenergetics') {
        return stack.has(AOC_ELECTRO_COMPONENTS.SELECTED_NODE)
    }

    if (system === 'powergrid') {
        return stack.has(AOC_POWERGRID_COMPONENTS.CONNECTION_DATA.get())
    }

    if (system === 'create_new_age') {
        return stack.has(AOC_NEW_AGE_COMPONENTS.BOUND_TO)
    }

    return false
}

function aocUniversalWireNeedsSecondConnector(stack) {
    if (aocWireBoundSystem(stack)) return true
    if (AOC_CREATE_ADDITION_SPOOL.hasPos(aocWireCustomTag(stack))) return true
    if (stack.has(AOC_ELECTRO_COMPONENTS.SELECTED_NODE)) return true
    if (stack.has(AOC_POWERGRID_COMPONENTS.CONNECTION_DATA.get())) return true
    if (stack.has(AOC_NEW_AGE_COMPONENTS.BOUND_TO)) return true
    return false
}

function aocClearAllWireSelectionData(stack) {
    const tag = aocWireCustomTag(stack)
    tag.remove(AOC_WIRE_SYSTEM_KEY)
    tag.remove('x')
    tag.remove('y')
    tag.remove('z')
    tag.remove('node')

    if (tag.isEmpty()) {
        stack.remove(AOC_WIRE_DATA_COMPONENTS.CUSTOM_DATA)
    } else {
        stack.set(AOC_WIRE_DATA_COMPONENTS.CUSTOM_DATA, AOC_WIRE_CUSTOM_DATA.of(tag))
    }

    stack.remove(AOC_ELECTRO_COMPONENTS.SELECTED_NODE)
    stack.remove(AOC_POWERGRID_COMPONENTS.CONNECTION_DATA.get())
    stack.remove(AOC_NEW_AGE_COMPONENTS.BOUND_TO)
    stack.remove(AOC_WIRE_DATA_COMPONENTS.ENCHANTMENT_GLINT_OVERRIDE)
}

// Keep the foil effect synchronized with native endpoint components. Power
// Grid sets its component directly, while the other integrations pass through
// aocSetWireBoundSystem above.
PlayerEvents.tick(event => {
    const player = event.player
    const stacks = [player.getMainHandItem(), player.getOffhandItem()]

    stacks.forEach(stack => {
        if (!AOC_WIRE_PROXIES[String(stack.id)]) return

        const needsSecondConnector = aocUniversalWireNeedsSecondConnector(stack)
        const hasGlint = stack.has(AOC_WIRE_DATA_COMPONENTS.ENCHANTMENT_GLINT_OVERRIDE)

        if (needsSecondConnector && !hasGlint) {
            stack.set(AOC_WIRE_DATA_COMPONENTS.ENCHANTMENT_GLINT_OVERRIDE, true)
        } else if (!needsSecondConnector && hasGlint) {
            stack.remove(AOC_WIRE_DATA_COMPONENTS.ENCHANTMENT_GLINT_OVERRIDE)
        }
    })
})

Object.keys(AOC_WIRE_PROXIES).forEach(universalId => {
    ItemEvents.firstLeftClicked(universalId, event => {
        if (!event.player.isShiftKeyDown()) return
        if (!aocUniversalWireNeedsSecondConnector(event.item)) return

        aocClearAllWireSelectionData(event.item)
        event.player.setItemInHand(event.hand, event.item)
        event.player.tell('Wire connection cancelled.')
    })
})

BlockEvents.rightClicked(event => {
    const universalId = String(event.item.id)
    const tier = AOC_WIRE_PROXIES[universalId]
    if (!tier) return

    const clickedSystem = String(event.block.id).split(':')[0]
    const boundSystem = aocWireBoundSystem(event.item)

    const clickedSupportedSystem = AOC_SUPPORTED_WIRE_SYSTEMS[clickedSystem]

    // Once Power Grid supplies the first endpoint, its native wire may use an
    // ordinary block face as the second endpoint. Other systems still require
    // one of their own connectors at both ends.
    if (!boundSystem && !clickedSupportedSystem) return
    if (boundSystem !== 'powergrid' && !clickedSupportedSystem) return

    if (boundSystem && clickedSupportedSystem && boundSystem !== clickedSystem) {
        event.player.tell(`This spool is bound to ${boundSystem}; finish that connection first.`)
        event.cancel()
        return
    }

    const system = boundSystem || clickedSystem

    // The universal items have native Power Grid wire registry entries. Let
    // Power Grid handle these clicks directly so its client preview, wall
    // endpoints, distance cost, and component synchronization all work.
    if (system === 'powergrid') return

    const nativeId = tier[system]
    if (!nativeId || !Item.exists(nativeId)) return

    const originalItem = event.item.getItem()
    const originalCount = event.item.getCount()
    const nativeItem = Item.of(nativeId).getItem()
    const nativeStack = event.item.transmuteCopy(nativeItem, originalCount)

    aocSetWireBoundSystem(nativeStack, system)
    event.player.setItemInHand(event.hand, nativeStack)

    try {
        const context = new AOC_WIRE_USE_CONTEXT(event.player, event.hand, event.hitResult)
        nativeStack.useOn(context)
    } finally {
        // Power Grid charges wire items according to connection length. Carry
        // its remaining count back to the universal stack; the other systems
        // retain their existing universal-spool count behavior.
        const restoredCount = system === 'powergrid'
            ? nativeStack.getCount()
            : originalCount

        if (restoredCount <= 0) {
            event.player.setItemInHand(event.hand, Item.of('minecraft:air'))
        } else {
            const restored = nativeStack.transmuteCopy(originalItem, restoredCount)

            if (aocNativeWireHasSelection(system, nativeStack)) {
                aocSetWireBoundSystem(restored, system)
            } else {
                aocClearWireBoundSystem(restored)
            }

            event.player.setItemInHand(event.hand, restored)
        }
    }

    // The native use was already invoked above.
    event.cancel()
})

EntityEvents.spawned('minecraft:item', event => {
    const entity = event.entity
    const droppedStack = entity.getItem()
    const nativeId = String(droppedStack.id)
    const universalId = AOC_NATIVE_WIRE_DROPS[nativeId]
    if (!universalId) return

    // Build a clean stack so a native connector endpoint can never survive on
    // an item that was dropped midway through a connection.
    const universalCount = aocUniversalWireDropCount(nativeId, droppedStack.getCount())
    entity.setItem(Item.of(universalId, universalCount))
})

function aocNormalizePowerGridWireEntity(event) {
    const entity = event.entity
    const nativeId = String(AOC_BUILT_IN_REGISTRIES.ITEM.getKey(entity.getItem()))
    const universalId = AOC_NATIVE_WIRE_DROPS[nativeId]
    if (!universalId || !nativeId.startsWith('powergrid:')) return

    // Power Grid requires an exact item-identity match when extending or
    // attaching to an existing wire. Migrate both newly spawned and loaded
    // native wire entities while retaining their length-based item count.
    entity.setItem(Item.of(universalId).getItem(), entity.getWireCount())
}

EntityEvents.spawned('powergrid:block_wire', aocNormalizePowerGridWireEntity)
EntityEvents.spawned('powergrid:hanging_wire', aocNormalizePowerGridWireEntity)
