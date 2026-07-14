<template>
  <div id="app">
    <!-- If we're on the Login route, render router-view (for login content) -->
    <template v-if="isLoginPage">
      <router-view />
    </template>
    <!-- Otherwise (when logged in) do not render router-view here -->
    <template v-else>
      <Sidebar @update:expanded="isSidebarExpanded = $event" />
      <div :class="['main-content', { 'sidebar-expanded': isSidebarExpanded }]">
        <!-- No router-view here to avoid duplicate rendering -->
      </div>
    </template>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue';

export default {
  name: "App",
  components: {
    Sidebar,
  },
  data() {
    return {
      isSidebarExpanded: false,
    };
  },
  computed: {
    // Assume your login route is named "Login"
    isLoginPage() {
      return this.$route.name === 'Login';
    },
  },
};
</script>

<style>
.main-content {
  flex: 1;
  transition: margin-left 0.3s;
  margin-left: 60px;
}

.main-content.sidebar-expanded {
  margin-left: 200px;
  /* Expanded sidebar width */
}

.main-content {
  background: linear-gradient(90deg, #0d47a1, #1565c0);
}
</style>
