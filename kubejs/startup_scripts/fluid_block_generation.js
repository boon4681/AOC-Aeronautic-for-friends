MBDRegistryEvents.recipeType(event => {
    var UIElement = Java.loadClass('com.lowdragmc.lowdraglib2.gui.ui.UIElement')
    var UITemplate = Java.loadClass('com.lowdragmc.lowdraglib2.gui.ui.UITemplate')
    var Label = Java.loadClass('com.lowdragmc.lowdraglib2.gui.ui.elements.Label')
    var ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
    var Size = Java.loadClass('com.lowdragmc.lowdraglib2.math.Size')
    var IGuiTexture = Java.loadClass('com.lowdragmc.lowdraglib2.gui.texture.IGuiTexture')
    var YogaOverflow = Java.loadClass('org.appliedenergistics.yoga.YogaOverflow')
    var FluidRecipeCapability = Java.loadClass('com.lowdragmc.mbd2.common.capability.recipe.FluidRecipeCapability')
    var ItemRecipeCapability = Java.loadClass('com.lowdragmc.mbd2.common.capability.recipe.ItemRecipeCapability')

    var root = new UIElement().addClasses('panel_bg', 'fluid-block-generation-recipe')
    var first = FluidRecipeCapability.CAP.createXEITemplate().setId('first')
    var second = FluidRecipeCapability.CAP.createXEITemplate().setId('second')
    var secondBlock = ItemRecipeCapability.CAP.createXEITemplate().setId('second_block')
    var under = ItemRecipeCapability.CAP.createXEITemplate().setId('under')
    var equals = new Label().setText('=').addClass('fluid-block-generation-symbol')
    var result = ItemRecipeCapability.CAP.createXEITemplate().setId('result')

    first.getLayout().width(18).height(18)
    first.getStyle().overlayTexture(IGuiTexture.EMPTY)
    second.getLayout().width(18).height(18)
    second.getStyle().overlayTexture(IGuiTexture.EMPTY)

    var inputs = new UIElement().setId('inputs').addClasses('fluid-block-generation-inputs')
    inputs.addChild(first)
    inputs.addChild(second)
    inputs.addChild(secondBlock)
    inputs.addChild(under)

    var sceneSlot = new UIElement().setId('scene_slot').addClasses('fluid-block-generation-scene-slot')

    root.getLayout().width(176).minWidth(176).maxWidth(176).height(88).minHeight(88).maxHeight(88).flexGrow(0).flexShrink(0).overflow(YogaOverflow.HIDDEN)
    root.getStyle().overflowVisible(false)
    sceneSlot.getLayout().width(120).minWidth(120).maxWidth(120).height(72).minHeight(72).maxHeight(72).flexGrow(0).flexShrink(0).overflow(YogaOverflow.HIDDEN)
    sceneSlot.getStyle().overflowVisible(false)

    root.addChild(sceneSlot)
    root.addChild(inputs)
    root.addChild(equals)
    root.addChild(result)


    var template = UITemplate.of(root, ResourceLocation.parse('ldlib2:lss/mc'))
    template.setBuiltinStyles(`
.fluid-block-generation-recipe {
  width: 176;
  height: 88;
  padding: 8;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6;
}
.fluid-block-generation-scene-slot {
  width: 120;
  height: 72;
  align-items: center;
  justify-content: center;
}
.fluid-block-generation-inputs {
  display: none;
}
.fluid-block-generation-inputs-shown {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6;
}
.fluid-block-generation-symbol {
  width: 6;
  height: 8;
  text-align: center;
}
`)

    event.createRecipeType('aoc:fluid_block_generation')
        .setUiTemplate(template)
        .setUiSize(Size.of(176, 88))
        .setXEIVisible(true)
})
