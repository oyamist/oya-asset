
<template>

<div>
    <rb-about v-if="about" :name="componentName">
        <p> Display Inventory assets stored in <i>local/inventory.json</i>
        </p>
        <rb-about-item name="about" value="false" slot="prop">Show this descriptive text</rb-about-item>
        <rb-about-item name="service" value="oya-asset" slot="prop">RestBundle name</rb-about-item>
        <rb-about-item name="title" value="Assets" slot="prop">Control title</rb-about-item>
        <rb-about-item name="itemsPerPage" value="5" slot="prop">Assets displayed per page</rb-about-item>
    </rb-about>

    <v-card>
        <v-card-title primary-title>
            <v-text-field append-icon="search" label="Search" single-line clearable
                :change="searchChanged()" hide-details v-model="search" ></v-text-field>
            <v-spacer/>
            <v-btn primary @click="addAsset()">Add</v-btn>
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
                        {{ cursor.item.type }} </td>
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
                    <v-layout row class="pl-5">
                        <v-flex xs2 class="body-2">Identity</v-flex>
                        <v-flex>
                            <v-layout row v-for="key in Object.keys(cursor.item).sort()" :key="key"
                                v-if="assetValue(key, cursor.item) && keyClass(key, cursor.item)==='identity'"
                                class="">
                                <v-flex xs3 class='body-2'>{{key}}</v-flex>
                                <v-flex >{{assetValue(key, cursor.item)}}</v-flex>
                            </v-layout>
                        </v-flex>
                    </v-layout>
                    <v-layout row class="pl-5">
                        <v-flex xs2 class="body-2">Detail</v-flex>
                        <v-flex>
                            <v-layout row v-for="key in Object.keys(cursor.item).sort()" :key="key"
                                v-if="assetValue(key, cursor.item) && keyClass(key, cursor.item)==='detail'"
                                class="">
                                <v-flex xs3 class='body-2'>{{key}}</v-flex>
                                <v-flex >{{assetValue(key, cursor.item)}}</v-flex>
                            </v-layout>
                        </v-flex>
                    </v-layout>
                    <v-layout row class="pl-5">
                        <v-flex xs2 class="body-2">Status</v-flex>
                        <v-flex>
                            <v-layout row v-for="(dp,i) in statusProps(cursor.item)" :key="i"
                                class="">
                                <v-flex xs3 class='body-2'>{{dp.key}}</v-flex>
                                <v-flex >{{dp.value}}</v-flex>
                            </v-layout>
                        </v-flex>
                    </v-layout>
                </v-container>
            </template>
        </v-data-table>
        <div class="text-xs-center pt-3">
            <v-pagination circle :length="Math.round(0.5+assets.length/itemsPerPage)" 
                v-model="pagination.page" 
                :total-visible="assets.length"></v-pagination>
        </div>
        <v-dialog v-model="showAddDialog" fullscreen transition="dialog-bottom-transition"
           :overlay="false" scrollable >
            <v-card tile>
                <v-toolbar card dark color="primary">
                    <v-btn icon @click.native="showAddDialog=false" dark>
                        <v-icon>close</v-icon>
                    </v-btn>
                    <v-toolbar-title>Add Asset</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
                        <v-btn dark flat @click.native="showAddDialog=false">Save</v-btn>
                    </v-toolbar-items>
                 </v-toolbar>
                 <v-card-text ><!-- NON-TEMPORAL FIELDS ONLY!!!-->
                    <v-select v-bind:items="assetTypes" label="Asset Type" required
                        v-model="newAsset.type">
                    </v-select>
                    <v-text-field label="ID: enter pre-printed asset tag if available" clearable
                        placeholder="(auto-generate)"
                        v-model="newAsset.id"  class="input-group" ></v-text-field>
                    <v-text-field label="Name" clearable
                        placeholder="(auto-generate)"
                        v-model="newAsset.name"  class="input-group" ></v-text-field>
                    <v-text-field :label="assetLabel('Source')" clearable
                        placeholder='(optional)'
                        :hint="(newAsset.sourceHint)"
                        :change='changeNewAssetSource()'
                        v-model="newAsset.source"  class="input-group" ></v-text-field>
                    <v-text-field :label='assetLabel("Vendor")' clearable
                        placeholder='(optional)'
                        v-model="newAsset.vendor"  class="input-group" ></v-text-field>
                    <v-text-field label='Size' clearable
                        placeholder='(optional)'
                        v-model="newAsset.size"  class="input-group" ></v-text-field>
                    <v-text-field label='Hostname' clearable
                        placeholder='(e.g., "oyamist01")'
                        v-if="newAsset.type === 'computer'"
                        v-model="newAsset.hostname"  class="input-group" ></v-text-field>
                    <v-text-field label='Plant Type' clearable
                        placeholder='(e.g., "tomato")'
                        v-if="newAsset.type === 'plant'"
                        v-model="newAsset.plant"  class="input-group" ></v-text-field>
                    <v-text-field label='Variety/Cultivar'  clearable
                        placeholder='(e.g., "Cherokee Purple Heirloom")'
                        v-if="newAsset.type === 'plant'"
                        v-model="newAsset.cultivar"  class="input-group" ></v-text-field>
                    <v-text-field label='Description' multi-line
                        placeholder='(optional)'
                        v-model="newAsset.description"  class="input-group" ></v-text-field>
                 </v-card-text>
            </v-card>
        </v-dialog>
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
            showAddDialog: false,
            assetMap: {},
            page: 1,
            search: "",
            newAsset: this.createNewAsset(),
            pagination: { 
                page: 1, 
                rowsPerPage: 2, 
                descending: false, 
                totalItems: 0,
            },
        }
    },
    methods: {
        assetLabel(text) {
            return `${text}: enter ID of related asset or descriptive text`;
        },
        createNewAsset() {
            return {
                id: "",
                name: "",
                type: this.newAsset && this.newAsset.type || 'asset',
            };
        },
        changeNewAssetSource() {
            var pat = new RegExp(`.*${this.newAsset.source}.*`,"i");
            var newAsset = this.newAsset;
            var assets = this.assets.filter(a=> a.id.match(pat));
            if (assets.length === 1) {
                var asset = assets[0];
                if (this.newAsset.type === asset.type) {
                    if (newAsset.type === 'plant') {
                        newAsset.cultivar = asset.cultivar;
                        newAsset.plant = asset.plant;
                    }
                }
                var sourceHint = `${asset.name} \u2022 ${asset.id} \u2022 ${asset.guid}`;
            } else if (assets.length) {    
                var sourceHint = `${assets.length} matching assets found...`;
            } else {
                var sourceHint = "";
            }
            (sourceHint !== newAsset.sourceHint) && Vue.set(newAsset, 'sourceHint', sourceHint);
        },
        addAsset() {
            console.log("addAsset");
            this.showAddDialog = true;
            this.newAsset = this.createNewAsset();
        },
        statusProps(asset) {
            var status = Object.keys(asset).reduce((acc,key) => {
                var value = asset[key];
                if (typeof value === 'string' && value.match(/^\d\d\d\d-\d\d-\d\dT/)) {
                    acc.push({
                        key,
                        date: value,
                        value: this.assetValue(key, asset),
                    });
                }
                return acc;
            },[]);
            status.sort((a,b) => -(a.date < b.date ? -1 : (a.date === b.date ? 0 : 1)));
            return status;
        },
        assetClick(cursor) {
            cursor.expanded = !cursor.expanded;
            //console.log('assetClick', cursor.expanded);
        },
        keyClass(key, item) {
            if (key === 'id' || key === 'name' || key === 'guid') {
                return 'identity';
            }
            var value = item[key];
            if (typeof value === 'string' && value.match(/^\d\d\d\d-\d\d-\d\dT/)) {
                return 'history';
            }
            return 'detail';
        },
        assetValue(key, asset) {
            var value = asset[key];
            if (key === 'guid') {
                return value;
            } 
            if (typeof value !== 'string') {
                return value;
            } 
            var valueAsset = this.assetMap[value];
            if (valueAsset) {
                return `${valueAsset.name} \u2666 ${valueAsset.id} \u2666 ${valueAsset.type}`;
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
                if (key !== 'begin' && asset.begin) {
                    var begin = new Date(asset.begin);
                    var age = Math.trunc((date - begin)/(24*3600*1000));
                    return `${dateStr} (${-days} days @ ${age} days) \u2666 ${timeStr}`;
                } else {
                    return `${dateStr} (${-days} days) \u2666 ${timeStr}`;
                }
            }
            return value;
        },
        refresh(opts={}) {
            var url = [this.restOrigin(), this.service, 'inventory', 'snapshots'].join('/');
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
            //console.log(`search change ${this.search}`);
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
        assetTypes() {
            return [{
                text: "Plant",
                value: "plant",
            },{
                text: "Computer",
                value: "computer",
            },{
                text: "Nutrient Solution",
                value: "nutrient",
            },{
                text: "Light",
                value: "light",
            },{
                text: "Enclosure (tent, greenhouse, etc.)",
                value: "enclosure",
            },{
                text: "Pump",
                value: "pump",
            },{
                text: "Asset (generic)",
                value: "asset",
            },{
                text: "Vendor",
                value: "vendor",
            },{
                text: "Reservoir (e.g., bucket, tank, etc.)",
                value: "reservoir",
            }].sort((a,b) => a.text < b.text ? -1 : (a.text === b.text ? 0 : 1));
        },
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
