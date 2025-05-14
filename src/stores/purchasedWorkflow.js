import { defineStore } from 'pinia';
import { fetchApi, cacheApi } from '@/utils/api';
import defu from 'defu';
import { decryptData, encryptData } from '@vortana/src/workflow_crypto';
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

      const userStore = useUserStore();
      const userId = userStore.user.id.replace(/-/g, '');
      const encoder = new TextEncoder();
      const key = encoder.encode(userId);

      if (target.ciphertext) {
        const json = await decryptData(target.ciphertext, key);
        return JSON.parse(json);
      }

      const {
        data: { encrypted_workflow },
      } = await (await fetchApi(`/me/workflows/leases/${id}`)).json();
      const json = await decryptData(encrypted_workflow);

      const workflow = JSON.parse(json);
      workflow.id = id;
      const wfJSON = JSON.stringify(workflow);
      target.ciphertext = await encryptData(wfJSON, key);
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
              item.version = item.workflow.latest_version;
              delete item.workflow;
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
      for (const [id, item] of Object.entries(localCache)) {
        if (!workflows[id]) {
          workflows[id] = item;
        } else {
          const oldVersion = item.version.number;
          workflows[id] = defu(workflows[id], item);
          if (oldVersion !== workflows[id].version.number) {
            delete workflows[id].ciphertext;
            delete item.ciphertext;
          }
        }
      }
      this.workflows = defu(workflows || {}, localCache);
      this.saveWorkflow();
    },
  },
});
