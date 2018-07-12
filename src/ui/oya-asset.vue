<template>

<div>
    <rb-about v-if="about" :name="componentName">
        <p> Display/edit asset 
        </p>
        <rb-about-item name="about" value="false" slot="prop">Show this descriptive text</rb-about-item>
        <rb-about-item name="service" value="oya-asset" slot="prop">RestBundle name</rb-about-item>
        <rb-about-item name="title" value="Asset" slot="prop">Control title</rb-about-item>
    </rb-about>

    <v-card flat class="mt-3">
        <v-tabs v-model="activeTab" centered>
          <v-toolbar class="grey lighten-4">
            <v-breadcrumbs divider="/" large>
                <v-breadcrumbs-item v-for="(item,i) in navItems" 
                    :href="item.href"
                    :key="item.text" >
                    <div class="title">
                        {{ item.text }}
                    </div>
                </v-breadcrumbs-item>
            </v-breadcrumbs>
          </v-toolbar>
          <v-tabs-bar class="grey lighten-4" >
            <v-tabs-slider color="grey darken-4"></v-tabs-slider>
            <v-tabs-item :href="'#'+tabs[0]" >
                <div style="width:15em"><v-icon>list</v-icon>&nbsp;Attributes</div>
            </v-tabs-item>
            <v-tabs-item :href="'#'+tabs[1]" >
                <div style="width:15em"><v-icon>date_range</v-icon>&nbsp;History</div>
            </v-tabs-item>
          </v-tabs-bar>
          <v-tabs-items>
            <v-tabs-content :id='tabs[0]'>
              <v-card flat>
                <v-data-table v-bind:headers="headers" :items="attrs" 
                    v-model="attrs"
                    class="elevation-1" >
                    <template slot="items" slot-scope="cursor">
                        <tr >
                            <td class="text-xs-right " style="width:14em">
                                {{ cursor.item.tag }} </td>
                            <td class="text-xs-left " >
                                {{ cursor.item.value }} </td>
                        </tr>
                    </template>
                </v-data-table>
              </v-card>
            </v-tabs-content>
            <v-tabs-content :id='tabs[1]'>
              <v-card flat>
                <v-data-table :headers="historyHeaders" :items="eventAttrs" 
                    item-key="tag"
                    class="elevation-1" >
                    <template slot="items" slot-scope="cursor">
                        <tr>
                            <td class="text-xs-right " style="width:14em" @click="eventAttrClick(cursor)">
                                {{ attrDate(cursor.item.t) }} </td>
                            <td class="text-xs-left "  @click="eventAttrClick(cursor)">
                                {{ cursor.item.tag }} </td>
                        </tr>
                    </template>
                    <template slot="expand" slot-scope="cursor">
                        <v-card flat color="grey lighten-3">
                            <v-card-text class="pl-5">
                                 <div class='oya-asset-event' v-for="tv in attrEvents(cursor.item.tag)">
                                    <div>{{new Date(tv.t).toLocaleDateString()}}</div>
                                    <div>
                                        <v-btn icon small @click="deleteEvent(cursor.item)">
                                            <v-icon>delete</v-icon>
                                        </v-btn>
                                    </div>
                                 </div>
                            </v-card-text>
                        </v-card>
                    </template>
                </v-data-table>
              </v-card>
            </v-tabs-content>
          </v-tabs-items>
        </v-tabs>
    </v-card>
</div>

</template>
<script>

import Vue from 'vue';
import rbvue from "rest-bundle/index-vue";
import Asset from '../asset';

const RETROACTIVE = new Date(-8640000000000000); // Javascript minimum date
const V_EVENT = '__event__';

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
            selectedEvents: [],
            eventAttrs: [],
            activeTab: null,
            tabs: [ 'Attributes', 'History'  ],
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
                var allAttrs = tvalues.map(tv => {
                    return Object.assign({}, tv);
                });
                Object.keys(asset).forEach(key => {
                    if (key !== 'tvalues') {
                        allAttrs.push({
                            category: key === 'guid' ? "Identity" : "Detail",
                            tag: key,
                            value: asset[key],
                            name: asset.name,
                            t: null,
                        });
                        
                    }
                });
                allAttrs.sort((a,b) => {
                    if (a.tag === b.tag) {
                        if (a.value === V_EVENT || a.t.getTime() === b.t.getTime()) {
                            return 0;
                        }
                        return a.t.getTime() < b.t.getTime() ? 1 : -1;
                    }
                    return a.tag.localeCompare(b.tag);
                });
                this.eventAttrs = allAttrs.filter(a => {
                    return a.value === V_EVENT;
                });
                var attrMap = {};
                this.attrs = allAttrs.reduce((acc,attr) => {
                    if (attr.value === V_EVENT) {
                        // historical: do nothing
                    } else {
                        var curAttr = attrMap[attr.tag];
                        if (curAttr == null || curAttr.t < attr.t) {
                            acc.push(attr);
                            attrMap[attr.tag] = attr;
                        } 
                    }
                    return acc;
                },[]);
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
        eventAttrClick(cursor) {
            cursor.expanded = !cursor.expanded;
            console.log('click', cursor);
        },
        attrEvents(attr) {
            var tv = this.tvalues.filter(tv => {
                return tv.tag === attr;
            });
            tv.sort((a,b) => {
                a.t === b.t ? 0 : (a.t < b.t ? -1 : 1);
            });
            return tv;
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
        deleteEvent(tv) {
            console.log('delete', tv.t, tv.tag);
        },
    },
    computed: {
        headers() {
            return [
                { text: 'Attribute', align: 'right', value: 'name' },
                { text: 'Value', align: 'left', value: 'value' },
            ];
        },
        historyHeaders() {
            return [
                { text: 'Date', align: 'right', value: 't' },
                { text: 'Event', align: 'left', value: 'name' },
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

.oya-asset-event {
    margin-left: 13em;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>
