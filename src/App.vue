<template>
  <n-config-provider class="h-full">
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <n-loading-bar-provider>
            <ContextInitializer />
            <RouterView />
          </n-loading-bar-provider>
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import {
  NConfigProvider,
  NMessageProvider,
  NNotificationProvider,
  NDialogProvider,
  NLoadingBarProvider,
} from "naive-ui";
import { initContext } from "./core/context";

// 内部组件：用于在 Provider 内部初始化 context
// 这个组件确保 context 在所有 Provider 内部正确初始化
const ContextInitializer = {
  setup() {
    // 在 Provider 内部调用，此时 composables 可以正常工作
    initContext();
    return () => null; // 不渲染任何内容
  },
};
</script>
