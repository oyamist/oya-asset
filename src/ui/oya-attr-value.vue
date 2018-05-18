<template>

<div>
    <rb-about v-if="about" :name="componentName">
        <p> Display asset property value
        </p>
        <rb-about-item name="about" value="false" slot="prop">Show this descriptive text</rb-about-item>
        <rb-about-item name="asset" value="required" slot="prop">Asset object</rb-about-item>
        <rb-about-item name="prop" value="required" slot="prop">Asset property name</rb-about-item>
        <rb-about-item name="assetMap" value="null" slot="prop">GUID-asset map for references</rb-about-item>
    </rb-about>

    <v-flex v-if="isReference">
        <a :href="href" >{{assetValue(prop, asset)}}</a>
    </v-flex>
    <v-flex v-else>{{assetValue(prop, asset)}}</v-flex>
</div>

</template>
<script>

import Vue from 'vue';
import rbvue from "rest-bundle/index-vue";
import Asset from '../asset.js';

export default {
    mixins: [ 
        rbvue.mixins.RbAboutMixin, 
    ],
    props: {
        asset: {
            type: Object,
            required: true,
        },
        prop: {
            type: String,
            required: true,
        },
        assetMap: {
            type: Object,
            default: {},
        },
    },
    data: function() {
        return {
        }
    },
    methods: {
        assetValue(prop, asset) {
            return Asset.keyDisplayValue(prop, asset, this.assetMap);
        },
    },
    computed: {
        isReference() {
            var value = this.asset[this.prop];
            var ref = this.assetMap[value];
            return ref && ref !== this.asset;
        },
        href() {
            if (this.isReference) {
                var value = this.asset[this.prop];
                var ref = this.assetMap[value];
                return ref.guid ? `#/asset?guid=${ref.guid}&search=${this.asset.guid}` : null;
            }
            return null;
        },
    },
    mounted() {
    },
}

</script>
<style> 
</style>
