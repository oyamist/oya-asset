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
        <v-card-title primary-title>
            {{tvalue('id')}} {{tvalue('name')}} 
            <v-spacer/>
            {{$route.query.guid}}
        </v-card-title>
        <v-card-text>
            <table class="pl-3">
                <tr>
                    <th>Property</th>
                    <th>Value</th>
                    <th>Effective</th>
                    <th>Notes</th>
                </tr>
                <tr v-for="(tv,i) in tvalues" :key="i">
                    <td class="tvalue-header">
                        <span v-show="i===0 || tvalues[i-1].tag !== tvalues[i].tag" >
                            {{tv.tag}}
                        </span>
                    </td>
                    <td> {{tv.value}} </td>
                    <td > <span class="tvalue-date" >{{tvDate(tv.t)}}</span> </td>
                    <td> {{tv.text}} </td>
                </tr>
            </table>
        </v-card-text>
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
        }
    },
    methods: {
        refresh() {
            var guid = this.$route.query.guid;
            var url = [this.restOrigin(), this.service, 'asset', 'guid',guid].join('/');
            console.log(`refresh(})`, this.$route.query);
            this.$http.get(url).then(res=>{
                console.log('res',res);
                this.asset = res.data;
                this.asset.tvalues.forEach(tv => (tv.t = new Date(tv.t)));
                this.asset.tvalues.sort((a,b) => {
                    if (a.tag === b.tag) {
                        if (a.t.getTime() === b.t.getTime()) {
                            return 0;
                        }
                        return a.t.getTime() < b.t.getTime() ? 1 : -1;
                    }
                    return a.tag.localeCompare(b.tag);
                });
            }).catch(e=>{
                console.error(e);
            });
        },
        tvalue(tag) {
            var tvalues = this.tvalues;
            for (var i=tvalues.length; i-- > 0;) {
                var tv = tvalues[i];
                if (tv && tv.tag === tag) {
                    return tv.value;
                }
            }
            return undefined;
        },
        tvDate(t) {
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
.tvalue-row {
    padding-top: 0.2em;
}
.tvalue-header {
    font-weight: 500;
}
</style>
