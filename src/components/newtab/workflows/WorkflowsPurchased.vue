<template>
  <purchased-card
    v-for="workflow in workflows"
    :key="workflow.id"
    :data="workflow"
    :show-details="false"
    @execute="onRunWorkflowClick(workflow)"
  />
</template>
<script setup>
import { computed, onMounted } from 'vue';
import PurchasedCard from '@/components/newtab/shared/PurchasedCard.vue';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import { arraySorter } from '@/utils/helper';
import { usePurchasedWorkflowStore } from '@/stores/purchasedWorkflow';

const props = defineProps({
  search: {
    type: String,
    default: '',
  },
  sort: {
    type: Object,
    default: () => ({
      by: '',
      order: '',
    }),
  },
});

const purchasedWorkflowStore = usePurchasedWorkflowStore();

const workflows = computed(() => {
  const filtered = purchasedWorkflowStore.toArray.filter(({ name }) =>
    name.toLocaleLowerCase().includes(props.search.toLocaleLowerCase())
  );

  return arraySorter({
    data: filtered,
    key: props.sort.by,
    order: props.sort.order,
  });
});

onMounted(async () => {
  await purchasedWorkflowStore.fetchWorkflows(true);
});

const onRunWorkflowClick = async (workflow) => {
  try {
    const data = await purchasedWorkflowStore.getClearTextById(workflow.id);
    await RendererWorkflowService.executeWorkflow(data);
  } catch (err) {
    console.error(err);
    if (err?.message?.includes('已过期')) {
      alert(err.message);
    }
  }
};
</script>
