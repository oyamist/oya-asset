<template>

<v-app id="dev-app" >
   <v-navigation-drawer temporary absolute v-model="drawer" enable-resize-watcher app>
      <v-list dense>
        <div v-for="(item,i) in sidebarMain" :key="i">
          <v-list-tile exact :to="item.href">
            <v-list-tile-action>
                <v-icon >{{item.icon}}</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
                <v-list-tile-title>{{ item.title }}</v-list-tile-title>
            </v-list-tile-content>
            <v-list-tile-action>
                <v-icon v-show='$route.path === item.href'>keyboard_arrow_right</v-icon>
            </v-list-tile-action>
          </v-list-tile>
        </div>
        <v-list-group value="sidebarDeveloper">
            <v-list-tile slot="item">
              <v-list-tile-action> <v-icon >build</v-icon> </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>Developer</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <v-icon dark>keyboard_arrow_down</v-icon>
              </v-list-tile-action>
            </v-list-tile>
            <div v-for="(item,i) in sidebarDeveloper" :key="i">
              <v-list-tile exact :to="item.href">
                <v-list-tile-content>
                    <v-list-tile-title>{{ item.title }}</v-list-tile-title>
                </v-list-tile-content>
                <v-list-tile-action>
                    <v-icon v-show='$route.path === item.href'>keyboard_arrow_right</v-icon>
                </v-list-tile-action>
              </v-list-tile>
            </div>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar app fixed flat class="black" >
        <v-toolbar-side-icon dark @click.stop="drawer = !drawer"></v-toolbar-side-icon>
        <v-toolbar-title class="grey--text text--lighten-1">
            <div style="display:flex; flex-flow:column; ">
                <span class="mr-2" >{{package.name}} {{package.version}}</span>
                <span class="caption">OyaMist asset tracker</span>
            </div>
        </v-toolbar-title>
        <v-spacer/>
        <rb-web-socket/>
    </v-toolbar>
    <v-content class="oya-content">
        <v-container fluid class="oya-router-container">
            <router-view> </router-view>
        </v-container>
    </v-content>
    <rb-alerts ></rb-alerts>
</v-app>

</template> 
<script>

import Search from './search.vue';
import rbvue from "rest-bundle/index-vue";
import appvue from "../../index-vue";

const developerComponents = [{
    title: "Client State",
    href: "/client-state",
}].concat(rbvue.methods.aboutSidebar(appvue.components));

export default {
    name: 'app',
    props: {
        service: {
            default: "oya-assets",
        },
    },
    data() {
        return {
            package: require("../../package.json"),
            drawer: false,
            sidebarMain: [{
                icon: "question_answer",
                title: "Search",
                href: "/search",
            }],
            sidebarDeveloper: developerComponents,
        }
    },
    methods: {
        productionUrl(path) {
            var host = location.port === "4000" 
                ? location.hostname + ":8080"
                : location.host;
            return "http://" + host + path;
        },
    },
    computed: {
    },
    components: {
        Search,
    },
}

</script>
<style> 
.oya-content {
}
.oya-router-container {
    padding-top: 0;
}
</style>
