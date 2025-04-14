import { defineStore } from 'pinia';
import { fetchApi, cacheApi } from '@/utils/api';
import defu from 'defu';
import { useUserStore } from './user';

export const usePurchasedWorkflowStore = defineStore('purchased-workflows', {
  state: () => ({
    workflows: {},
  }),
  getters: {
    toArray: (state) => Object.values(state.workflows),
  },
  actions: {
    getById(id) {
      if (!this.workflows) return null;
      return this.workflows[id] || null;
    },
    async saveWorkflow() {
      await chrome.storage.local.set({
        purchased_workflow: JSON.stringify(this.workflows),
      });
    },
    async getClearTextById(id) {
      const target = this.workflows[id];
      if (!target) return null;

      if (new Date(target.term_ends).getTime() <= Date.now()) {
        throw new Error('当前工作流已过期，请重新购买');
      }

      if (target.ciphertext) {
        return target.ciphertext; // todo 使用 workflow_crypto 解密
      }

      const {
        data: { workflow },
      } = await (await fetchApi(`/me/workflows/leases/${id}`)).json();
      // todo 使用workflow_crypto 解密并前端加密
      target.ciphertext = workflow;
      await this.saveWorkflow();
      return workflow;
    },
    async fetchWorkflows(useCache = true) {
      const userStore = useUserStore();
      if (!userStore.user) return;

      const workflows = await cacheApi(
        'purchased-workflows',
        async () => {
          try {
            const response = await fetchApi('/me/workflows/leases');

            if (response.status !== 200) throw new Error(response.statusText);

            const {
              data: { leases },
            } = await response.json();
            const purchasedWorkflows = leases.reduce((acc, item) => {
              item.createdAt = new Date(
                item.created_at || Date.now()
              ).getTime();
              item.termStart = new Date(item.term_starts).getTime();
              item.termEnd = new Date(item.term_ends).getTime();

              acc[item.id] = item;
              return acc;
            }, {});

            return purchasedWorkflows;
          } catch (error) {
            console.error(error);
            return {};
          }
        },
        useCache
      );

      const { purchased_workflow } = await chrome.storage.local.get([
        'purchased_workflow',
      ]);
      const localCache = purchased_workflow
        ? JSON.parse(purchased_workflow)
        : {};
      this.workflows = defu(workflows || {}, localCache);
    },
  },
});
