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
        <v-card-title primary-title class="headline">
            {{attrValue('name')}} 
            <v-spacer/>
        </v-card-title>
        <v-card-text>
            <table class="pl-3" cellpadding=0 cellspacing=0>
                <tr>
                    <th class="attr-header">Category</th>
                    <th class="attr-header">Property</th>
                    <th class="attr-header">Value</th>
                    <th class="attr-header">Effective</th>
                    <th class="attr-header">Notes</th>
                </tr>
                <tr v-for="(attr,i) in attrs" :key="i" class="attr-row">
                    <td class="attr-category" v-if="i===0 || attrs[i-1].category !== attrs[i].category" >
                        {{attr.category}}
                    </td>
                    <td class="attr-category-empty" v-else> &nbsp; </td>
                    <td class="attr-header" v-if="i===0 || attrs[i-1].tag !== attrs[i].tag" >
                        {{attr.tag}}
                    </td>
                    <td class="attr-header-empty" v-else> &nbsp; </td>
                    <td> {{attr.value}} </td>
                    <td > <span class="attr-date" >{{attrDate(attr.t)}}</span> </td>
                    <td> {{attr.text}} </td>
                </tr>
            </table>
        </v-card-text>
    </v-card>
</div>

</template>
<script>

import Vue from 'vue';
import rbvue from "rest-bundle/index-vue";

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
            console.log(`refresh(})`, this.$route.query);
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
                            t: RETROACTIVE,
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
            var msday = 24 * 3600 * 1000;
            var d = Math.round((t-Date.now()) / msday);
            if (Math.abs(d) < 365) {
                return `${t.toLocaleDateString()} (${d} days)`;
            }
            if (Math.abs(d) < 100 * 365) {
                return `${t.toLocaleDateString()}`;
            }
            return '';
        },
    },
    computed: {
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
        console.log('mounted', this.$route.query);
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
