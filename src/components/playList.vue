<template>
    <div>
        <list-item v-for="item in items" :item="item" :video="video" :mini="mini" :key="item.etag"></list-item>
    </div>
</template>

<script>
import listItem from '@/components/listItem'
export default {
    props:{
        items:{
            type:Array,
            required:true,
        },
        video:{
            type:Boolean,
            default:false,
        },
        mini:{
            type:Boolean,
            default:false,
        }
    },
    components:{
        listItem
    },

}
</script>

<style>

</style>