// Client HUD and dynamic properties for the universal wire spool family.
const AOC_UI_MINECRAFT = Java.loadClass('net.minecraft.client.Minecraft')
const AOC_UI_DATA_COMPONENTS = Java.loadClass('net.minecraft.core.component.DataComponents')
const AOC_UI_CUSTOM_DATA = Java.loadClass('net.minecraft.world.item.component.CustomData')
const AOC_UI_VEC3 = Java.loadClass('net.minecraft.world.phys.Vec3')
const AOC_UI_RENDER_GUI_POST = Java.loadClass('net.neoforged.neoforge.client.event.RenderGuiEvent$Post')
const AOC_UI_CREATE_ADDITION_SPOOL = Java.loadClass('com.mrh0.createaddition.item.WireSpool')

let AOC_UI_ELECTRO_COMPONENTS = null
let AOC_UI_POWERGRID_COMPONENTS = null
let AOC_UI_NEW_AGE_COMPONENTS = null

function aocUiElectroComponents() {
    if (!AOC_UI_ELECTRO_COMPONENTS) {
        AOC_UI_ELECTRO_COMPONENTS = Java.loadClass('com.george_vi.electroenergetics.CEEDataComponents')
    }
    return AOC_UI_ELECTRO_COMPONENTS
}

function aocUiPowerGridComponents() {
    if (!AOC_UI_POWERGRID_COMPONENTS) {
        AOC_UI_POWERGRID_COMPONENTS = Java.loadClass('org.patryk3211.powergrid.collections.ModdedDataComponents')
    }
    return AOC_UI_POWERGRID_COMPONENTS
}

function aocUiNewAgeComponents() {
    if (!AOC_UI_NEW_AGE_COMPONENTS) {
        AOC_UI_NEW_AGE_COMPONENTS = Java.loadClass('org.antarcticgardens.cna.CNADataComponents')
    }
    return AOC_UI_NEW_AGE_COMPONENTS
}

const AOC_UI_SYSTEM_KEY = 'aoc_wire_system'

const AOC_UI_SYSTEM_NAMES = {
    createaddition: 'Create Crafts & Additions',
    electroenergetics: 'Create: Electro Energetics',
    powergrid: 'Create: Power Grid',
    create_new_age: 'Create: New Age'
}

const AOC_UI_WIRE_TIERS = {
    'kubejs:wire_spool': {
        createaddition: 'createaddition:copper_spool',
        electroenergetics: 'electroenergetics:copper_wire_spool',
        electroType: 'COPPER',
        powergrid: 'powergrid:wire',
        create_new_age: 'create_new_age:copper_wire',
        labels: ['Copper', 'Copper', 'Copper', 'Copper']
    },
    'kubejs:gold_wire_spool': {
        createaddition: 'createaddition:gold_spool',
        electroenergetics: 'electroenergetics:iron_wire_spool',
        electroType: 'IRON',
        powergrid: 'powergrid:golden_wire',
        create_new_age: 'create_new_age:overcharged_golden_wire',
        labels: ['Gold', 'Iron', 'Gold', 'Overcharged Gold']
    },
    'kubejs:electrum_wire_spool': {
        createaddition: 'createaddition:electrum_spool',
        electroenergetics: 'electroenergetics:electrum_wire_spool',
        electroType: 'ELECTRUM',
        powergrid: 'powergrid:golden_wire',
        create_new_age: 'create_new_age:overcharged_diamond_wire',
        labels: ['Electrum', 'Electrum', 'Gold', 'Overcharged Diamond']
    },
    'kubejs:insulated_wire_spool': {
        createaddition: 'createaddition:electrum_spool',
        electroenergetics: 'electroenergetics:wire_spool',
        electroType: 'STANDARD',
        powergrid: 'powergrid:insulated_copper_wire',
        create_new_age: 'create_new_age:overcharged_diamond_wire',
        labels: ['Electrum', 'Standard Insulated', 'Insulated Copper', 'Overcharged Diamond']
    },
    'kubejs:heavily_insulated_wire_spool': {
        createaddition: 'createaddition:electrum_spool',
        electroenergetics: 'electroenergetics:heavily_insulated_wire_spool',
        electroType: 'HEAVILY_INSULATED',
        powergrid: 'powergrid:insulated_copper_wire',
        create_new_age: 'create_new_age:overcharged_diamond_wire',
        labels: ['Electrum', 'Heavy Insulated', 'Insulated Copper', 'Overcharged Diamond']
    }
}

function aocUiCustomTag(stack) {
    return stack.getOrDefault(
        AOC_UI_DATA_COMPONENTS.CUSTOM_DATA,
        AOC_UI_CUSTOM_DATA.EMPTY
    ).copyTag()
}

function aocUiBoundSystem(stack) {
    const tag = aocUiCustomTag(stack)
    if (tag.contains(AOC_UI_SYSTEM_KEY)) return String(tag.getString(AOC_UI_SYSTEM_KEY))
    const powerGridComponents = aocUiPowerGridComponents()
    const electroComponents = aocUiElectroComponents()
    const newAgeComponents = aocUiNewAgeComponents()
    if (stack.has(powerGridComponents.CONNECTION_DATA.get())) return 'powergrid'
    if (AOC_UI_CREATE_ADDITION_SPOOL.hasPos(tag)) return 'createaddition'
    if (stack.has(electroComponents.SELECTED_NODE)) return 'electroenergetics'
    if (stack.has(newAgeComponents.BOUND_TO)) return 'create_new_age'
    return ''
}

function aocUiStartingPosition(stack, system, level) {
    try {
        if (system === 'createaddition') {
            const tag = aocUiCustomTag(stack)
            return new AOC_UI_VEC3(
                tag.getInt('x') + 0.5,
                tag.getInt('y') + 0.5,
                tag.getInt('z') + 0.5
            )
        }

        if (system === 'electroenergetics') {
            const node = stack.get(aocUiElectroComponents().SELECTED_NODE)
            return node ? node.getPosition(level) : null
        }

        if (system === 'powergrid') {
            const connection = stack.get(aocUiPowerGridComponents().CONNECTION_DATA.get())
            const endpoint = connection ? connection.endpoint() : null
            return endpoint ? endpoint.getExactPosition(level) : null
        }

        if (system === 'create_new_age') {
            const pos = stack.get(aocUiNewAgeComponents().BOUND_TO)
            return pos ? AOC_UI_VEC3.atCenterOf(pos) : null
        }
    } catch (ignored) {
        return null
    }

    return null
}

function aocUiFormatNumber(value) {
    const number = Number(value)
    if (!Number.isFinite(number)) return String(value)
    return String(Math.round(number * 100000) / 100000)
}

function aocUiAddNativeProperties(event, system, nativeId, tier, universalId) {
    const nativeStack = Item.of(nativeId)
    const labelIndex = {
        createaddition: 0,
        electroenergetics: 1,
        powergrid: 2,
        create_new_age: 3
    }[system]
    const label = tier.labels[labelIndex]

    if (system === 'powergrid') {
        const registry = Java.loadClass('org.patryk3211.powergrid.electricity.wire.registry.WireRegistry')
        const wire = registry.forItem(Item.of(universalId).getItem())
        const resistance = aocUiFormatNumber(wire.resistancePerItem() * wire.itemsPerMeter())
        event.lines.add(Text.of(`PG/${label}: `).color('#55FFFF').append(Text.of(
            `${aocUiFormatNumber(wire.maximumCurrent())}A | ${aocUiFormatNumber(wire.maximumLength())}m | ${resistance}ohm/m | ${aocUiFormatNumber(wire.itemsPerMeter())}item/m`
        ).color('#AAAAAA')))
        return
    }

    if (system === 'createaddition') {
        // This enum constructs registered item stacks in its static initializer.
        // Loading it at client-script startup is too early, so resolve it lazily.
        const wireTypes = Java.loadClass('com.mrh0.createaddition.energy.WireType')
        const wireType = wireTypes.of(nativeStack.getItem())
        const config = Java.loadClass('com.mrh0.createaddition.config.CommonConfig')
        event.lines.add(Text.of(`C&A/${label}: `).color('#55FFFF').append(Text.of(
            `${wireType.transfer()}FE/t | connectors ${config.SMALL_CONNECTOR_MAX_LENGTH.get()}/${config.LARGE_CONNECTOR_MAX_LENGTH.get()}m`
        ).color('#AAAAAA')))
        return
    }

    if (system === 'electroenergetics') {
        // Deferred wire holders are also queried only after registries are ready.
        const wireTypes = Java.loadClass('com.george_vi.electroenergetics.CEEWireTypes')
        const holder = wireTypes[tier.electroType]
        const wireType = holder ? holder.get() : null
        if (wireType) {
            event.lines.add(Text.of(`Electro/${label}: `).color('#55FFFF').append(Text.of(
                `${aocUiFormatNumber(wireType.getMaxLength())}m | ${aocUiFormatNumber(wireType.getResistance())}ohm/m | ${aocUiFormatNumber(wireType.getMaxTemperature())}C | ${wireType.insulated() ? 'insulated' : 'bare'}`
            ).color('#AAAAAA')))
            if (wireType.insulated()) {
                event.lines.add(Text.of('  Insulation: ').color('#55FFFF').append(Text.of(
                    `${aocUiFormatNumber(wireType.maxInsulationVoltage())}V | ${aocUiFormatNumber(wireType.insulationResistance())}ohm`
                ).color('#AAAAAA')))
            }
        }
        return
    }

    if (system === 'create_new_age') {
        const wireType = nativeStack.getItem().getWireType()
        const config = Java.loadClass('org.antarcticgardens.cna.config.CNAConfig')
        event.lines.add(Text.of(`CNA/${label}: `).color('#55FFFF').append(Text.of(
            `${wireType.getConductivity()}FE/t | ${config.getServer().maxWireLength.get()}m`
        ).color('#AAAAAA')))
    }
}

// dynamicTooltips listeners are callbacks referenced by modifyTooltips. Their
// target is an action ID, not an item ID.
ItemEvents.modifyTooltips(event => {
    Object.keys(AOC_UI_WIRE_TIERS).forEach(universalId => {
        event.modify(universalId, tooltip => tooltip.dynamic('aoc_universal_wire'))
    })
})

ItemEvents.dynamicTooltips('aoc_universal_wire', event => {
    const universalId = String(event.item.id)
    const tier = AOC_UI_WIRE_TIERS[universalId]
    if (!tier) return

    // Power Grid adds its native tooltip to every registered wire item. Keep
    // only the item name, then replace that duplicate block with this compact
    // four-mod view.
    while (event.lines.size() > 1) {
        event.lines.remove(event.lines.size() - 1)
    }

    const activeSystem = aocUiBoundSystem(event.item)

    if (activeSystem) {
        event.lines.add(
            Text.of('Active: ').color('#AAAAAA')
                .append(Text.of(AOC_UI_SYSTEM_NAMES[activeSystem]).color('#55FF55'))
        )
    } else {
        event.lines.add(Text.of('Active: none').color('#555555'))
    }

    if (!event.shift) {
        event.lines.add(Text.of('Connects: C&A | Electro | PowerGrid | New Age').color('#AAAAAA'))
        event.lines.add(Text.of('Hold [Shift] for wire specs').color('#555555'))
        return
    }

    event.lines.add(Text.of('Wire specs by mod').color('#FFD55F'))
    ;['createaddition', 'electroenergetics', 'powergrid', 'create_new_age'].forEach(system => {
        try {
            aocUiAddNativeProperties(event, system, tier[system], tier, universalId)
        } catch (error) {
            event.lines.add(Text.of(
                `${AOC_UI_SYSTEM_NAMES[system]} properties unavailable`
            ).color('#FF5555'))
        }
    })
})

NativeEvents.onEvent(AOC_UI_RENDER_GUI_POST, event => {
    const minecraft = AOC_UI_MINECRAFT.getInstance()
    const player = minecraft.player
    if (!player || !minecraft.level || minecraft.screen || minecraft.options.hideGui) return

    let stack = player.getMainHandItem()
    if (!AOC_UI_WIRE_TIERS[String(stack.id)]) stack = player.getOffhandItem()
    if (!AOC_UI_WIRE_TIERS[String(stack.id)]) return

    const system = aocUiBoundSystem(stack)
    if (!system) return

    const graphics = event.getGuiGraphics()
    const font = minecraft.font
    const width = graphics.guiWidth()
    const height = graphics.guiHeight()
    const systemText = Text.of(`Connected through: ${AOC_UI_SYSTEM_NAMES[system]}`).color('#55FFFF')
    const cancelText = Text.of('[Shift] + Left Click: Cancel connection').color('#e3e3e3')

    // Power Grid already renders its native distance line and item requirement
    // icon. Add only the universal system line beneath it to avoid duplication.
    if (system === 'powergrid') {
        graphics.drawCenteredString(font, systemText, Math.floor(width / 2), height - 50, 0xFFFFFF)
        graphics.drawCenteredString(font, cancelText, Math.floor(width / 2), height - 39, 0xFFFFFF)
        return
    }

    const iconX = Math.floor(width / 2) - 8
    const iconY = height - 91
    graphics.fill(iconX - 3, iconY - 3, iconX + 19, iconY + 19, -1728053248)
    graphics.fill(iconX - 2, iconY - 2, iconX + 18, iconY + 18, -16777216)
    graphics.renderItem(stack, iconX, iconY)

    const start = aocUiStartingPosition(stack, system, minecraft.level)
    const target = minecraft.hitResult ? minecraft.hitResult.getLocation() : null
    if (start && target) {
        const distance = Math.round(start.distanceTo(target) * 10) / 10
        const distanceText = Text.of('Distance to starting point: ').color('#FFFFFF')
            .append(Text.of(String(distance)).color('#55FF55'))
        graphics.drawCenteredString(font, distanceText, Math.floor(width / 2), height - 61, 0xFFFFFF)
    }

    graphics.drawCenteredString(font, systemText, Math.floor(width / 2), height - 50, 0xFFFFFF)
    graphics.drawCenteredString(font, cancelText, Math.floor(width / 2), height - 39, 0xFFFFFF)
})
