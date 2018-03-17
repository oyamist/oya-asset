import OyaAssets from "./src/ui/oya-assets.vue";

var components = {
    OyaAssets,

}
function plugin(Vue, options) {
    Object.keys(components).forEach( key => Vue.component(key, components[key]));
}

export default {
    install: plugin,
    components,
}
