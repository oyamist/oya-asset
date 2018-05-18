import OyaInventory from "./src/ui/oya-inventory.vue";
import OyaAsset from "./src/ui/oya-asset.vue";
import OyaAttrValue from "./src/ui/oya-attr-value.vue";

var components = {
    OyaAsset,
    OyaAttrValue,
    OyaInventory,
}
function plugin(Vue, options) {
    Object.keys(components).forEach( key => Vue.component(key, components[key]));
}

export default {
    install: plugin,
    components,
}
