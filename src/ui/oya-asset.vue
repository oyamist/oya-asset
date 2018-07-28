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
          <v-toolbar class="grey lighten-4" dense>
            <v-breadcrumbs divider="/" justify-end >
                <v-breadcrumbs-item v-for="(item,i) in navItems" 
                    :href="item.href"
                    :key="item.text" >
                    <div class="subheading" > {{ item.text }} </div>
                </v-breadcrumbs-item>
            </v-breadcrumbs>
            <v-spacer/>
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
              <div style="margin-top:0.2em; ">
                <v-btn absolute fab right icon small
                    @click="addAttribute()"
                    color='primary' >
                    <v-icon >add</v-icon>
                </v-btn>
              </div>
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
                <div style="margin-top:0.2em; ">
                  <v-btn absolute fab right icon small
                      @click="addEvent()"
                      color='primary'
                      >
                      <v-icon >add</v-icon>
                  </v-btn>
                </div>
                <v-data-table :headers="historyHeaders" :items="historyAttrs" 
                    item-key="tag"
                    :custom-sort="historyAttrSort"
                    class="elevation-1" >
                    <template slot="items" slot-scope="cursor">
                        <tr>
                            <td class="text-xs-right " style="width:14em" @click="eventAttrClick(cursor)"
                                :title='attrDateTitle(cursor.item.t)'
                                >
                                {{ attrDate(cursor.item.t) }} </td>
                            <td class="text-xs-left " style="width:14em" @click="eventAttrClick(cursor)">
                                {{ cursor.item.tag }} </td>
                            <td class="text-xs-left "  @click="eventAttrClick(cursor)">
                                {{ cursor.item.value }} </td>
                        </tr>
                    </template>
                    <template slot="expand" slot-scope="cursor">
                        <v-card flat color="grey lighten-3">
                            <v-card-text class="pl-5">
                                 <div class='oya-asset-event' v-for="tv in attrHistory(cursor.item.tag)">
                                    <div style='width:14em'>{{dateDisplay(tv.t)}}</div>
                                    <div style='width:14em;'>{{tv.value}}</div>
                                    <div>
                                        <v-btn icon small @click="deleteEvent(cursor.item)"
                                            >
                                            <v-icon color='primary'>delete</v-icon>
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
        {{asset}}
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
            historyAttrs: [],
            activeTab: null,
            tabs: [ 'Attributes', 'History'  ],
        }
    },
    methods: {
        refresh() {
            var guid = this.$route.query.guid;
            var url = [this.restOrigin(), this.service, 'asset', 'guid',guid].join('/');
            this.$http.get(url).then(res=>{
                console.debug('refresh',res);
                var asset = this.asset = res.data;
                asset.begin = new Date(asset.begin);
                asset.end && (asset.end = new Date(asset.end));

                this.attrs = [];
                Object.keys(asset).forEach(key => {
                    if (key === 'tvalues') {
                        // skip
                    } else if (key === 'begin' || key === 'end') {
                        // skip
                    } else {
                        var value = asset[key];
                        var t = value && new Date(value);
                        var attr = {
                            tag: key,
                            value,
                            t,
                        };
                        this.attrs.push(attr);
                    }
                });

                var attrMap = {};
                var historyAttrs = [{
                    tag: 'begin',
                    value: asset.begin,
                    t: asset.begin,
                },{
                    tag: 'end',
                    value: asset.end,
                    t: asset.end,
                }];
                this.historyAttrs = this.tvalues.reduce((acc,tv) => {
                    var attr =  Object.assign({}, tv, {
                        t: new Date(tv.t),
                    });
                    var tag = attr.tag;
                    var curAttr = attrMap[tag];
                    if (curAttr == null) {
                        acc.push(attr);
                        attrMap[tag] = attr;
                    }  else if (curAttr.t.getTime() < attr.t.getTime()) {
                        attrMap[tag] = Object.assign(curAttr, {
                            t: attr.t,
                            value: attr.value,
                        });
                    } 
                    return acc;
                }, historyAttrs);
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
            if (this.historyAttrs) {
                for (var i=this.historyAttrs.length; i-- > 0;) {
                    var attr = this.historyAttrs[i];
                    if (attr && attr.tag === 'name') {
                        return attr.value;
                    }
                }
            }
            return undefined;
        },
        eventAttrClick(cursor) {
            cursor.expanded = !cursor.expanded;
            console.log('click', cursor);
        },
        compareAttrDate(a,b) {
            if (a.t === b.t) {
                var cmp = 0;
            } else if (a.t == null) {
                var cmp = 1;
            } else if (b.t == null) {
                var cmp = -1;
            } else {
                var at = typeof a.t === 'date' ? a.t : new Date(a.t);
                var bt = typeof b.t === 'date' ? b.t : new Date(b.t);
                var cmp  = at.getTime() - bt.getTime()
            }
            return cmp || (cmp = a.tag.localeCompare(b.tag));
        },
        historyAttrSort(items, index, isDesc) {
            if (index === 'tag') {
                items.sort((a,b) => {
                    return isDesc ? -a.tag.localeCompare(b.tag) : a.tag.localeCompare(b.tag);
                });
            } else if (index === 'value') {
                items.sort((a,b) => {
                    return isDesc
                        ? -`${a.value}`.localeCompare(`${b.value}`)
                        : `${a.value}`.localeCompare(`${b.value}`);
                });
            } else {
                items.sort((a,b) => {
                    var cmp = this.compareAttrDate(a,b);
                    return isDesc ? -cmp : cmp;
                });
            };
            return items;
        },
        attrHistory(attr) {
            var tv = this.tvalues.filter(tv => (tv.tag === attr));
            tv.sort((a,b) => -this.compareAttrDate(a,b));
            return tv;
        },
        attrDate(t) {
            if (t == null) {
                return '--';
            }
            if (t.getTime() === RETROACTIVE.getTime()) {
                return '...begin';
            }
            return `${t.toLocaleDateString()}`;
        },
        attrDateTitle(t) {
            if (t == null) {
                return '--';
            }
            if (t.getTime() === RETROACTIVE.getTime()) {
                return '...begin';
            }
            var msday = 24 * 3600 * 1000;
            var d = Math.round((t-this.asset.begin.getTime()) / msday);
            if (Math.abs(d) < 365) {
                return `begin + ${d} days`;
            }
            if (Math.abs(d) < 100 * 365) {
                return `${t.toLocaleDateString()}`;
            }
            return '';
        },
        dateDisplay(t) {
            var date = t && (typeof t === 'date' ? t : new Date(t));
            if (date == null) {
                return '--';
            }
            if (date.getTime() === RETROACTIVE.getTime()) {
                return '__begin__';
            }
            return date.toLocaleString();
        },
        deleteEvent(tv) {
            console.log('delete', tv.t, tv.tag);
        },
        addEvent() {
            console.log('addEvent', this.asset);
        },
        addAttribute() {
            console.log('addAttribute', this.asset);
        },
    },
    computed: {
        headers() {
            return [
                { text: 'Attribute', align: 'right', value: 'tag' },
                { text: 'Value', align: 'left', value: 'value' },
            ];
        },
        historyHeaders() {
            return [
                { text: 'Date', align: 'right', value: 't' },
                { text: 'Event', align: 'left', value: 'tag' },
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
    justify-content: begin;
    align-items: center;
}
</style>
