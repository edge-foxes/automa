<template>
  <div
    :class="[!showTab ? 'h-48' : 'h-56']"
    class="absolute top-0 left-0 w-full rounded-b-2xl bg-accent"
  ></div>
  <div
    :class="[!showTab ? 'mb-6' : 'mb-2']"
    class="dark relative z-10 px-5 pt-8 text-white placeholder:text-black"
  >
    <div class="mb-4 flex items-center">
      <h1 class="text-xl font-semibold text-white">旋塔 Automa</h1>
      <div class="grow"></div>
      <ui-button
        v-tooltip.group="'重新加载工作流'"
        icon
        class="mr-2"
        @click="reloadSidePanel()"
      >
        <!--        <v-remixicon name="riRecordCircleLine" />-->
        <RiRefreshLine />
      </ui-button>
      <!--      <ui-button-->
      <!--        v-tooltip.group="-->
      <!--          'Start recording by opening the dashboard. Click to learn more'-->
      <!--        "-->
      <!--        icon-->
      <!--        class="mr-2"-->
      <!--        @click="openDocs"-->
      <!--      >-->
      <!--        <v-remixicon name="riRecordCircleLine" />-->
      <!--      </ui-button>-->
      <ui-button
        v-tooltip.group="
          t(`home.elementSelector.${state.haveAccess ? 'name' : 'noAccess'}`)
        "
        icon
        class="mr-2"
        @click="initElementSelector"
      >
        <v-remixicon name="riFocus3Line" />
      </ui-button>
      <ui-button
        v-tooltip.group="t('common.dashboard')"
        icon
        :title="t('common.dashboard')"
        @click="openDashboard('')"
      >
        <v-remixicon name="riHome5Line" />
      </ui-button>
    </div>
    <ui-tabs
      v-if="showTab"
      v-model="state.activeTab"
      fill
      class="mt-1"
      @change="onTabChange"
    >
      <ui-tab value="purchased"> 已购 </ui-tab>
      <ui-tab value="local">
        {{ t(`home.workflow.type.local`) }}
      </ui-tab>
      <ui-tab v-if="hostedWorkflowStore.toArray.length > 0" value="host">
        {{ t(`home.workflow.type.host`) }}
      </ui-tab>
      <ui-tab v-if="userStore.user?.teams?.length" value="team"> Teams </ui-tab>
    </ui-tabs>
  </div>
  <home-team-workflows
    v-if="state.retrieved"
    v-show="state.activeTab === 'team'"
    :search="state.query"
  />
  <div
    v-if="state.activeTab === 'purchased'"
    class="relative z-20 space-y-2 px-5 pb-5"
  >
    <template v-if="workflows.length">
      <home-workflow-card
        v-for="workflow in workflows"
        :key="workflow.id"
        :workflow="workflow"
        :tab="state.activeTab"
        @execute="executePurchasedWorkflow"
      />

      <div style="height: 30px" />

      <div class="goto-shop-btn">
        <ui-button
          style="width: 100%"
          variant="accent"
          class="mt-6"
          @click="openTab(`https://${ENV_HOST}/products`)"
        >
          获取更多工作流
        </ui-button>
      </div>
    </template>
    <ui-card v-else class="text-center">
      <div style="text-align: center; font-weight: bolder; font-size: 16px">
        发现优质工作流
      </div>
      <div style="text-align: center; font-size: 14px">
        立即获取专业级自动化工作流
      </div>

      <div
        v-for="item in state.suggestedWorkflows.slice(0, 3)"
        :key="item.id"
        class="suggested-workflow"
        @click="openTab(`https://${ENV_HOST}/products/${item.id}`)"
      >
        <div class="summary">
          <div class="name">{{ item.name }}</div>
          <div class="desc">{{ item.description }}</div>
        </div>

        <RiArrowRightSLine class="goto-btn" />
      </div>

      <ui-button
        style="width: 100%"
        variant="accent"
        class="mt-6"
        @click="openTab(`https://${ENV_HOST}/products`)"
      >
        查看更多工作流
      </ui-button>
    </ui-card>
  </div>
  <div
    v-if="state.activeTab !== 'team' && state.activeTab !== 'purchased'"
    class="relative z-20 space-y-2 px-5 pb-5"
  >
    <ui-card v-if="workflowStore.getWorkflows.length === 0" class="text-center">
      <img src="@/assets/svg/alien.svg" />
      <p class="font-semibold">{{ t('message.empty') }}</p>
      <ui-button
        variant="accent"
        class="mt-6"
        @click="openDashboard('/workflows')"
      >
        {{ t('home.workflow.new') }}
      </ui-button>
    </ui-card>
    <template v-else>
      <div class="flex">
        <ui-input
          v-model="state.query"
          :placeholder="`${t('common.search')}...`"
          autocomplete="off"
          prepend-icon="riSearch2Line"
          class="search-input w-full"
        />
      </div>
      <div v-if="pinnedWorkflows.length > 0" class="mt-1 mb-4 border-b pb-4">
        <div class="mb-1 flex items-center text-gray-300">
          <v-remixicon name="riPushpin2Line" size="20" class="mr-2" />
          <span>Pinned workflows</span>
        </div>
        <home-workflow-card
          v-for="workflow in pinnedWorkflows"
          :key="workflow.id"
          :workflow="workflow"
          :tab="state.activeTab"
          :pinned="true"
          class="mb-2"
          @details="openWorkflowPage"
          @update="updateWorkflow(workflow.id, $event)"
          @execute="executeWorkflow"
          @rename="renameWorkflow"
          @delete="deleteWorkflow"
          @toggle-pin="togglePinWorkflow(workflow)"
        />
      </div>
      <div
        :class="{ 'p-2 rounded-lg bg-white': pinnedWorkflows.length === 0 }"
        class="flex items-center"
      >
        <ui-select v-model="state.activeFolder" class="flex-1">
          <option value="">Folder (all)</option>
          <option
            v-for="folder in folderStore.items"
            :key="folder.id"
            :value="folder.id"
          >
            {{ folder.name }}
          </option>
        </ui-select>
        <ui-popover class="ml-2">
          <template #trigger>
            <ui-button>
              <v-remixicon name="riSortDesc" class="mr-2 -ml-1" />
              <span>Sort</span>
            </ui-button>
          </template>
          <div class="w-48">
            <ui-select v-model="sortState.order" block placeholder="Sort order">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </ui-select>
            <ui-select
              v-model="sortState.by"
              :placeholder="t('sort.sortBy')"
              block
              class="mt-2 flex-1"
            >
              <option v-for="sort in sorts" :key="sort" :value="sort">
                {{ t(`sort.${sort}`) }}
              </option>
            </ui-select>
          </div>
        </ui-popover>
      </div>
      <home-workflow-card
        v-for="workflow in workflows"
        :key="workflow.id"
        :workflow="workflow"
        :tab="state.activeTab"
        :pinned="state.pinnedWorkflows.includes(workflow.id)"
        @details="openWorkflowPage"
        @update="updateWorkflow(workflow.id, $event)"
        @execute="executeWorkflow"
        @rename="renameWorkflow"
        @delete="deleteWorkflow"
        @toggle-pin="togglePinWorkflow(workflow)"
      />
    </template>
    <!--    <div-->
    <!--      v-if="state.showSettingsPopup"-->
    <!--      class="fixed bottom-5 left-0 m-4 rounded-lg bg-accent p-4 text-white shadow-md dark:text-black z-10"-->
    <!--    >-->
    <!--      <p class="text-sm leading-tight">-->
    <!--        If the workflow runs for less than 5 minutes, set it to run in the-->
    <!--        background in the-->
    <!--        <a-->
    <!--          href="https://docs.automa.site/workflow/settings.html#workflow-execution"-->
    <!--          class="font-semibold underline"-->
    <!--          target="_blank"-->
    <!--        >-->
    <!--          workflow settings.-->
    <!--        </a>-->
    <!--      </p>-->
    <!--      <v-remixicon-->
    <!--        name="riCloseLine"-->
    <!--        class="absolute top-2 right-2 cursor-pointer text-gray-300 dark:text-gray-600"-->
    <!--        size="20"-->
    <!--        @click="closeSettingsPopup"-->
    <!--      />-->
    <!--    </div>-->
  </div>
</template>
<script setup>
import BackgroundUtils from '@/background/BackgroundUtils';
import HomeTeamWorkflows from '@/components/popup/home/HomeTeamWorkflows.vue';
import HomeWorkflowCard from '@/components/popup/home/HomeWorkflowCard.vue';
import { useDialog } from '@/composable/dialog';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { initElementSelector as initElementSelectorFunc } from '@/newtab/utils/elementSelector';
import RendererWorkflowService from '@/service/renderer/RendererWorkflowService';
import { useFolderStore } from '@/stores/folder';
import { useHostedWorkflowStore } from '@/stores/hostedWorkflow';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { useUserStore } from '@/stores/user';
import { useWorkflowStore } from '@/stores/workflow';
import { arraySorter, parseJSON } from '@/utils/helper';
import automa from '@business';
import { computed, onMounted, shallowReactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';
import { usePurchasedWorkflowStore } from '@/stores/purchasedWorkflow';
import { ENV_HOST } from '@/common/utils/constant';
import { RiRefreshLine, RiArrowRightSLine } from '@remixicon/vue';
import { fetchApi } from '@/utils/api';

const isMV2 = browser.runtime.getManifest().manifest_version === 2;

const { t } = useI18n();
const dialog = useDialog();
const userStore = useUserStore();
const folderStore = useFolderStore();
const workflowStore = useWorkflowStore();
const teamWorkflowStore = useTeamWorkflowStore();
const hostedWorkflowStore = useHostedWorkflowStore();
const purchasedWorkflowStore = usePurchasedWorkflowStore();

useGroupTooltip();

const sorts = ['name', 'createdAt', 'updatedAt', 'mostUsed'];
const savedSorts =
  parseJSON(localStorage.getItem('popup-workflow-sort'), {}) || {};

const sortState = shallowReactive({
  by: savedSorts.sortBy || 'createdAt',
  order: savedSorts.sortOrder || 'desc',
});
const state = shallowReactive({
  query: '',
  teams: [],
  cardHeight: 255,
  retrieved: false,
  haveAccess: true,
  activeTab: 'purchased',
  pinnedWorkflows: [],
  activeFolder: savedSorts.activeFolder,
  showSettingsPopup: isMV2
    ? false
    : parseJSON(localStorage.getItem('settingsPopup'), true) ?? true,
  suggestedWorkflows: [],
});

const pinnedWorkflows = computed(() => {
  if (state.activeTab !== 'local') return [];

  const list = [];
  state.pinnedWorkflows.forEach((workflowId) => {
    const workflow = workflowStore.getById(workflowId);
    if (
      !workflow ||
      !workflow.name
        .toLocaleLowerCase()
        .includes(state.query.toLocaleLowerCase())
    )
      return;

    list.push(workflow);
  });

  return list;
});
const hostedWorkflows = computed(() => {
  if (state.activeTab !== 'host') return [];

  return hostedWorkflowStore.toArray.filter((workflow) =>
    workflow.name.toLocaleLowerCase().includes(state.query.toLocaleLowerCase())
  );
});
const localWorkflows = computed(() => {
  if (state.activeTab !== 'local') return [];

  const filteredLocalWorkflows = workflowStore.getWorkflows.filter(
    ({ name, folderId }) => {
      const isInFolder = !state.activeFolder || state.activeFolder === folderId;
      const nameMatch = name
        .toLocaleLowerCase()
        .includes(state.query.toLocaleLowerCase());

      return isInFolder && nameMatch;
    }
  );

  return arraySorter({
    key: sortState.by,
    order: sortState.order,
    data: filteredLocalWorkflows,
  });
});
const purchasedWorkflows = computed(() => {
  if (state.activeTab !== 'purchased') return [];

  return purchasedWorkflowStore.toArray.filter((workflow) =>
    workflow.name.toLocaleLowerCase().includes(state.query.toLocaleLowerCase())
  );
});
const workflows = computed(() => {
  if (state.activeTab === 'local') {
    return localWorkflows.value;
  }
  if (state.activeTab === 'purchased') {
    return purchasedWorkflows.value;
  }

  return hostedWorkflows.value;
});
const showTab = true;

// function closeSettingsPopup() {
//   state.showSettingsPopup = false;
//   localStorage.setItem('settingsPopup', false);
// }

function togglePinWorkflow(workflow) {
  const index = state.pinnedWorkflows.indexOf(workflow.id);
  const copyData = [...state.pinnedWorkflows];

  if (index === -1) {
    copyData.push(workflow.id);
  } else {
    copyData.splice(index, 1);
  }

  state.pinnedWorkflows = copyData;
  browser.storage.local.set({
    pinnedWorkflows: copyData,
  });
}
async function executeWorkflow(workflow) {
  try {
    await RendererWorkflowService.executeWorkflow(workflow, workflow.options);
    window.close();
  } catch (error) {
    console.error(error);
  }
}
async function executePurchasedWorkflow(workflow) {
  try {
    const data = await purchasedWorkflowStore.getClearTextById(workflow.id);
    await RendererWorkflowService.executeWorkflow(data);
    window.close();
  } catch (error) {
    console.error(error);
  }
}

function updateWorkflow(id, data) {
  return workflowStore.update({
    id,
    data,
  });
}
function renameWorkflow({ id, name }) {
  dialog.prompt({
    title: t('home.workflow.rename'),
    placeholder: t('common.name'),
    okText: t('common.rename'),
    inputValue: name,
    onConfirm: (newName) => {
      updateWorkflow(id, { name: newName });
    },
  });
}
function deleteWorkflow({ id, hostId, name }) {
  dialog.confirm({
    title: t('home.workflow.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name }),
    onConfirm: () => {
      if (state.activeTab === 'local') {
        workflowStore.delete(id);
      } else {
        hostedWorkflowStore.delete(hostId);
      }
    },
  });
}
function openDashboard(url) {
  BackgroundUtils.openDashboard(url);
}
function openTab(url) {
  BackgroundUtils.openTab(url);
}
async function initElementSelector() {
  const [tab] = await browser.tabs.query({
    url: '*://*/*',
    active: true,
    currentWindow: true,
  });
  if (!tab) return;
  initElementSelectorFunc(tab).then(() => {
    window.close();
  });
}
function openWorkflowPage({ id, hostId }) {
  let url = `/workflows/${id}`;

  if (state.activeTab === 'host') {
    url = `/workflows/${hostId}/host`;
  }

  openDashboard(url);
}
function onTabChange(value) {
  localStorage.setItem('popup-tab', value);
}
async function reloadSidePanel() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  state.haveAccess = /^(https?)/.test(tab.url);

  const storage = await browser.storage.local.get('pinnedWorkflows');
  state.pinnedWorkflows = storage.pinnedWorkflows || [];

  await workflowStore.loadData();

  await folderStore.load();
  await userStore.loadUser({ storage: localStorage, ttl: 1000 * 60 * 5 });
  await teamWorkflowStore.loadData();
  await purchasedWorkflowStore.fetchWorkflows();

  await automa('app');

  state.retrieved = true;

  if (state.activeFolder) {
    const folderExist = folderStore.items.some(
      (folder) => folder.id === state.activeFolder
    );
    if (!folderExist) state.activeFolder = '';
  }
}

watch(
  () => [sortState.by, sortState.order, state.activeFolder],
  ([sortBy, sortOrder, activeFolder]) => {
    localStorage.setItem(
      'popup-workflow-sort',
      JSON.stringify({ sortOrder, sortBy, activeFolder })
    );
  }
);

onMounted(async () => {
  fetchApi('/me/products').then((res) =>
    res.json().then((ret) => {
      state.suggestedWorkflows = ret.data.products;
    })
  );
  reloadSidePanel();
});
</script>
<style>
.recording-card {
  transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.suggested-workflow {
  display: flex;
  align-items: center;
  box-shadow: 0 0 2px grey;
  border-radius: 4px;
  margin: 10px 0;
  font-weight: normal;
  padding: 10px 0 10px 10px;
  transition: 200ms;

  &:hover {
    background: whitesmoke;
  }

  .summary {
    flex-grow: 1;
    cursor: pointer;

    > * {
      text-align: left;
    }

    .name {
      color: #6639c0;
      font-size: 14px;
    }

    .desc {
      font-size: 12px;
      color: grey;
    }
  }

  .goto-btn {
    color: #6639c0;
    width: 40px;
    text-align: center;

    transform: scale(0.8, 1.8);
  }
}

.goto-shop-btn {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 10px;
}
</style>
