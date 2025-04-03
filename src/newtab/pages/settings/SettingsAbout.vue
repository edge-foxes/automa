<template>
  <div class="max-w-lg">
    <div class="bg-box-transparent mb-2 inline-block rounded-full p-3">
      <img src="@/assets/svg/logo.svg" class="w-14" />
    </div>
    <p class="text-2xl font-semibold">旋塔 Automa</p>
    <p class="mb-2 mt-1">Version: {{ extensionVersion }}</p>
    <p class="text-gray-600 dark:text-gray-200">
      旋塔 Automa
      是一个浏览器自动化工具，它允许您轻松创建自动化任务，如点击按钮、填写表单、复制文本等.
    </p>
    <br />
    <p class="text-gray-600 dark:text-gray-200">
      Powered by
      <a
        href="https://www.automa.site"
        target="_blank"
        class="text-blue-500 hover:underline"
        >Automa
      </a>
    </p>
  </div>
</template>
<script setup>
/* eslint-disable camelcase */
import { useGroupTooltip } from '@/composable/groupTooltip';
import { useStore } from '@/stores/main';
import { onMounted } from 'vue';
import browser from 'webextension-polyfill';

useGroupTooltip();
const store = useStore();

const extensionVersion = browser.runtime.getManifest().version;

onMounted(async () => {
  if (store.contributors) return;

  try {
    const response = await fetch(
      'https://api.github.com/repositories/412741449/contributors'
    );
    const contributors = (await response.json()).reduce(
      (acc, { type, avatar_url, login, html_url }) => {
        if (type !== 'Bot') {
          acc.push({
            username: login,
            url: html_url,
            avatar: avatar_url,
          });
        }

        return acc;
      },
      []
    );

    store.contributors = contributors;
  } catch (error) {
    console.error(error);
  }
});
</script>
