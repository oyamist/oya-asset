<template>

<div>
    <rb-about v-if="about" :name="componentName">
        <p> Display/edit asset 
        </p>
        <rb-about-item name="about" value="false" slot="prop">Show this descriptive text</rb-about-item>
        <rb-about-item name="service" value="oya-asset" slot="prop">RestBundle name</rb-about-item>
        <rb-about-item name="title" value="Asset" slot="prop">Control title</rb-about-item>
    </rb-about>

    <v-card>
        <v-card-title >
            <v-breadcrumbs divider="/" large>
                <v-breadcrumbs-item v-for="(item,i) in navItems" 
                    :href="item.href"
                    :key="item.text" >
                    <div class="title">
                        <span v-if='i===0'>&#x1F50D;</span>
                        {{ item.text }}
                    </div>
                </v-breadcrumbs-item>
            </v-breadcrumbs>
            <v-spacer/>
        </v-card-title>
        <v-data-table v-bind:headers="headers" :items="attrs" hide-actions 
            :custom-sort='attrSort'
            v-model="attrs"
            class="elevation-1" >
            <template slot="items" slot-scope="cursor">
                <tr >
                    <td class="text-xs-left " >
                        {{ attrDate(cursor.item.t) }} </td>
                    <td class="text-xs-left " >
                        {{ cursor.item.tag }} </td>
                    <td class="text-xs-left " >
                        {{ cursor.item.value }} </td>
                </tr>
            </template>
        </v-data-table>
        {{asset}}
        <br>
        {{attrs}}
    </v-card>
</div>

</template>
<script>

import Vue from 'vue';
import rbvue from "rest-bundle/index-vue";
import Asset from '../asset';

const RETROACTIVE = new Date(-8640000000000000); // Javascript minimum date

export default {
    mixins: [ 
        rbvue.mixins.RbAboutMixin, 
        rbvue.mixins.RbServiceMixin,
    ],
    props: {
        title: {
            default: 'Asset',
        },
        service: {
            default: 'oya-asset',
        },
    },
    data: function() {
        return {
            asset: {
                tvalues: [],
            },
            attrs: [],
        }
    },
    methods: {
        refresh() {
            var guid = this.$route.query.guid;
            var url = [this.restOrigin(), this.service, 'asset', 'guid',guid].join('/');
            this.$http.get(url).then(res=>{
                console.log('res',res);
                var asset = this.asset = res.data;
                var tvalues = asset.tvalues || [];
                tvalues.forEach(tv => (tv.t = new Date(tv.t)));
                var attrs = this.attrs = tvalues.map(tv => {
                    var attr = Object.assign({
                        category: tv.tag === 'id' || tv.tag === 'name' 
                            ? 'Identity' : 'History',
                    }, tv);
                    return attr;
                });
                Object.keys(asset).forEach(key => {
                    if (key !== 'tvalues') {
                        attrs.push({
                            category: key === 'guid' ? "Identity" : "Detail",
                            tag: key,
                            value: asset[key],
                            name: asset.name,
                            t: null,
                        });
                        
                    }
                });
                attrs.sort((a,b) => {
                    if (a.category === b.category) {
                        if (a.tag === b.tag) {
                            if (a.t.getTime() === b.t.getTime()) {
                                return 0;
                            }
                            return a.t.getTime() < b.t.getTime() ? 1 : -1;
                        }
                        return a.tag.localeCompare(b.tag);
                    }
                    var order = {
                        Identity: 1,
                        Detail: 2,
                        History: 3,
                    };
                    return order[a.category] < order[b.category] ? -1 : 1;
                });
            }).catch(e=>{
                console.error(e);
            });
        },
        attrValue(tag) {
            var attrs = this.attrs;
            for (var i=attrs.length; i-- > 0;) {
                var attr = attrs[i];
                if (attr && attr.tag === tag) {
                    return attr.value;
                }
            }
            return undefined;
        },
        attrDate(t) {
            if (t == null) {
                return '--';
            }
            if (t.getTime() === RETROACTIVE.getTime()) {
                return '...begin';
            }
            var msday = 24 * 3600 * 1000;
            var begin = new Date(this.asset.begin);
            var d = Math.round((t-begin.getTime()) / msday);
            if (Math.abs(d) < 365) {
                return `${t.toLocaleDateString()} (+${d} days)`;
            }
            if (Math.abs(d) < 100 * 365) {
                return `${t.toLocaleDateString()}`;
            }
            return '';
        },
        attrSort(items, index, isDescending) {
            if (index === 't') {
                items.sort((a,b) => {
                    if (a.t == null && b.t) {
                        return -1;
                    }
                    if (a.t && b.t == null) {
                        return 1;
                    }
                    if (a.t == null && b.t == null || a.t.getTime() === b.t.getTime()) {
                        return a.tag < b.tag 
                            ? -1
                            : (a.tag === b.tag ? 0 : 1);
                    }
                    return a.t < b.t ? -1 : (a.t === b.t ? 0 : 1);
                });

            }
            return items;
        },
    },
    computed: {
        headers() {
            return [
                { text: 'Date', align: 'left', value: 't' },
                { text: 'Name', align: 'left', value: 'name' },
                { text: 'Value', align: 'left', value: 'value' },
            ];
        },
        navItems() {
            var search = this.$route.query.search||'';
            var text = search || 'Search';
            return [{
                text,
                href: `#/search?search=${search}`,
            },{
                text: `${this.attrValue('name')}`,
            }];
        },
        tvalues() {
            return this.asset && this.asset.tvalues || [];
        },
        tags() {
            var map = this.tvalues.reduce((acc,tv) => {
                acc[tv.tag] = true;
                return acc;
            }, {});
            return Object.keys(map).sort((a,b) => a.localeCompare(b));
        },
    },
    mounted() {
        this.refresh();
    },
}

</script>
<style> 
td {
    padding-right: 1em;
}
th {
    padding-right: 1em;
    text-align: left;
    text-decoration: underline;
}
.attr-row {
    padding-top: 0.2em;
}
.attr-row > td {
    border-top: 1px solid #eee;
}
.attr-category {
    margin-top: 1em;
    vertical-align: top;
    padding-left: 0.5em;
    padding-right: 0.5em;
    font-weight: 800;
    font-style: italic;
}
td.attr-category-empty {
    border-top: none;
}
.attr-header {
    font-weight: 500;
    text-decoration: none;
}
td.attr-header-empty {
    border-top: none;
}

</style>
