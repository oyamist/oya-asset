
<template>

<div>
    <rb-about v-if="about" :name="componentName">
        <p> Display Inventory assets stored in <i>inventory.json</i>
        </p>
        <rb-about-item name="about" value="false" slot="prop">Show this descriptive text</rb-about-item>
        <rb-about-item name="service" value="oya-asset" slot="prop">RestBundle name</rb-about-item>
        <rb-about-item name="title" value="Assets" slot="prop">Control title</rb-about-item>
        <rb-about-item name="itemsPerPage" value="5" slot="prop">Assets displayed per page</rb-about-item>
    </rb-about>

    <v-card>
        <v-card-title primary-title>
            <h3> {{title}}</h3>
            <v-spacer/>
            <v-text-field append-icon="search" label="Search" single-line clearable
                :change="searchChanged()" hide-details v-model="search" ></v-text-field>
        </v-card-title>
        <v-data-table v-bind:headers="headers" :items="assets" hide-actions 
            :custom-filter="assetFilter"
            :pagination.sync="pagination"
            v-model="selectedAssets"
            select-all
            v-bind:search="search" class="elevation-1" >
            <template slot="items" slot-scope="cursor">
                <tr >
                    <td >
                        <v-checkbox primary hide-details v-model="cursor.selected" >
                        </v-checkbox>
                    </td>
                    <td class="text-xs-left oya-asset-cell" @click="assetClick(cursor)"> 
                        {{ cursor.item.tag }} </td>
                    <td class="text-xs-left oya-asset-cell" @click="assetClick(cursor)"> 
                        {{ cursor.item.name }} </td>
                    <td class="text-xs-left oya-asset-cell" @click="assetClick(cursor)"> 
                        {{ cursor.item.id }} </td>
                    <td class="text-xs-left oya-asset-cell" @click="assetClick(cursor)"> 
                        {{ cursor.item.guid }} </td>
                </tr>
            </template>
            <template slot="expand" slot-scope="cursor">
                <v-container fluid class="oya-asset-expand">
                    <v-layout row v-for="key in Object.keys(cursor.item).sort()" :key="key"
                        class="pl-5">
                        <v-flex xs2 class='body-2'>{{key}}</v-flex>
                        <v-flex >{{assetValue(key, cursor.item)}}</v-flex>
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

const DATE_VALUE = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d/;

export default {
    mixins: [ 
        rbvue.mixins.RbAboutMixin, 
        rbvue.mixins.RbServiceMixin,
    ],
    props: {
        title: {
            default: 'Assets',
        },
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
            selectedAssets: [],
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
        assetClick(cursor) {
            cursor.expanded = !cursor.expanded;
            //console.log('assetClick', cursor.expanded);
        },
        assetValue(key, item) {
            var value = item[key];
            if (key === 'guid') {
                return value;
            } 
            if (typeof value !== 'string') {
                return value;
            } 
            var asset = this.assetMap[value];
            if (asset) {
                return `${asset.name} \u2666 ${asset.id} \u2666 ${asset.tag}`;
            }

            if (value.match(DATE_VALUE)) {
                var date = new Date(value);
                var msElapsed = Date.now() - date;
                var days = (Math.round(msElapsed / (24*3600*1000))).toFixed(0);
                if (days < 14) {
                    var dateStr = date.toLocaleDateString(navigator.language, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                    });
                } else if (days < 365) {
                    var dateStr = date.toLocaleDateString(navigator.language, {
                        month: 'short',
                        day: 'numeric',
                    });
                } else {
                    var dateStr = date.toLocaleDateString(navigator.language, {
                        month: 'numeric',
                        day: '2-digit',
                        year:'2-digit',
                    });
                }
                var timeStr = date.toLocaleTimeString(navigator.language, {
                    hour: '2-digit',
                    minute: '2-digit',
                });
                if (key !== 'begin' && item.begin) {
                    var begin = new Date(item.begin);
                    var age = Math.trunc((date - begin)/(24*3600*1000));
                    return `${dateStr} (${-days} days @ ${age} days) \u2666 ${timeStr}`;
                } else {
                    return `${dateStr} (${-days} days) \u2666 ${timeStr}`;
                }
            }
            return value;
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
            return values;
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
        assetFilter(items, search, filter, headers) {
            if (!search) {
                return items;
            } 
            this.assets.forEach(item => (item.selected = false));
            this.selectedAssets.forEach(asset => (asset.selected = true));
            var SEARCH = search.toUpperCase();
            var keys = headers.map(hdr=>hdr.value);
            console.log('assetFilter');
            return items.filter((item,i) => {
                return keys.reduce((acc,key) => {
                    var value = item[key];
                    return item.selected || acc 
                        || value && value.toUpperCase().indexOf(SEARCH) >= 0;
                }, false);
            });
        }
    },
    computed: {
        headers() {
            return [
                { text: 'Type', align: 'left', value: 'tag' },
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
