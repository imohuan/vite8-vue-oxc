<template>
  <div class="flex h-full flex-col overflow-hidden bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
    <!-- 顶部标题栏 -->
    <div class="bg-white py-2">
      <div class="flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <n-icon :component="Icons.Dashboard" :size="36" class="text-indigo-600" />
          <div>
            <h1 class="text-xl font-bold text-gray-800">功能仪表盘</h1>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-sm text-gray-500">用户状态</p>
            <p class="text-lg font-semibold" :class="userStore.isLoggedIn ? 'text-green-600' : 'text-gray-400'">
              {{ userStore.isLoggedIn ? "已登录" : "未登录" }}
            </p>
          </div>
          <n-button v-if="userStore.isLoggedIn" type="error" size="small" @click="userStore.clearUser()">
            <template #icon>
              <n-icon :component="Icons.ExitToApp" />
            </template>
            退出
          </n-button>
          <n-button v-else type="primary" size="small" @click="handleSetUser">
            <template #icon>
              <n-icon :component="Icons.Login" />
            </template>
            登录
          </n-button>
        </div>
      </div>
    </div>

    <div class="w-full flex-1 space-y-3 overflow-y-hidden px-4 py-3 sm:px-6 lg:space-y-4 lg:px-8 lg:py-4">
      <!-- 统计卡片区域 -->
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3 xl:grid-cols-4">
        <!-- 计数器卡片 -->
        <div class="rounded-xl bg-white p-3 shadow-md transition hover:shadow-lg lg:p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="mb-1 text-sm text-gray-500">计数器</p>
              <p class="text-3xl font-bold text-indigo-600">{{ count }}</p>
            </div>
            <n-icon :component="Icons.Add" :size="32" class="text-indigo-400" />
          </div>
          <div class="mt-4 flex gap-2">
            <n-button size="small" @click="inc()" type="primary" ghost>
              <template #icon>
                <n-icon :component="Icons.ArrowUpward" />
              </template>
            </n-button>
            <n-button size="small" @click="dec()" type="primary" ghost>
              <template #icon>
                <n-icon :component="Icons.ArrowDownward" />
              </template>
            </n-button>
            <n-button size="small" @click="reset()" type="default" ghost>
              <template #icon>
                <n-icon :component="Icons.Refresh" />
              </template>
            </n-button>
          </div>
        </div>

        <!-- 用户信息卡片 -->
        <div class="rounded-xl bg-white p-3 shadow-md transition hover:shadow-lg lg:p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="mb-1 text-sm text-gray-500">用户信息</p>
              <p class="text-lg font-semibold text-gray-800">
                {{ userStore.isLoggedIn ? userStore.name : "未登录" }}
              </p>
              <p class="mt-1 text-xs text-gray-400">
                {{ userStore.isLoggedIn ? userStore.email : "请先登录" }}
              </p>
            </div>
            <n-icon :component="Icons.Person" :size="32" class="text-blue-400" />
          </div>
        </div>

        <!-- 防抖统计卡片 -->
        <div class="rounded-xl bg-white p-3 shadow-md transition hover:shadow-lg lg:p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="mb-1 text-sm text-gray-500">防抖统计</p>
              <p class="text-2xl font-bold text-purple-600">
                {{ debounceExecCount }}
              </p>
              <p class="mt-1 text-xs text-gray-400">点击: {{ clickCount }} 次</p>
            </div>
            <n-icon :component="Icons.FilterList" :size="32" class="text-purple-400" />
          </div>
        </div>

        <!-- 事件统计卡片 -->
        <div class="rounded-xl bg-white p-3 shadow-md transition hover:shadow-lg lg:p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="mb-1 text-sm text-gray-500">事件消息</p>
              <p class="text-2xl font-bold text-green-600">
                {{ eventMessages.length }}
              </p>
              <p class="mt-1 text-xs text-gray-400">最新消息数</p>
            </div>
            <n-icon :component="Icons.Notifications" :size="32" class="text-green-400" />
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-5 lg:gap-4">
        <!-- 左侧：功能演示 -->
        <div class="flex min-h-0 flex-col space-y-3 lg:col-span-3 lg:space-y-4">
          <!-- Context 功能演示 -->
          <div class="flex min-h-0 flex-1 flex-col rounded-xl bg-white p-3 shadow-md lg:p-4">
            <h2 class="mb-2 flex items-center gap-2 text-base font-semibold text-gray-700 lg:mb-3 lg:text-lg">
              <n-icon :component="Icons.Settings" :size="20" />
              Context 功能演示
            </h2>

            <div class="grid min-h-0 flex-1 grid-cols-2 gap-3 lg:gap-4">
              <!-- 消息提示 -->
              <div>
                <h3 class="mb-1.5 text-xs font-medium text-gray-600">消息提示</h3>
                <div class="grid grid-cols-2 gap-1.5">
                  <n-button type="success" size="tiny" @click="handleSuccessMessage">
                    <template #icon>
                      <n-icon :component="Icons.CheckCircle" />
                    </template>
                    成功
                  </n-button>
                  <n-button type="error" size="tiny" @click="handleErrorMessage">
                    <template #icon>
                      <n-icon :component="Icons.Error" />
                    </template>
                    错误
                  </n-button>
                  <n-button type="warning" size="tiny" @click="handleWarningMessage">
                    <template #icon>
                      <n-icon :component="Icons.Warning" />
                    </template>
                    警告
                  </n-button>
                  <n-button type="info" size="tiny" @click="handleInfoMessage">
                    <template #icon>
                      <n-icon :component="Icons.Info" />
                    </template>
                    信息
                  </n-button>
                  <n-button type="default" size="tiny" @click="handleLoadingMessage" class="col-span-2">
                    <template #icon>
                      <n-icon :component="Icons.Refresh" />
                    </template>
                    加载
                  </n-button>
                </div>
              </div>

              <!-- 通知 -->
              <div>
                <h3 class="mb-1.5 text-xs font-medium text-gray-600">通知</h3>
                <div class="grid grid-cols-2 gap-1.5">
                  <n-button type="success" size="tiny" @click="handleSuccessNotify">
                    <template #icon>
                      <n-icon :component="Icons.Notifications" />
                    </template>
                    成功
                  </n-button>
                  <n-button type="error" size="tiny" @click="handleErrorNotify">
                    <template #icon>
                      <n-icon :component="Icons.NotificationsActive" />
                    </template>
                    错误
                  </n-button>
                  <n-button type="warning" size="tiny" @click="handleWarningNotify">
                    <template #icon>
                      <n-icon :component="Icons.NotificationImportant" />
                    </template>
                    警告
                  </n-button>
                  <n-button type="info" size="tiny" @click="handleInfoNotify">
                    <template #icon>
                      <n-icon :component="Icons.NotificationsNone" />
                    </template>
                    信息
                  </n-button>
                </div>
              </div>

              <!-- 对话框 -->
              <div>
                <h3 class="mb-1.5 text-xs font-medium text-gray-600">对话框</h3>
                <div class="grid grid-cols-2 gap-1.5">
                  <n-button type="warning" size="tiny" @click="handleConfirmDialog">
                    <template #icon>
                      <n-icon :component="Icons.QuestionAnswer" />
                    </template>
                    确认
                  </n-button>
                  <n-button type="warning" size="tiny" @click="handleWarningDialog">
                    <template #icon>
                      <n-icon :component="Icons.Warning" />
                    </template>
                    警告
                  </n-button>
                  <n-button type="error" size="tiny" @click="handleErrorDialog">
                    <template #icon>
                      <n-icon :component="Icons.ErrorOutline" />
                    </template>
                    错误
                  </n-button>
                  <n-button type="info" size="tiny" @click="handleInfoDialog">
                    <template #icon>
                      <n-icon :component="Icons.Info" />
                    </template>
                    信息
                  </n-button>
                </div>
              </div>

              <!-- 加载条 -->
              <div>
                <h3 class="mb-1.5 text-xs font-medium text-gray-600">加载条</h3>
                <div class="grid grid-cols-2 gap-1.5">
                  <n-button type="primary" size="tiny" @click="handleStartLoading">
                    <template #icon>
                      <n-icon :component="Icons.PlayArrow" />
                    </template>
                    开始
                  </n-button>
                  <n-button type="default" size="tiny" @click="handleFinishLoading">
                    <template #icon>
                      <n-icon :component="Icons.Check" />
                    </template>
                    完成
                  </n-button>
                  <n-button type="error" size="tiny" @click="handleErrorLoading">
                    <template #icon>
                      <n-icon :component="Icons.Close" />
                    </template>
                    错误
                  </n-button>
                  <n-button type="warning" size="tiny" @click="handleSimulateLoading">
                    <template #icon>
                      <n-icon :component="Icons.Refresh" />
                    </template>
                    模拟
                  </n-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 工具功能演示 -->
          <div class="rounded-xl bg-white p-3 shadow-md lg:p-4">
            <h2 class="mb-2 flex items-center gap-2 text-base font-semibold text-gray-700 lg:mb-3 lg:text-lg">
              <n-icon :component="Icons.GridView" :size="20" />
              工具功能演示
            </h2>

            <div class="grid grid-cols-2 gap-3 lg:gap-4">
              <!-- 防抖演示 -->
              <div>
                <h3 class="mb-1.5 text-xs font-medium text-gray-600">Lodash-es 防抖</h3>
                <div class="space-y-1.5">
                  <n-button type="primary" size="tiny" @click="handleDebounceClick" class="w-full">
                    <template #icon>
                      <n-icon :component="Icons.FilterList" />
                    </template>
                    快速点击
                  </n-button>
                  <div class="text-xs text-gray-600">
                    <div>点击: {{ clickCount }}</div>
                    <div>执行: {{ debounceExecCount }}</div>
                  </div>
                </div>
              </div>

              <!-- 事件总线演示 -->
              <div>
                <h3 class="mb-1.5 text-xs font-medium text-gray-600">Mitt 事件总线</h3>
                <div class="space-y-1.5">
                  <div class="flex gap-1.5">
                    <n-button type="success" size="tiny" @click="handleEmitEvent" class="flex-1">
                      <template #icon>
                        <n-icon :component="Icons.Send" />
                      </template>
                      发送
                    </n-button>
                    <n-button type="default" size="tiny" @click="eventMessages = []">
                      <template #icon>
                        <n-icon :component="Icons.Delete" />
                      </template>
                    </n-button>
                  </div>
                  <div
                    v-if="eventMessages.length > 0"
                    class="max-h-20 space-y-1 overflow-y-hidden rounded bg-gray-50 p-1.5"
                  >
                    <div
                      v-for="(msg, index) in eventMessages"
                      :key="index"
                      class="rounded border border-green-200 bg-green-50 p-1 text-[10px] text-gray-700"
                    >
                      {{ msg }}
                    </div>
                  </div>
                  <div v-else class="py-2 text-center text-xs text-gray-400">暂无消息</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：图标和字体演示 -->
        <div class="flex min-h-0 flex-col space-y-3 lg:space-y-4">
          <!-- 图标演示 -->
          <div class="flex min-h-0 flex-1 flex-col rounded-xl bg-white p-3 shadow-md lg:p-4">
            <h2 class="mb-2 flex items-center gap-2 text-base font-semibold text-gray-700 lg:mb-3 lg:text-lg">
              <n-icon :component="Icons.Palette" :size="20" />
              图标演示
            </h2>
            <div class="grid flex-1 grid-cols-4 gap-1.5 sm:grid-cols-5 lg:grid-cols-3 lg:gap-2 xl:grid-cols-4">
              <div
                v-for="(icon, index) in iconList"
                :key="index"
                class="flex cursor-pointer flex-col items-center justify-center rounded-lg bg-gray-50 p-1.5 transition hover:bg-gray-100 lg:p-2"
                @click="handleIconClick(icon.name)"
              >
                <n-icon :component="icon.component" :size="18" class="mb-0.5 text-indigo-600" />
                <span class="text-center text-[9px] leading-tight text-gray-600 lg:text-[10px]">{{ icon.name }}</span>
              </div>
            </div>
          </div>

          <!-- 字体演示 -->
          <div class="rounded-xl bg-white p-3 shadow-md lg:p-4">
            <h2 class="mb-2 flex items-center gap-2 text-base font-semibold text-gray-700 lg:mb-3 lg:text-lg">
              <n-icon :component="Icons.TextFields" :size="20" />
              字体演示
            </h2>
            <div class="space-y-2 lg:space-y-3">
              <div class="rounded-lg bg-gray-50 p-2">
                <p class="mb-1 text-[10px] text-gray-600 lg:text-xs">等宽字体 (FiraCode):</p>
                <p class="font-mono text-[10px] lg:text-xs">
                  const code = "Hello World";
                  <br />
                  0123456789 ABCDEF
                </p>
              </div>
              <div class="rounded-lg bg-gray-50 p-2">
                <p class="mb-1 text-[10px] text-gray-600 lg:text-xs">无衬线字体 (Lato):</p>
                <p class="font-sans text-[10px] lg:text-xs">
                  Hello World! 0123456789
                  <br />
                  你好世界！这是中文示例
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PaletteOutlined,
  TextFieldsOutlined,
  SettingsOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
  WarningOutlined,
  InfoOutlined,
  RefreshOutlined,
  NotificationsOutlined,
  NotificationsActiveRound,
  NotificationImportantRound,
  NotificationsNoneRound,
  QuestionAnswerOutlined,
  ErrorOutlined as ErrorOutline,
  PlayArrowOutlined,
  CheckOutlined,
  CloseOutlined,
  HomeOutlined,
  SearchOutlined,
  FavoriteOutlined,
  PersonOutlined,
  ShoppingCartOutlined,
  MenuOutlined,
  AddOutlined,
  RemoveOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  DownloadOutlined,
  UploadOutlined,
  ShareOutlined,
  StarOutlined,
  StarBorderOutlined,
  ThumbUpOutlined,
  ThumbDownOutlined,
  CommentOutlined,
  ReplyOutlined,
  SendOutlined,
  EmailOutlined,
  PhoneOutlined,
  LocationOnOutlined,
  CalendarTodayOutlined,
  AccessTimeOutlined,
  LockOutlined,
  LockOpenOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  ExitToAppOutlined,
  LogInOutlined,
  AccountCircleOutlined,
  DashboardOutlined,
  ListOutlined,
  GridViewOutlined,
  FilterListOutlined,
  SortOutlined,
  ArrowUpwardOutlined,
  ArrowDownwardOutlined,
  ArrowBackOutlined,
  ArrowForwardOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  MoreVertOutlined,
  MoreHorizOutlined,
} from "@vicons/material";
import { NButton, NIcon } from "naive-ui";
import { ref, onMounted, onUnmounted } from "vue";
import { useUserStore } from "../stores/user";
import { eventBus } from "../core/context";
import { debounce } from "lodash-es";
import { useCounter } from "@vueuse/core";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoading,
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyInfo,
  confirmDialog,
  warningDialog,
  errorDialog,
  infoDialog,
  getContext,
} from "../core/context";

// Store
const userStore = useUserStore();

// VueUse Counter
const { count, inc, dec, reset } = useCounter(0);

// 图标列表
const Icons = {
  Palette: PaletteOutlined,
  TextFields: TextFieldsOutlined,
  Settings: SettingsOutlined,
  CheckCircle: CheckCircleOutlined,
  Error: ErrorOutlined,
  Warning: WarningOutlined,
  Info: InfoOutlined,
  Refresh: RefreshOutlined,
  Notifications: NotificationsOutlined,
  NotificationsActive: NotificationsActiveRound,
  NotificationImportant: NotificationImportantRound,
  NotificationsNone: NotificationsNoneRound,
  QuestionAnswer: QuestionAnswerOutlined,
  ErrorOutline,
  PlayArrow: PlayArrowOutlined,
  Check: CheckOutlined,
  Close: CloseOutlined,
  Home: HomeOutlined,
  Search: SearchOutlined,
  Favorite: FavoriteOutlined,
  Person: PersonOutlined,
  ShoppingCart: ShoppingCartOutlined,
  Menu: MenuOutlined,
  Add: AddOutlined,
  Remove: RemoveOutlined,
  Edit: EditOutlined,
  Delete: DeleteOutlined,
  Save: SaveOutlined,
  Download: DownloadOutlined,
  Upload: UploadOutlined,
  Share: ShareOutlined,
  Star: StarOutlined,
  StarBorder: StarBorderOutlined,
  ThumbUp: ThumbUpOutlined,
  ThumbDown: ThumbDownOutlined,
  Comment: CommentOutlined,
  Reply: ReplyOutlined,
  Send: SendOutlined,
  Email: EmailOutlined,
  Phone: PhoneOutlined,
  LocationOn: LocationOnOutlined,
  CalendarToday: CalendarTodayOutlined,
  AccessTime: AccessTimeOutlined,
  Lock: LockOutlined,
  LockOpen: LockOpenOutlined,
  Visibility: VisibilityOutlined,
  VisibilityOff: VisibilityOffOutlined,
  ExitToApp: ExitToAppOutlined,
  Login: LogInOutlined,
  AccountCircle: AccountCircleOutlined,
  Dashboard: DashboardOutlined,
  List: ListOutlined,
  GridView: GridViewOutlined,
  FilterList: FilterListOutlined,
  Sort: SortOutlined,
  ArrowUpward: ArrowUpwardOutlined,
  ArrowDownward: ArrowDownwardOutlined,
  ArrowBack: ArrowBackOutlined,
  ArrowForward: ArrowForwardOutlined,
  ExpandMore: ExpandMoreOutlined,
  ExpandLess: ExpandLessOutlined,
  ChevronLeft: ChevronLeftOutlined,
  ChevronRight: ChevronRightOutlined,
  MoreVert: MoreVertOutlined,
  MoreHoriz: MoreHorizOutlined,
};

const iconList = [
  { name: "Home", component: Icons.Home },
  { name: "Search", component: Icons.Search },
  { name: "Favorite", component: Icons.Favorite },
  { name: "Person", component: Icons.Person },
  { name: "ShoppingCart", component: Icons.ShoppingCart },
  { name: "Menu", component: Icons.Menu },
  { name: "Add", component: Icons.Add },
  { name: "Remove", component: Icons.Remove },
  { name: "Edit", component: Icons.Edit },
  { name: "Delete", component: Icons.Delete },
  { name: "Save", component: Icons.Save },
  { name: "Download", component: Icons.Download },
  { name: "Upload", component: Icons.Upload },
  { name: "Share", component: Icons.Share },
  { name: "Star", component: Icons.Star },
  { name: "ThumbUp", component: Icons.ThumbUp },
  { name: "Comment", component: Icons.Comment },
  { name: "Send", component: Icons.Send },
  { name: "Email", component: Icons.Email },
  { name: "Phone", component: Icons.Phone },
  { name: "LocationOn", component: Icons.LocationOn },
  { name: "CalendarToday", component: Icons.CalendarToday },
  { name: "Lock", component: Icons.Lock },
  { name: "Dashboard", component: Icons.Dashboard },
];

// 防抖演示
const clickCount = ref(0);
const debounceExecCount = ref(0);

const debouncedHandler = debounce(() => {
  debounceExecCount.value++;
  console.log("防抖执行，当前计数:", debounceExecCount.value);
}, 500);

const handleDebounceClick = () => {
  clickCount.value++;
  debouncedHandler();
};

// 事件总线演示
const eventMessages = ref<string[]>([]);

const handleEmitEvent = () => {
  const timestamp = new Date().toLocaleTimeString();
  const message = `事件触发 - ${timestamp}`;
  eventBus.emit("test", message);
};

const handleSetUser = () => {
  userStore.setUser("仪表盘用户", "dashboard@example.com");
};

// 图标点击处理
const handleIconClick = (iconName: string) => {
  showInfo(`点击了图标: ${iconName}`);
};

// 消息提示处理
const handleSuccessMessage = () => {
  showSuccess("操作成功！这是一条成功消息。");
};

const handleErrorMessage = () => {
  showError("操作失败！这是一条错误消息。");
};

const handleWarningMessage = () => {
  showWarning("请注意！这是一条警告消息。");
};

const handleInfoMessage = () => {
  showInfo("提示信息：这是一条信息消息。");
};

const handleLoadingMessage = () => {
  showLoading("加载中...");
  setTimeout(() => {
    showSuccess("加载完成！");
  }, 2000);
};

// 通知处理
const handleSuccessNotify = () => {
  notifySuccess("成功通知", "这是一条成功通知，包含标题和内容。");
};

const handleErrorNotify = () => {
  notifyError("错误通知", "这是一条错误通知，用于显示重要错误信息。");
};

const handleWarningNotify = () => {
  notifyWarning("警告通知", "这是一条警告通知，提醒用户注意某些事项。");
};

const handleInfoNotify = () => {
  notifyInfo("信息通知", "这是一条信息通知，提供一些有用的信息。");
};

// 对话框处理
const handleConfirmDialog = () => {
  confirmDialog(
    "确认操作",
    "您确定要执行此操作吗？此操作不可撤销。",
    () => {
      showSuccess("已确认操作");
    },
    () => {
      showInfo("已取消操作");
    },
  );
};

const handleWarningDialog = () => {
  warningDialog("警告", "这是一个警告对话框，请仔细阅读内容。", () => {
    showSuccess("已确认警告");
  });
};

const handleErrorDialog = () => {
  errorDialog("错误", "这是一个错误对话框，用于显示错误信息。", () => {
    showInfo("已确认错误");
  });
};

const handleInfoDialog = () => {
  infoDialog("信息", "这是一个信息对话框，用于显示重要信息。", () => {
    showSuccess("已确认信息");
  });
};

// 加载条处理
const handleStartLoading = () => {
  getContext().loadingBar.start();
};

const handleFinishLoading = () => {
  getContext().loadingBar.finish();
};

const handleErrorLoading = () => {
  getContext().loadingBar.error();
};

const handleSimulateLoading = () => {
  const loadingBar = getContext().loadingBar;
  loadingBar.start();
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        loadingBar.finish();
        showSuccess("加载完成！");
      }, 200);
    }
  }, 200);
};

// 监听事件
const eventHandler = (data: unknown) => {
  const timestamp = new Date().toLocaleTimeString();
  eventMessages.value.unshift(`[${timestamp}] 收到事件: ${String(data)}`);
  if (eventMessages.value.length > 5) {
    eventMessages.value = eventMessages.value.slice(0, 5);
  }
};

onMounted(() => {
  // 初始化用户数据
  if (!userStore.isLoggedIn) {
    userStore.setUser("仪表盘用户", "dashboard@example.com");
  }

  // 监听事件总线
  eventBus.on("test", eventHandler);
});

onUnmounted(() => {
  // 清理事件监听
  eventBus.off("test", eventHandler);
});
</script>

<style scoped>
/* vfonts 字体样式 */
.font-mono {
  font-family: "Fira Code", "FiraCode", monospace;
}

.font-sans {
  font-family:
    "Lato",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
}
</style>
