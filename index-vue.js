import OyaInventory from "./src/ui/oya-inventory.vue";

var components = {
    OyaInventory,

}
function plugin(Vue, options) {
    Object.keys(components).forEach( key => Vue.component(key, components[key]));
}

export default {
    install: plugin,
    components,
}
