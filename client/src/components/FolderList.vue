<script setup>
import { onMounted, ref, onUnmounted } from "vue";
import { useFolderStore } from "../stores/folders";

const folderStore = useFolderStore();
const searchQuery = ref("");
const sortOption = ref("createdAt");
const limit = ref(50);
const availableGeos = ["US", "CA", "UK", "HK","IE","AT","BE","IT","CL","ES"];
const availableConcepts = ["1st GEN", "NUTRA", "CBD GUMMIES", "INVEST","BOOK","COUPONS","CROWD","FANSUPPORT"];

onMounted(() => {
  folderStore.fetchFolders();
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

const updateSearchQuery = () => {
  folderStore.setFilter("searchQuery", searchQuery.value);
  folderStore.setDisplayFolders();
};
const handleScroll = () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    limit.value += 50;
  }
};

const getFolderGeo = (folderPath) => {
  if (typeof folderPath !== "string") {
    console.error("getFolderGeo: folderPath должен быть строкой", folderPath);
    return null;
  }

  // Ищем гео-код, окруженный двумя подчеркиваниями, с конца строки
  let geoMatch = folderPath.match(/_([a-z]{2})_(?!.*_([a-z]{2})_)/i);

  // Если гео-код, окруженный двумя подчеркиваниями, не найден, ищем гео-код, предшествующий одному подчеркиванию
  if (!geoMatch) {
    geoMatch = folderPath.match(/_([a-z]{2})(?!.*_([a-z]{2}))/i);
  }

  return geoMatch ? geoMatch[1].toUpperCase() : null;
};

const getFolderConcept = (folderPath) => {
  const match = folderPath.match(/\/([A-Z ]{3,})\//);
  return match ? match[1] : "1st GEN";
};

const updateTimeFilter = (filter) => {
  folderStore.setTimeFilter(filter);
};
</script>

<template>
  <div class="main">
    <header class="header">
      <div class="container">
        <img src="../assets/logo.png" alt="" />
        <h1>Каталог | Toster Media</h1>
        <input
          type="text"
          placeholder="Поиск"
          v-model="searchQuery"
          @input="updateSearchQuery"
        />
      </div>
    </header>
    <div class="main-wrapper container">
      <div class="filters">
        <h3>Фильтры</h3>

        <h2>Концепты</h2>
        <div class="filters-item">
          <div v-for="concept in availableConcepts" :key="concept">
            <input
              type="checkbox"
              :id="concept"
              :value="concept"
              @change="folderStore.toggleConceptSelection(concept)"
            />
            <label :for="concept">{{ concept }}</label>
          </div>
        </div>

        <h2>ГЕО</h2>
        <div class="filters-item">
          <div v-for="geo in availableGeos" :key="geo">
            <input
              type="checkbox"
              :id="geo"
              :value="geo"
              @change="folderStore.toggleGeoSelection(geo)"
            />
            <label :for="geo">{{ geo }}</label>
          </div>
        </div>

        <h2>Дата обновления</h2>
        <div>
          <div class="filters-item">
            <label>
              <input
                type="radio"
                value="today"
                name="timeFilter"
                @change="updateTimeFilter('today')"
              />
              Сегодня
            </label>
            <label>
              <input
                type="radio"
                value="yesterday"
                name="timeFilter"
                @change="updateTimeFilter('yesterday')"
              />
              Вчера
            </label>
            <label>
              <input
                type="radio"
                value="last3days"
                name="timeFilter"
                @change="updateTimeFilter('last3days')"
              />
              3 Дня
            </label>
            <label>
              <input
                type="radio"
                value="last7days"
                name="timeFilter"
                @change="updateTimeFilter('last7days')"
              />
              7 Дней
            </label>
            <label>
              <input
                type="radio"
                value=""
                name="timeFilter"
                @change="updateTimeFilter('')"
                checked
              />
              За все время
            </label>
          </div>
        </div>
      </div>

      <div class="list-wrapper">
        <div class="list-head">
          <button @click="folderStore.filterFoldersFromAToZ()">
            Название
            <img
              v-if="folderStore.isSortedFromAToZ"
              class="sort-icon"
              src="../assets/icons/btn-active.png"
              alt=""
            />
            <img v-else src="../assets/icons/btn.png" alt="" />
          </button>
          <button @click="folderStore.filterFoldersByGeo()">
            ГЕО
            <img
              v-if="folderStore.isSortedFromAToZGeo"
              class="sort-icon"
              src="../assets/icons/btn-active.png"
              alt=""
            />
            <img v-else src="../assets/icons/btn.png" alt="" />
          </button>
          <button @click="folderStore.filterFoldersByConcept()">
            Концепт
            <img
              v-if="folderStore.isSortedFromAToZConcept"
              class="sort-icon"
              src="../assets/icons/btn-active.png"
              alt=""
            />
            <img v-else src="../assets/icons/btn.png" alt="" />
          </button>
          <button @click="folderStore.filterFoldersByCreatedAt()">
            Дата доб.
            <img
              v-if="folderStore.isSortedByCreatedAt"
              class="sort-icon"
              src="../assets/icons/btn-active.png"
              alt=""
            />
            <img v-else src="../assets/icons/btn.png" alt="" />
          </button>
          <button @click="folderStore.filterFoldersByModifiedAt()">
            Дата обн.
            <img
              v-if="folderStore.isSortedByModifiedAt"
              class="sort-icon"
              src="../assets/icons/btn-active.png"
              alt=""
            />
            <img v-else src="../assets/icons/btn.png" alt="" />
          </button>
          <span>Ссылка</span>
          <span>Скачать</span>
        </div>

        <v-progress-circular
          v-if="folderStore.isLoading"
          class="spinner"
          :size="50"
          color="primary"
          indeterminate
        ></v-progress-circular>

        <ul class="list" v-else>
          <li
            class="row"
            v-for="folder in folderStore.displayFolders.slice(0, limit)"
            :key="folder.path"
          >
            <span class="row-name">{{ folder.name }}</span>
            <span class="row-geo">{{ getFolderGeo(folder.path) }}</span>
            <span class="row-concept">{{ getFolderConcept(folder.path) }}</span>
            <span class="row-created">
              {{ folderStore.getFolderDate(folder.createdAt) }}
            </span>
            <span class="row-moded">
              {{ folderStore.getFolderDate(folder.modifiedAt) }}
            </span>

            <a class="row-link" :href="folderStore.getLink(folder.path)">
              <img src="../assets/icons/link-icon.svg" alt="" />
            </a>

            <div class="row-download">
              <v-progress-circular
                v-if="folderStore.downloadingStatuses[folder.path]"
                class="spinner"
                :size="20"
                color="primary"
                indeterminate
              ></v-progress-circular>

              <button class="download-icon" v-else @click="folderStore.downloadFolder(folder.path)">
                <img src="../assets/icons/download.svg" alt="" />
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style></style>
