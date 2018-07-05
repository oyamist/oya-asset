<template>

<div>
    <rb-about v-if="about" :name="componentName">
        <p> Display Inventory assets stored in <i>local/inventory.json</i>
        </p>
        <rb-about-item name="about" value="false" slot="prop">Show this descriptive text</rb-about-item>
        <rb-about-item name="service" value="oya-asset" slot="prop">RestBundle name</rb-about-item>
        <rb-about-item name="title" value="Assets" slot="prop">Control title</rb-about-item>
        <rb-about-item name="itemsPerPage" value="10" slot="prop">Assets displayed per page</rb-about-item>
    </rb-about>

    <v-card flat>
        <v-card-title primary-title>
            <v-text-field append-icon="search" label="Search" single-line clearable
                :change="searchChanged()" hide-details v-model="search" ></v-text-field>
            <v-spacer/>
            <v-btn color='primary' @click="addAsset()">Add</v-btn>
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
                        <v-checkbox color='primary' hide-details v-model="cursor.selected" >
                        </v-checkbox>
                    </td>
                    <td class="text-xs-left " @click="assetClick(cursor)" style="width:10%"> 
                        <a :href="`#/asset?guid=${cursor.item.guid}&id=${cursor.item.id}&search=${search||cursor.item.guid}`" 
                            :title='cursor.item.guid'
                            >
                            {{ cursor.item.id }}
                        </a> 
                    </td>
                    <td class="text-xs-left " @click="assetClick(cursor)"> 
                        {{ cursor.item.name }} </td>
                    <td class="text-xs-left " @click="assetClick(cursor)" style="width:10%"> 
                        {{ cursor.item.type }} </td>
                    <td class="text-xs-left" @click="assetClick(cursor)" style="width:10%"> 
                        <div class="oya-inventory-guid" style="width:10em"> {{ cursor.item.guid }} </div>
                    </td>
                </tr>
            </template>
            <template slot="expand" slot-scope="cursor">
                <v-container fluid class="oya-asset-expand">
                    <v-layout row class="pl-5">
                        <v-flex>
                            <v-layout row v-for="key in Object.keys(cursor.item).sort()" :key="key"
                                v-if="assetValue(key, cursor.item) && keyClass(key, cursor.item)==='detail'"
                                class="">
                                <v-flex xs3 class='body-2'>{{key}}</v-flex>
                                <oya-attr-value :prop="key" :asset="cursor.item" :assetMap="assetMap" />
                            </v-layout>
                        </v-flex>
                    </v-layout>
                    <v-layout row class="pl-5 pt-1">
                        <v-flex>
                            <v-layout row v-for="(dp,i) in statusProps(cursor.item)" :key="i"
                                class="">
                                <v-flex class="oya-inventory-time pl-3" xs6>
                                    <oya-attr-value prop="value" :asset="dp" :assetMap="assetMap" />
                                </v-flex>
                                <v-flex xs3 class='body'>{{dp.key}}</v-flex>
                            </v-layout>
                        </v-flex>
                    </v-layout>
                </v-container>
            </template>
        </v-data-table>
        <div class="text-xs-center pt-3">
            <v-pagination circle :length="paginationLength"
                v-model="pagination.page" 
                :total-visible="7"></v-pagination>
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
                        <v-btn dark flat @click.native="onSaveAsset">Save</v-btn>
                    </v-toolbar-items>
                 </v-toolbar>
                 <v-card-text ><!-- NON-TEMPORAL FIELDS ONLY!!!-->
                    <v-select v-bind:items="assetTypes" label="Asset Type" required
                        v-model="newAsset.type">
                    </v-select>
                    <v-text-field label="ID: enter pre-printed asset tag if available" clearable
                        placeholder="(auto-generate)"
                        @input="onIdInput"
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
import Asset from '../asset.js';

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
            default: 10,
        },
    },
    data: function() {
        return {
            assets: [],
            selectedAssets: [],
            filteredItems: [],
            showAddDialog: false,
            assetMap: {},
            page: 1,
            search: this.$route.query.search,
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
        onIdInput(event) {
            this.newAsset.id = this.newAsset.id.toUpperCase();
        },
        assetLabel(text) {
            return `${text}: enter ID of related asset or descriptive text`;
        },
        createNewAsset() {
            var asset = {
                id: "",
                name: "",
                type: this.newAsset && this.newAsset.type || 'asset',
            };
            if (this.filteredItems && this.filteredItems.length === 0 && this.search) {
                asset.id = this.search.toUpperCase();
            }
            Object.defineProperty(asset, "sourceHint", {
                writable: true,
                value: '',
            });;
            return asset;
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
            console.log("addAsset", this.selectedAssets.length);
            this.showAddDialog = true;
            this.newAsset = this.createNewAsset();
        },
        onSaveAsset(event) {
            var url = [this.restOrigin(), this.service, 'asset', 'snapshot'].join('/');
            var upsert = Object.assign({}, this.newAsset);
            (upsert.id === '') && (delete upsert.id);
            (upsert.name === '') && (delete upsert.name);
            var data = {
                upsert,
            }
            console.log(`onSaveAsset(${event})`, data);
            this.$http.post(url,data).then(res=>{
                console.log('res',res);
                this.showAddDialog = false;
                this.refresh();
            }).catch(e=>{
                console.error(e);
            });
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
        },
        keyClass(key, item) {
            if (key === 'id' || key === 'name' || key === 'guid' || key === 'type') {
                return 'identity';
            }
            var value = item[key];
            if (typeof value === 'string' && value.match(/^\d\d\d\d-\d\d-\d\dT/)) {
                return 'history';
            }
            return 'detail';
        },
        assetValue(key, asset) {
            return Asset.keyDisplayValue(key, asset, this.assetMap);
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
            this.filteredItems =  items.filter((item,i) => {
                return keys.reduce((acc,key) => {
                    var value = item[key];
                    return item.selected || acc 
                        || value && value.toUpperCase().indexOf(SEARCH) >= 0;
                }, false);
            });

            return this.filteredItems;
        }
    },
    computed: {
        paginationLength() {
            return this.search 
                ? Math.round(0.5+this.filteredItems.length/this.itemsPerPage)
                : Math.round(0.5+this.assets.length/this.itemsPerPage);
        },
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
                { text: 'ID', align: 'left', value: 'id' },
                { text: 'TYPE', align: 'left', value: 'type' },
                { text: 'NAME', align: 'left', value: 'name' },
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
.oya-asset-expand {
    background:#eee;
}
.oya-inventory-guid {
    font-size: xx-small;
}
.oya-inventory-time {
    border-left: 1px solid #ccc;
}
</style>
