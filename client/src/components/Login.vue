<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useFolderStore } from '../stores/folders';
const isLoading = ref(false);
const username = ref('');
const password = ref('');
const folderStore = useFolderStore();
const router = useRouter();

const login = async () => {
  isLoading.value = true;
  try {
    await folderStore.login({ username: username.value, password: password.value });
    router.push('/');
  } catch (error) {
    console.error('Ошибка при аутентификации', error);
  } finally {
    isLoading.value = false;
  }
};
</script>


<template>
  <div class="login-container">
    <form @submit.prevent="login">
      <div>
        <label for="username">Username:</label>
        <input id="username" type="text" v-model="username" />
      </div>
      <div>
        <label for="password">Password:</label>
        <input id="password" type="password" v-model="password" />
      </div>
      <button type="submit" :disabled="isLoading">Login</button>
      <v-progress-circular v-if="isLoading" indeterminate></v-progress-circular>
    </form>
  </div>
</template>

