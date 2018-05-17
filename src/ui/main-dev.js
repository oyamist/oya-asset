import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import Vuetify from 'vuetify';
import axios from 'axios';
import VueAxios from 'vue-axios';
import rbvue from 'rest-bundle/index-vue';

import App from './app.vue';
import Search from './search.vue';
import ClientState from './client-state.vue';
import OyaAsset from './oya-asset.vue';
import appvue from "../../index-vue";
require('./stylus/main.styl')

Vue.use(VueAxios, axios);
Vue.use(Vuex);
Vue.use(Vuetify);
Vue.use(VueRouter);
Vue.use(rbvue);
Vue.use(appvue);

var routes = [{
        path: '/',
        redirect: "/search"
    },{
        path: '/search',
        component: Search,
    },{
        path: '/client-state',
        component: ClientState,
    },{
        path: '/asset',
        component: OyaAsset,
    },
];
routes = routes.concat(rbvue.methods.aboutRoutes());
routes = routes.concat(rbvue.methods.aboutRoutes(appvue.components));

const router = new VueRouter({
    routes
})

const store = new Vuex.Store({
    // your application store
});

new Vue({
    el: '#app',
    router,
    store,
    render: h => h(App),
    components: {
        Search,
        ClientState,
    },
})
