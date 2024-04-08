import { defineStore } from "pinia";
import axios from "axios";

const url = process.env.URL;


export const useFolderStore = defineStore("folder", {
  state: () => ({
    folders: [],
    currentPath: "/var/www/lkokuhsl.com/prokls/",
    isLoading: false,
    downloadingStatuses: {},
    displayFolders: [],
    filters: {
      searchQuery: "",
    },
    sortOption: "createdAt",
    isSortedFromAToZ: false,
    isSortedFromAToZGeo: false,
    isSortedFromAToZConcept: false,
    isSortedByCreatedAt: false,
    isSortedByModifiedAt: true,
    selectedTimeFilter: null,
    selectedGeos: [],
    selectedConcepts: [],
  }),
  getters: {
    getLink: (state) => (folder) => {
      console.log(folder);
      const relativePath = folder.replace(state.currentPath, "");

      return `${"https://" + folder + "/index.html"}`;
    },
    getFolderName: () => (folder) => {
      return folder.split("/").pop();
    },
    getFolderDate: () => (date) => {
      const newDate = new Date(date * 1000);
      return newDate.toLocaleString();
    },
    filteredAndSortedFolders: (state) => {
      let result = [...state.folders];

      if (state.filters.searchQuery) {
        result = result.filter((folder) =>
          folder.path.includes(state.filters.searchQuery)
        );
      }

      // Filter by selected geos
      if (state.selectedGeos.length > 0) {
        result = result.filter((folder) =>
          state.selectedGeos.includes(state.getFolderGeo(folder.path))
        );
      }

      if (state.selectedConcepts.length > 0) {
        result = result.filter((folder) =>
          state.selectedConcepts.includes(state.getFolderConcept(folder.path))
        );
      }
      result.sort((a, b) => {
        const timeA = a.modifiedAt || 0;
        const timeB = b.modifiedAt || 0;
        return state.isSortedByModifiedAt ? timeB - timeA : timeA - timeB;
      });

      result = state.filterFoldersByTime(result);

      return result;
    },
  },
  actions: {
    async login({ username, password }) {
      try {
        const response = await axios.post(
          "https://folders-ws.vercel.app/api/login",
          {
            username: username,
            password: password,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const token = response.data.token;
        localStorage.setItem("authToken", token);
      } catch (error) {
        console.error("Ошибка при аутентификации", error);
      }
    },

    async fetchFolders() {
      this.isLoading = true;

      const cachedFolders = sessionStorage.getItem(
        `folders-${this.currentPath}`
      );
      if (cachedFolders) {
        this.folders = JSON.parse(cachedFolders);
      } else {
        try {
          const token = localStorage.getItem("authToken"); // Получение токена из localStorage
          const headers = token ? { Authorization: `Bearer ${token}` } : {}; // Создание заголовка, если токен существует

          const response = await axios.get(
            `https://folders-ws.vercel.app/folders?path=${encodeURIComponent(
              this.currentPath
            )}`,
            { headers }
          );
          this.folders = response.data.directories;
          sessionStorage.setItem(
            `folders-${this.currentPath}`,
            JSON.stringify(this.folders)
          );
        } catch (error) {
          console.error("Ошибка при получении папок: ", error);
        }
      }

      this.isLoading = false;
      this.setDisplayFolders();
    },

    setDisplayFolders() {
      this.displayFolders = this.filteredAndSortedFolders;
    },

    sortFoldersFromAToZ() {
      this.isSortedFromAToZ = !this.isSortedFromAToZ;
      if (this.isSortedFromAToZ) {
        this.displayFolders.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        this.displayFolders.sort((a, b) => b.name.localeCompare(a.name));
      }
    },

    setFilter(filterType, value) {
      this.filters[filterType] = value;
      this.setDisplayFolders();
    },

    setSortOption(sortOption) {
      this.sortOption = sortOption;
      this.setDisplayFolders();
    },

    downloadFolder(folderPath) {
      console.log(folderPath);
      this.downloadingStatuses[folderPath] = true;

      const url = `https://folders-ws.vercel.app/download?path=${encodeURIComponent(
        `/var/www/${folderPath}`
      )}`;
      axios
        .get(url, { responseType: "blob" })
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", folderPath.split("/").pop() + ".zip");
          document.body.appendChild(link);
          link.click();
        })
        .catch((error) => console.error("Download error:", error))
        .finally(() => (this.downloadingStatuses[folderPath] = false));
    },

    getFolderGeo(folderPath) {
      if (typeof folderPath !== "string") {
        console.error(
          "getFolderGeo: folderPath должен быть строкой",
          folderPath
        );
        return "";
      }

      let geoMatch = folderPath.match(/_([a-z]{2})_(?!.*_([a-z]{2})_)/i);
      if (!geoMatch) {
        geoMatch = folderPath.match(/_([a-z]{2})(?!.*_([a-z]{2}))/i);
      }

      return geoMatch ? geoMatch[1].toUpperCase() : "";
    },
    getFolderConcept(folderPath) {
      const match = folderPath.match(/\/([A-Z ]{3,})\//);
      return match ? match[1] : "1st GEN";
    },

    filterFoldersByGeo() {
      this.isSortedFromAToZGeo = !this.isSortedFromAToZGeo;

      const sortedFolders = this.displayFolders.slice().sort((a, b) => {
        const geoA = this.getFolderGeo(a.path) || "";
        const geoB = this.getFolderGeo(b.path) || "";

        if (!this.isSortedFromAToZGeo) {
          return geoB.localeCompare(geoA);
        }

        return geoA.localeCompare(geoB);
      });

      this.displayFolders = sortedFolders;
    },
    filterFoldersFromAToZ() {
      this.isSortedFromAToZ = !this.isSortedFromAToZ;

      const sortedFolders = this.displayFolders.slice().sort((a, b) => {
        const geoA = a.name || "";
        const geoB = b.name || "";

        if (!this.isSortedFromAToZ) {
          return geoB.localeCompare(geoA);
        }

        return geoA.localeCompare(geoB);
      });

      this.displayFolders = sortedFolders;
    },
    filterFoldersByConcept() {
      this.isSortedFromAToZConcept = !this.isSortedFromAToZConcept;

      const sortedFolders = this.displayFolders.slice().sort((a, b) => {
        const geoA = this.getFolderConcept(a.path) || "";
        const geoB = this.getFolderConcept(b.path) || "";

        if (!this.isSortedFromAToZConcept) {
          return geoB.localeCompare(geoA);
        }

        return geoA.localeCompare(geoB);
      });

      this.displayFolders = sortedFolders;
    },
    filterFoldersByCreatedAt() {
      this.isSortedByCreatedAt = !this.isSortedByCreatedAt;

      const sortedFolders = this.displayFolders.slice().sort((a, b) => {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;

        if (!this.isSortedByCreatedAt) {
          return timeB - timeA;
        }

        return timeA - timeB;
      });

      this.displayFolders = sortedFolders;
    },
    filterFoldersByModifiedAt() {
      this.isSortedFromAToZ = false;
      this.isSortedFromAToZConcept = false;
      this.isSortedFromAToZGeo = false;

      this.isSortedByModifiedAt = !this.isSortedByModifiedAt;

      const sortedFolders = this.displayFolders.slice().sort((a, b) => {
        const timeA = a.modifiedAt || 0;
        const timeB = b.modifiedAt || 0;

        if (!this.isSortedByModifiedAt) {
          return timeB - timeA;
        }

        return timeA - timeB;
      });

      this.displayFolders = sortedFolders;
    },
    toggleGeoSelection(geo) {
      const index = this.selectedGeos.indexOf(geo);
      if (index === -1) {
        this.selectedGeos.push(geo);
      } else {
        this.selectedGeos.splice(index, 1);
      }
      this.setDisplayFolders(); // Refresh the display folders after updating the selection
    },
    toggleConceptSelection(concept) {
      const index = this.selectedConcepts.indexOf(concept);
      if (index === -1) {
        this.selectedConcepts.push(concept);
      } else {
        this.selectedConcepts.splice(index, 1);
      }
      this.setDisplayFolders(); // Refresh the display folders after updating the selection
    },
    setTimeFilter(timeFilter) {
      this.selectedTimeFilter = timeFilter;
      this.setDisplayFolders();
    },
    filterFoldersByTime(folders) {
      if (!this.selectedTimeFilter) return folders;

      const now = new Date();
      return folders.filter((folder) => {
        const folderDate = new Date(folder.modifiedAt * 1000);
        switch (this.selectedTimeFilter) {
          case "today":
            return folderDate.toDateString() === now.toDateString();
          case "yesterday":
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            return folderDate.toDateString() === yesterday.toDateString();
          case "last3days":
            const last3Days = new Date(now);
            last3Days.setDate(now.getDate() - 3);
            return folderDate >= last3Days;
          case "last7days":
            const last7Days = new Date(now);
            last7Days.setDate(now.getDate() - 7);
            return folderDate >= last7Days;
          default:
            return true;
        }
      });
    },
  },
});
