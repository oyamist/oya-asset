
<template>

<div>
    <rb-about v-if="about" :name="componentName">
        <p> Display network informationprogress
        </p>
        <rb-about-item name="about" value="false" slot="prop">Show this descriptive text</rb-about-item>
        <rb-about-item name="service" value="oya-asset" slot="prop">RestBundle name</rb-about-item>
    </rb-about>

    <v-card>
        <v-card-title primary-title>
            <h3> Assets: {{service}}</h3>
            <v-spacer/>
            <v-text-field append-icon="search" label="Search" single-line clearable
                :change="searchChanged()" hide-details v-model="search" ></v-text-field>
        </v-card-title>
        <v-data-table v-bind:headers="headers" :items="assets" hide-actions 
            :pagination.sync="pagination"
            :input="dataInput()"
            v-bind:search="search" class="elevation-1" >
            <template slot="items" slot-scope="asset">
                <tr @click="asset.expanded = !asset.expanded" >
                    <td class="text-xs-left oya-asset-cell"> {{ asset.item.type }} </td>
                    <td class="text-xs-left oya-asset-cell"> {{ asset.item.name }} </td>
                    <td class="text-xs-left oya-asset-cell"> {{ asset.item.id }} </td>
                    <td class="text-xs-left oya-asset-cell"> {{ asset.item.guid }} </td>
                </tr>
            </template>
            <template slot="expand" slot-scope="asset">
                <v-container fluid class="oya-asset-expand">
                    <v-layout row v-for="key in Object.keys(asset.item).sort()" :key="key"
                        class="pl-5">
                        <v-flex xs2 class='body-2'>{{key}}</v-flex>
                        <v-flex >{{assetValue(key, asset.item)}}</v-flex>
                    </v-layout>
                </v-container>
            </template>
        </v-data-table>
        <div class="text-xs-center pt-3">
            <v-pagination circle :length="Math.round(0.5+assets.length/itemsPerPage)" 
                v-model="pagination.page" 
                :total-visible="assets.length"></v-pagination>
        </div>
    </v-card>
</div>

</template>
<script>

import Vue from 'vue';
import rbvue from "rest-bundle/index-vue";

export default {
    mixins: [ 
        rbvue.mixins.RbAboutMixin, 
        rbvue.mixins.RbServiceMixin,
    ],
    props: {
        service: {
            default: 'oya-asset',
        },
        itemsPerPage: {
            default: 3,
        },
    },
    data: function() {
        return {
            assets: [],
            assetMap: {},
            page: 1,
            search: "",
            pagination: { 
                page: 1, 
                rowsPerPage: 2, 
                descending: false, 
                totalItems: 0,
            },
        }
    },
    methods: {
        assetValue(key, item) {
            var value = item[key]
            var asset = key !== 'guid' && this.assetMap[value];
            return asset ? `${asset.name} \u2022 ${asset.id} \u2022 ${asset.type}` : value;
        },
        refresh(opts={}) {
            var url = [this.restOrigin(), this.service, 'assets'].join('/');
            console.log(`refreshing ${url}`);
            this.$http.get(url).then(res=>{
                this.assets = res.data.assets || [];
                this.assetMap = {};
                this.assets.forEach(asset=>this.assetMap[asset.guid] = asset);
                this.pagination.totalItems = this.assets.length;
                this.pagination.rowsPerPage = this.itemsPerPage;
            }).catch(e=>{
                console.error(e);
            });
        },
        dataInput(values) {
            console.log(`data input ${values}`);
        },
        searchChanged() {
            console.log(`search change ${this.search}`);
        },
        link(host) {
            if (host.hostname === 'localhost') {
                return `http://${host.hostname}:8080`;
            } else {
                return `http://${host.hostname}`;
            }
        },
    },
    computed: {
        headers() {
            return [
                { text: 'Type', align: 'left', value: 'type' },
                { text: 'Name', align: 'left', value: 'name' },
                { text: 'Id', align: 'left', value: 'id' },
                { text: 'GUID', align: 'left', value: 'guid' },
            ];
        },
    },
    mounted() {
        this.refresh();
    },
}

</script>
<style> 
.oya-asset-cell {
    width: 25%;
}
.oya-asset-expand {
    background:#eee;
}
</style>
